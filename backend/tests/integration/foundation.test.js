require('dotenv/config');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const request = require('supertest');
const { createDatabase, withConnection, withTransaction } = require('../../src/config/database');
const { verifyTestDatabase } = require('../../src/shared/test-guard');
const { loadConfig } = require('../../src/config/environment');
const { createLogger } = require('../../src/shared/logger');
const { createApp } = require('../../src/app');
const { checkConnection } = require('../../src/modules/health/repository');
const { loadMigrations, verifyRecords } = require('../../database/sqlserver/migrator');
const schemaManifest = require('../../database/sqlserver/schema-manifest.json');
process.env.NODE_ENV = 'test';
const url = process.env.TEST_DATABASE_URL;
if (!url || !process.env.TEST_INSTANCE_ID || !process.env.TEST_ALLOWED_ENDPOINTS)
	throw new Error('MISSING_TEST_CONFIGURATION');
const pool = createDatabase(url);
const guard = (connection) =>
	verifyTestDatabase(
		connection,
		url,
		process.env.TEST_ALLOWED_ENDPOINTS,
		process.env.TEST_INSTANCE_ID
	);
beforeAll(() => withConnection(pool, guard));
afterAll(() => pool.end());

test('real SQL Server pool, approved native schema and immutable migration history', async () => {
	await withConnection(pool, async (connection) => {
		await guard(connection);
		const [[metadata]] = await connection.execute(
			"SELECT CONVERT(varchar(128),SERVERPROPERTY('ProductVersion')) AS version, CONVERT(varchar(128),DATABASEPROPERTYEX(DB_NAME(),'Collation')) AS collation"
		);
		assert.match(metadata.version, /^16\./);
		assert.equal(metadata.collation, 'Latin1_General_100_CI_AI_SC');
		const [records] = await connection.execute(
			'SELECT version,checksum,state,finished_at FROM dbo._sql_migrations ORDER BY version'
		);
		assert.equal(verifyRecords(records, loadMigrations()).size, loadMigrations().length);
		assert.deepEqual(
			schemaManifest.migrationVersions,
			loadMigrations().map((m) => m.version),
			'Regenerate source manifest after an approved new migration.'
		);
		const [tables] = await connection.execute(
			"SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID(N'dbo') AND name NOT LIKE N'[_]%'"
		);
		assert.deepEqual(tables.map((t) => t.name).sort(), schemaManifest.tables);
		const [keys] = await connection.execute(
			"SELECT f.name,OBJECT_NAME(f.parent_object_id) AS source_table,OBJECT_NAME(f.referenced_object_id) AS target_table,COL_NAME(k.parent_object_id,k.parent_column_id) AS source_column,COL_NAME(k.referenced_object_id,k.referenced_column_id) AS target_column,k.constraint_column_id AS column_order,f.is_disabled,f.is_not_trusted FROM sys.foreign_keys f JOIN sys.foreign_key_columns k ON k.constraint_object_id=f.object_id WHERE OBJECT_SCHEMA_NAME(f.parent_object_id)='dbo'"
		);
		const grouped = new Map();
		for (const key of keys) {
			assert.equal(key.is_disabled, false, 'Disabled FK: ' + key.name);
			assert.equal(key.is_not_trusted, false, 'Untrusted FK: ' + key.name);
			if (!grouped.has(key.name)) grouped.set(key.name, []);
			grouped.get(key.name).push(key);
		}
		const edges = [...grouped.values()].map((parts) => {
			parts.sort((a, b) => a.column_order - b.column_order);
			return (
				parts[0].source_table +
				'(' +
				parts.map((p) => p.source_column).join(',') +
				')->' +
				parts[0].target_table +
				'(' +
				parts.map((p) => p.target_column).join(',') +
				')'
			);
		});
		assert.deepEqual(edges.sort(), schemaManifest.foreignKeys);
	});
});

test('health and Swagger use mssql repository with isolated foundation app', async () => {
	const config = loadConfig({ ...process.env, NODE_ENV: 'test', DATABASE_URL: url });
	const contract = JSON.parse(readFileSync('../docs/foundation_api.json', 'utf8'));
	const app = createApp(
		config,
		createLogger('silent'),
		() => withConnection(pool, checkConnection),
		contract
	);
	for (const path of ['/health', '/api/v1/health']) {
		const response = await request(app).get(path).expect(200);
		assert.equal(response.body.data.database, 'connected');
	}
	const openapi = await request(app).get('/api/v1/openapi.json').expect(200);
	assert.equal(Object.keys(openapi.body.paths).length, 2);
	await request(app).get('/docs/').expect(200);
	await request(app).post('/api/v1/auth/login').send({}).expect(404);
});

