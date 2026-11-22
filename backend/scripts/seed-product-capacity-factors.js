require('dotenv/config');
const fs = require('node:fs'),
	{ randomUUID } = require('node:crypto');
for (const [key, file] of [
	['DATABASE_URL', 'app_url'],
	['CSRF_SECRET', 'csrf']
])
	if (!process.env[key] && fs.existsSync('/run/secrets/' + file))
		process.env[key] = fs.readFileSync('/run/secrets/' + file, 'utf8').trim();
const { loadConfig } = require('../src/config/environment');
const { createDatabase, withTransaction } = require('../src/config/database');
const { guardDemo } = require('./sqlserver-demo-guard');
const repo = require('../src/shared/business-repository');
const decimal = require('../src/shared/decimal');
const productCodes = require('./product-catalog-fixture').products.map((p) => p.code);
// Dữ liệu đồ án hư cấu: ước lượng khối lượng quy đổi = thể tích (lít) * 1.05 (chai/lon + bao bì), dùng cho capacity factor KG.
async function main() {
	const config = loadConfig();
	if (config.db.machine !== 'warehouse-sqlserver')
		throw new Error('PORTABLE_DOCKER_TARGET_REQUIRED');
	const pool = createDatabase(config.DATABASE_URL);
	try {
		await withTransaction(pool, async (c) => {
			await guardDemo(c, config);
			await c.raw(
				"DECLARE @r int; EXEC @r=sp_getapplock @Resource=N'warehouse:product-capacity-factors-20261103',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'PRODUCT_FACTOR_SEED_LOCK',1;"
			);
			const [[done]] = await c.execute(
				"SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='catalog.productCapacityFactor.completed'"
			);
			if (done) {
				console.log('PRODUCT_CAPACITY_FACTORS_ALREADY_INITIALIZED_NO_REFILL');
				return;
			}
			const [[actor]] = await c.execute(
				"SELECT id FROM TaiKhoan WHERE code=N'UC01_DEMO_warehouse' AND status='ACTIVE'"
			);
			if (!actor) throw new Error('CAPACITY_FACTOR_SEED_ACTOR_REQUIRED');
			const unit = await repo.one(c, 'DonViTinh', { code: 'KG', dimension: 'MASS' });
			if (!unit) throw new Error('KG_CAPACITY_UNIT_REQUIRED');
			const capacityUnitId = unit.id;
			const [[clock]] = await c.execute(
				'SELECT CONVERT(varchar(23),SYSUTCDATETIME(),121) AS effective_at'
			);
			const [products] = await c.execute(
				"SELECT id,code,volume_ml FROM ThanhPham WHERE status='ACTIVE' AND code IN (" +
					productCodes.map(() => '?').join(',') +
					') ORDER BY id',
				productCodes
			);
			if (products.length !== productCodes.length)
				throw new Error('APPROVED_PRODUCT_SET_REQUIRED');
			const summary = {
				capacityUnitId: String(capacityUnitId),
				inserted: 0,
				preserved: 0,
				products: products.length,
				sample: []
			};
			for (const p of products) {
				const existing = await repo.one(c, 'HeSoChiemCho', {
					product_id: p.id,
					capacity_unit_id: capacityUnitId
				});
				if (!existing) {
					const exact = decimal.positive(p.volume_ml) * 105n;
					if (exact % 100n) throw new Error('PRODUCT_FACTOR_PRECISION_REVIEW_REQUIRED');
					const factor = decimal.format(exact / 100n, 9);
					decimal.positive(factor, 9);
					const id = await repo.insert(c, 'HeSoChiemCho', {
						product_id: p.id,
						capacity_unit_id: capacityUnitId,
						revision: 1,
						factor_per_base: factor,
						effective_at: clock.effective_at
					});
					await repo.audit(
						c,
						{ accountId: null, system: true },
						'catalog.productCapacityFactor.seed',
						'HeSoChiemCho',
						id,
						null,
						{
							productCode: p.code,
							capacityUnitId: String(capacityUnitId),
							factorPerBase: factor
						},
						randomUUID()
					);
					summary.inserted++;
					summary.sample.push({ product: p.code, factorPerBase: factor });
				} else summary.preserved++;
			}
			await repo.audit(
				c,
				{ accountId: null, system: true },
				'catalog.productCapacityFactor.completed',
				'DonViTinh',
				capacityUnitId,
				null,
				{
					productCodes,
					inserted: summary.inserted,
					preserved: summary.preserved,
					noRefill: true
				},
				randomUUID()
			);
			console.log(
				JSON.stringify({
					...summary,
					mode: 'FILL_MISSING_ONLY',
					note: 'Hệ số ước lượng từ thể tích, dữ liệu đồ án hư cấu'
				})
			);
		});
	} finally {
		await pool.end();
	}
}
main().catch((error) => {
	console.error(
		'PRODUCT_CAPACITY_FACTOR_SEED_FAILED ' +
			(/^[A-Z0-9_]+$/.test(error.message)
				? error.message
				: error.code || 'CONFIGURATION_OR_CONFLICT')
	);
	process.exitCode = 1;
});
