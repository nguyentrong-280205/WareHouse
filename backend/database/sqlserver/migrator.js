const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');
function loadMigrations(directory = join(__dirname, 'migrations')) {
  return readdirSync(directory).filter(x => x.endsWith('.sql')).sort().map(file => {
    if (!/^\d{12}_[a-z0-9_]+\.sql$/.test(file)) throw new Error('INVALID_MIGRATION_FILENAME');
    const bytes = readFileSync(join(directory, file));
    return { version: file.slice(0,-4), checksum: createHash('sha256').update(bytes).digest('hex'), sql: bytes.toString('utf8') };
  });
}
function verifyRecords(records, migrations) {
  const applied = new Set();
  for (const record of records) {
    const source = migrations.find(m => m.version === record.version);
    if (!source || source.checksum !== record.checksum) throw new Error('MIGRATION_CHECKSUM_DRIFT');
    if (record.state !== 'APPLIED' || !record.finished_at) throw new Error('INCOMPLETE_MIGRATION_REQUIRES_REVIEW');
    applied.add(record.version);
  }
  let pending = false;
  for (const migration of migrations) {
    if (!applied.has(migration.version)) pending = true;
    else if (pending) throw new Error('MIGRATION_ORDER_DRIFT');
  }
  return applied;
}
async function runMigrations(c, { statusOnly = false, beforeWrite, identityTarget } = {}) {
  const [[identity]] = await c.execute("SELECT DB_NAME() AS name, CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) AS instance_name, CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')) AS machine_name");
  if (!['warehouse_db','warehouse_test'].includes(identity.name) || !require('../../src/config/sqlserver-identity').matchesIdentity(identity,identityTarget)) throw new Error('UNSAFE_MIGRATION_DATABASE');
  if (beforeWrite) await beforeWrite();
  await c.beginTransaction();
  try {
    // Transaction ownership pins the application lock to this physical connection.
    await c.raw("DECLARE @result int; EXEC @result=sys.sp_getapplock @Resource=N'warehouse:sqlserver:migration', @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=10000; IF @result<0 THROW 51000,'MIGRATION_LOCK_UNAVAILABLE',1;");
    const [[exists]] = await c.execute("SELECT CASE WHEN OBJECT_ID(N'dbo._sql_migrations',N'U') IS NULL THEN 0 ELSE 1 END AS present");
    if (!exists.present) {
      const [unmanaged] = await c.execute("SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID(N'dbo') AND name<>N'_warehouse_environment'");
      if (unmanaged.length) throw new Error('UNMANAGED_EXISTING_SCHEMA_REQUIRES_REVIEW');
      if (!statusOnly) await c.raw("CREATE TABLE dbo._sql_migrations(version varchar(100) NOT NULL PRIMARY KEY, checksum char(64) NOT NULL, state varchar(16) NOT NULL CHECK(state='APPLIED'), finished_at datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME());");
    }
    const migrations = loadMigrations();
    const records = exists.present ? (await c.execute('SELECT version,checksum,state,finished_at FROM dbo._sql_migrations ORDER BY version'))[0] : [];
    const applied = verifyRecords(records, migrations), pending = migrations.filter(m => !applied.has(m.version)), appliedNow=[];
    if (!statusOnly) for (const migration of pending) {
      // SQL Server DDL is transactional. A failure rolls back both schema and history.
      await c.raw(migration.sql);
      await c.execute("INSERT INTO dbo._sql_migrations(version,checksum,state) VALUES (?,?,'APPLIED')", [migration.version,migration.checksum]);
      appliedNow.push(migration.version);
    }
    await c.commit();
    return { engine:'sqlserver',database:identity.name,applied:records.map(r=>r.version),appliedNow,pending:statusOnly?pending.map(m=>m.version):[] };
  } catch (error) { try { await c.rollback(); } catch {} throw error; }
}
module.exports = { loadMigrations, verifyRecords, runMigrations };
