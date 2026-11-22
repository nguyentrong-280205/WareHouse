// One-time local demo fix: receipts.allocate (role "Quản lý kho") is the only permission that can pick a
// confirmed finished-goods QC line in /lookups/allocation-sources, but that lookup filters productQc lines
// by workshop scope only (PhieuNhapKhoThanhPham has no warehouse_id to filter by instead). No "Quản lý kho"
// account had workshop scope, so the finished-goods receipt form's QC dropdown was always empty. Mirrors the
// precedent grant-qc-workshop-scope.js (qc01, 03/11/2026): additive only, guard/transaction/audit/no-regrant.
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
const workshopCodes = ['XSX002', 'XSX003', 'XSX004'];
async function main() {
	const config = loadConfig();
	if (config.db.machine !== 'warehouse-sqlserver') throw Error('PORTABLE_TARGET_REQUIRED');
	const pool = createDatabase(config.DATABASE_URL);
	try {
		const result = await withTransaction(pool, async (c) => {
			await require('./sqlserver-demo-guard').guardDemo(c, config);
			await c.raw(
				"DECLARE @r int; EXEC @r=sp_getapplock @Resource=N'warehouse:manager-workshop-scope-20261104',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'MANAGER_SCOPE_LOCK',1;"
			);
			const [[done]] = await c.execute(
				"SELECT TOP(1) id FROM AuditLog WHERE action='warehouseManager.workshopScope.granted' AND actor_kind='SYSTEM'"
			);
			if (done) return { status: 'ALREADY_GRANTED', noRegrant: true };
			const [[account]] = await c.execute(
				"SELECT a.id,a.role_id FROM TaiKhoan a JOIN VaiTroQuyen r ON r.id=a.role_id WHERE a.login='quanlykho01' AND a.status='ACTIVE' AND a.customer_id IS NULL AND r.status='ACTIVE'"
			);
			if (!account) throw Error('MANAGER_ACCOUNT_REQUIRED');
			const permissions = await repo.rolePermissions(c, account.role_id);
			if (!permissions.includes('receipts.allocate'))
				throw Error('MANAGER_ROLE_REVIEW_REQUIRED');
			const [workshops] = await c.execute(
				"SELECT id,code FROM XuongSanXuat WHERE code IN (?,?,?) AND status='ACTIVE' ORDER BY id",
				workshopCodes
			);
			if (workshops.length !== workshopCodes.length)
				throw Error('MANAGER_WORKSHOP_SET_REQUIRED');
			const [existing] = await c.execute(
				'SELECT workshop_id FROM TaiKhoan_Xuong WHERE account_id=?',
				[account.id]
			);
			if (existing.length) throw Error('MANAGER_SCOPE_ALREADY_PRESENT_NO_OVERWRITE');
			for (const w of workshops)
				await c.execute('INSERT INTO TaiKhoan_Xuong(account_id,workshop_id) VALUES(?,?)', [
					account.id,
					w.id
				]);
			await repo.audit(
				c,
				{ accountId: null, system: true },
				'warehouseManager.workshopScope.granted',
				'TaiKhoan',
				account.id,
				null,
				{
					accountId: account.id,
					login: 'quanlykho01',
					workshopIds: workshops.map((w) => w.id),
					workshopCodes: workshops.map((w) => w.code)
				},
				randomUUID()
			);
			return {
				status: 'GRANTED',
				accountId: account.id,
				login: 'quanlykho01',
				workshopIds: workshops.map((w) => w.id),
				workshopCodes: workshops.map((w) => w.code)
			};
		});
		console.log(JSON.stringify(result));
	} finally {
		await pool.end();
	}
}
main().catch((e) => {
	console.error(
		'MANAGER_WORKSHOP_SCOPE_GRANT_FAILED ' +
			(/^[A-Z0-9_]+$/.test(e.message) ? e.message : e.code || 'CONFIGURATION_OR_CONFLICT')
	);
	process.exitCode = 1;
});