test('parameterized SQL, two accounts/customer, FK/CHECK/decimal precision and rollback', async () => {
	const prefix = 't_stack_' + randomUUID().replaceAll('-', '').slice(0, 16),
		rollback = new Error('ROLLBACK_TEST_FIXTURE');
	const insert =
		'INSERT INTO TaiKhoan(code,login,password_hash,display_name,role_id,customer_id,updated_at) VALUES (?,?,?,?,?,?,SYSUTCDATETIME())';
	await assert.rejects(
		withTransaction(
			pool,
			async (c) => {
				const [[role]] = await c.execute(
					'INSERT INTO VaiTroQuyen(code,name) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?)',
					[prefix, 'Test only']
				);
				const [[customer]] = await c.execute(
					'INSERT INTO KhachHang(code,name,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?,SYSUTCDATETIME())',
					[prefix, 'Test only']
				);
				for (const suffix of ['a', 'b'])
					await c.execute(insert, [
						prefix + suffix,
						prefix + suffix,
						'$argon2id$fixture-not-for-login',
						'Test only',
						role.id,
						customer.id
					]);
				const [[count]] = await c.execute(
					'SELECT COUNT(*) AS n FROM TaiKhoan WHERE customer_id=?',
					[customer.id]
				);
				assert.equal(Number(count.n), 2);
				const [[decimals]] = await c.execute(
					'SELECT CAST(? AS DECIMAL(20,6)) AS quantity,CAST(? AS DECIMAL(20,6)) AS price,CAST(? AS DECIMAL(20,0)) AS amount,CAST(? AS DECIMAL(20,9)) AS factor',
					['123.456789', '1250.123456', '30003', '24.123456789']
				);
				assert.deepEqual(decimals, {
					quantity: '123.456789',
					price: '1250.123456',
					amount: '30003',
					factor: '24.123456789'
				});
				const [[cte]] = await c.execute(
					'WITH exact_values AS(SELECT CAST(? AS DECIMAL(20,6)) AS quantity) SELECT quantity FROM exact_values',
					['99999999999999.123456']
				);
				assert.equal(cte.quantity, '99999999999999.123456');
				throw rollback;
			},
			{ beforeBegin: guard }
		),
		(error) => error === rollback
	);
	// XACT_ABORT ends a transaction on constraint failure. Keep each rejection isolated.
	for (const [login, roleId] of [
		[prefix + 'bad', '9223372036854775806'],
		['UPPERCASE', '0']
	]) {
		await assert.rejects(
			withTransaction(
				pool,
				async (c) => {
					const [[role]] = await c.execute(
						'INSERT INTO VaiTroQuyen(code,name) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?)',
						[prefix, 'Test only']
					);
					await c.execute(insert, [
						prefix + 'bad',
						login,
						'fixture-only',
						'Test only',
						roleId === '0' ? role.id : roleId,
						null
					]);
					throw new Error('EXPECTED_CONSTRAINT_REJECTION');
				},
				{ beforeBegin: guard }
			),
			(error) => error.number === 547
		);
	}
	await withConnection(pool, async (c) => {
		const [[customers]] = await c.execute('SELECT COUNT(*) AS n FROM KhachHang WHERE code=?', [
			prefix
		]);
		const [[accounts]] = await c.execute(
			'SELECT COUNT(*) AS n FROM TaiKhoan WHERE code IN (?,?,?)',
			[prefix + 'a', prefix + 'b', prefix + 'bad']
		);
		assert.equal(Number(customers.n), 0);
		assert.equal(Number(accounts.n), 0);
	});
});

test('row-level locking and release work on two real SQL Server transactions', async () => {
	const rollback = new Error('ROLLBACK_LOCK_FIXTURE');
	await assert.rejects(
		withTransaction(
			pool,
			async (first) => {
				const [marker] = await first.execute(
					'SELECT id FROM _warehouse_environment WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE id=?',
					[1]
				);
				assert.equal(marker.length, 1);
				await withConnection(pool, async (second) => {
					await guard(second);
					await second.beginTransaction();
					try {
						const [locked] = await second.execute(
							'SELECT id FROM _warehouse_environment WITH (UPDLOCK,READPAST,ROWLOCK) WHERE id=?',
							[1]
						);
						assert.deepEqual(locked, []);
					} finally {
						await second.rollback();
					}
				});
				throw rollback;
			},
			{ beforeBegin: guard }
		),
		(error) => error === rollback
	);
});
