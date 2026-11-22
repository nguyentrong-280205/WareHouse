// One-time local demo data: a fresh supplier delivery + confirmed material QC batch with room left to receive,
// because the only existing PO/delivery/QC chain in the Docker demo fixture has already been fully received.
// Fictional data for the project demo, same material/lot/unit already seeded (NVL003 Nắp lon, lô LO-NAP-LON-01).
require('dotenv/config');
const fs = require('node:fs'),
	{ randomUUID } = require('node:crypto');
for (const [key, file] of [
	['DATABASE_URL', 'app_url'],
	['CSRF_SECRET', 'csrf']
])
	if (!process.env[key] && fs.existsSync('/run/secrets/' + file))
		process.env[key] = fs.readFileSync('/run/secrets/' + file, 'utf8').trim();
const { loadConfig } = require('../src/config/environment'),
	{ createDatabase, withTransaction } = require('../src/config/database'),
	repo = require('../src/shared/business-repository');
async function main() {
	const config = loadConfig();
	if (config.db.machine !== 'warehouse-sqlserver' || config.NODE_ENV !== 'development')
		throw new Error('LOCAL_DOCKER_CONFIGURATION_REQUIRED');
	const pool = createDatabase(config.DATABASE_URL);
	try {
		const result = await withTransaction(pool, async (c) => {
			await require('./sqlserver-demo-guard').guardDemo(c, config);
			const [[done]] = await c.execute(
				"SELECT TOP(1) id FROM AuditLog WHERE action='demo.materialReceiptBatch.seed.20261104' AND actor_kind='SYSTEM'"
			);
			if (done) return { status: 'ALREADY_SEEDED' };
			const [[actor]] = await c.execute(
				"SELECT id FROM TaiKhoan WHERE code=N'UC01_DEMO_warehouse' AND status='ACTIVE'"
			);
			if (!actor) throw new Error('DEMO_ACTOR_REQUIRED');
			const [[refLine]] = await c.execute(
				'SELECT id,purchase_id,material_id,unit_id,unit_price FROM ChiTietDonMuaNguyenLieu WHERE id=2'
			);
			const [[refPo]] = await c.execute(
				'SELECT plan_id,supplier_id FROM DonMuaNguyenLieu WHERE id=?',
				[refLine.purchase_id]
			);
			const [[lot]] = await c.execute(
				"SELECT id,material_id FROM LoNguyenLieu WHERE id=3 AND status='ACTIVE'"
			);
			if (!lot || String(lot.material_id) !== String(refLine.material_id))
				throw new Error('REFERENCE_LOT_MISMATCH');
			const qtyBase = '5000.000000',
				unitPrice = refLine.unit_price,
				amount = (Number(qtyBase) * Number(unitPrice)).toFixed(0);
			const poId = await repo.insert(c, 'DonMuaNguyenLieu', {
				code: 'PO-DEMO-' + randomUUID(),
				plan_id: refPo.plan_id,
				supplier_id: refPo.supplier_id,
				currency: 'VND',
				total_amount: amount,
				status: 'HOAN_THANH',
				created_by_id: actor.id
			});
			const poLineId = await repo.insert(c, 'ChiTietDonMuaNguyenLieu', {
				purchase_id: poId,
				material_id: refLine.material_id,
				unit_id: refLine.unit_id,
				qty_base: qtyBase,
				unit_price: unitPrice,
				amount
			});
			const deliveryId = await repo.insert(c, 'DotGiaoNguyenLieu', {
				code: 'GN-DEMO-' + randomUUID(),
				purchase_id: poId,
				warehouse_id: 1,
				received_at: (
					await c.execute('SELECT CONVERT(varchar(23),SYSUTCDATETIME(),121) AS now')
				)[0][0].now,
				status: 'HOAN_THANH',
				created_by_id: actor.id
			});
			const deliveryLineId = await repo.insert(c, 'ChiTietGiaoNL', {
				delivery_id: deliveryId,
				purchase_line_id: poLineId,
				material_lot_id: lot.id,
				unit_id: refLine.unit_id,
				qty_received: qtyBase
			});
			const qcHeaderId = await repo.insert(c, 'BienBanQCNguyenLieu', {
				source_id: deliveryId,
				status: 'DA_XAC_NHAN',
				created_by_id: actor.id,
				confirmed_at: (
					await c.execute('SELECT CONVERT(varchar(23),SYSUTCDATETIME(),121) AS now')
				)[0][0].now
			});
			const qcLineId = await repo.insert(c, 'ChiTietQCNguyenLieu', {
				qc_id: qcHeaderId,
				source_line_id: deliveryLineId,
				material_lot_id: lot.id,
				batch_sequence: 1,
				qty_inspected: qtyBase,
				qty_accepted: qtyBase,
				qty_rejected: '0.000000',
				condition_note:
					'Dữ liệu đồ án hư cấu bổ sung demo 04/11/2026; bản ghi nhập kho nguyên liệu trước đó đã dùng hết lượng QC gốc.'
			});
			await repo.audit(
				c,
				{ accountId: null, system: true },
				'demo.materialReceiptBatch.seed.20261104',
				'ChiTietQCNguyenLieu',
				qcLineId,
				null,
				{
					poId,
					poLineId,
					deliveryId,
					deliveryLineId,
					qcHeaderId,
					qcLineId,
					materialId: refLine.material_id,
					lotId: lot.id,
					qtyBase
				},
				randomUUID()
			);
			return {
				status: 'SEEDED',
				poId: String(poId),
				deliveryId: String(deliveryId),
				qcHeaderId: String(qcHeaderId),
				qcLineId: String(qcLineId),
				materialLotId: String(lot.id),
				qtyBase
			};
		});
		console.log(JSON.stringify(result));
	} finally {
		await pool.end();
	}
}
main().catch((e) => {
	console.error(
		'MATERIAL_RECEIPT_DEMO_BATCH_SEED_FAILED ' +
			(/^[A-Z0-9_]+$/.test(e.message) ? e.message : e.code || 'CONFIGURATION_OR_CONFLICT')
	);
	process.exitCode = 1;
});
