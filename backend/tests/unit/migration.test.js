const assert = require('node:assert/strict');
const { splitSql } = require('../../database/sql.js');
const { loadMigrations, verifyRecords } = require('../../database/sqlserver/migrator.js');
const { withTransaction } = require('../../src/config/database.js');

test('SQL splitter respects semicolons/comments inside literals and rejects unclosed SQL', () => {
  assert.deepEqual(splitSql("-- header\nSELECT 'a;b--c'; /* ; */ SELECT 2;"), ["SELECT 'a;b--c'", 'SELECT 2']);
  assert.throws(() => splitSql("SELECT 'unterminated"));
});
test('migration checksums/order and incomplete DDL states fail closed', () => {
  const native = loadMigrations();
  const migrations = [...native, {version:'999999999999_order_fixture',checksum:'fixture'}];
  const records = migrations.map(m => ({ ...m, state: 'APPLIED', finished_at: '2026-10-12' }));
  assert.equal(verifyRecords(records, migrations).size, migrations.length);
  assert.throws(() => verifyRecords([{ ...records[0], checksum: 'tampered' }], migrations), /CHECKSUM_DRIFT/);
  assert.throws(() => verifyRecords([{ ...records[0], state: 'APPLYING', finished_at: null }], migrations), /INCOMPLETE/);
  assert.throws(() => verifyRecords([records[1]], migrations), /ORDER_DRIFT/);
  assert.equal((native[0].sql.match(/CREATE TABLE dbo\.\[/g)||[]).length,76);
  assert.ok(!/CREATE UNIQUE INDEX[^\n]*ON dbo\.\[TaiKhoan\][^\n]*\[customer_id\]/.test(native[0].sql));
});
test('transaction helper commits success and rolls back failure, always releasing connection', async () => {
  const calls = [];
  const connection = { execute: async () => calls.push('timezone'), beginTransaction: async () => calls.push('begin'),
    commit: async () => calls.push('commit'), rollback: async () => calls.push('rollback'), release: () => calls.push('release') };
  const pool = { getConnection: async () => connection };
  assert.equal(await withTransaction(pool, async () => 'result'), 'result');
  assert.deepEqual(calls, ['begin', 'commit', 'release']);
  calls.length = 0;
  await assert.rejects(withTransaction(pool, async () => { throw new Error('fixture'); }));
  assert.deepEqual(calls, ['begin', 'rollback', 'release']);
  calls.length = 0;
  await assert.rejects(withTransaction(pool, async () => {}, { beforeBegin: async () => { throw new Error('guard'); } }));
  assert.deepEqual(calls, ['release']);
});
