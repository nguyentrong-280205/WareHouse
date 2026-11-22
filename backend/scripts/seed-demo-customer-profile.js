const { readFileSync, existsSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const { loadConfig } = require('../src/config/environment');
const { createDatabase, withTransaction } = require('../src/config/database');
const { code } = require('../src/modules/auth/simple-demo');
const { audit } = require('../src/shared/business-repository');
const { guardDemo } = require('./sqlserver-demo-guard');

const username = 'khach01';
const customerCode = 'UC01_DEMO_customer';
const action = 'customers.demoDeliveryProfile.seed';
const profile = {
	name: 'Nguyễn Đình Trọng',
	address: 'Quận Gò Vấp Thành Phố HCM',
	phone: '0847402602'
};

async function main() {
	for (const [key, file] of [
		['DATABASE_URL', '/run/secrets/app_url'],
		['CSRF_SECRET', '/run/secrets/csrf']
	])
		if (!process.env[key] && existsSync(file))
			process.env[key] = readFileSync(file, 'utf8').trim();
	const config = loadConfig();
	if (config.db.machine !== 'warehouse-sqlserver') throw new Error('PORTABLE_TARGET_REQUIRED');
	const pool = createDatabase(config.DATABASE_URL);
	try {
		const status = await withTransaction(pool, async (c) => {
			await guardDemo(c, config);
			const [[customer]] = await c.execute(
				'SELECT k.id,k.name,k.address,k.phone FROM KhachHang k WITH (UPDLOCK,HOLDLOCK) JOIN TaiKhoan a WITH (HOLDLOCK) ON a.customer_id=k.id JOIN VaiTroQuyen r ON r.id=a.role_id WHERE k.code=? AND a.login=? AND a.code=? AND r.code=?',
				[customerCode, username, code(username), customerCode]
			);
			if (!customer) throw new Error('DEMO_CUSTOMER_LINK_REQUIRED');
			const [[completed]] = await c.execute(
				"SELECT TOP (1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action=? AND target_type='KhachHang' AND target_id=?",
				[action, customer.id]
			);
			if (completed) return 'ALREADY_SEEDED';
			const changedFields = Object.keys(profile).filter(
				(field) => customer[field] !== profile[field]
			);
			if (changedFields.length)
				await c.execute(
					'UPDATE KhachHang SET name=?,address=?,phone=?,version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?',
					[profile.name, profile.address, profile.phone, customer.id]
				);
			await audit(
				c,
				{ accountId: null, system: true },
				action,
				'KhachHang',
				String(customer.id),
				null,
				{ username, changedFields },
				randomUUID()
			);
			return 'SEEDED';
		});
		console.log('DEMO_CUSTOMER_PROFILE_' + status);
	} finally {
		await pool.end();
	}
}

main().catch((error) => {
	console.error(
		/^[A-Z0-9_]+$/.test(error.message) ? error.message : 'DEMO_CUSTOMER_PROFILE_FAILED'
	);
	process.exitCode = 1;
});
