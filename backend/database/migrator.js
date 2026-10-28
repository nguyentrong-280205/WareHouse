const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');
const { splitSql } = require('./sql.js');
const { verifyFoundation } = require('./schema-verification.js');
const legacyVersions = ['202610120000_environment_bootstrap', '202610120001_foundation'];

function loadMigrations(directory = join(__dirname, 'migrations')) {
  return readdirSync(directory).filter(name => name.endsWith('.sql')).sort().map(name => {
    if (!/^\d{12}_[a-z0-9_]+\.sql$/.test(name)) throw new Error('INVALID_MIGRATION_FILENAME');
    const bytes = readFileSync(join(directory, name));
    return { version: name.slice(0, -4), checksum: createHash('sha256').update(bytes).digest('hex'), sql: bytes.toString('utf8') };
  });
}
async function tableExists(connection, table) {
  const [rows] = await connection.execute('SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?', [table]);
  return rows.length === 1;
}
async function verifyLegacy(connection, migrations) {
  const [rows] = await connection.execute('SELECT migration_name,checksum,finished_at,rolled_back_at FROM _prisma_migrations');
  if (rows.length !== 2 || rows.some(row => !row.finished_at || row.rolled_back_at)) throw new Error('UNVERIFIED_LEGACY_HISTORY');
  for (const version of legacyVersions) {
    const source = migrations.find(migration => migration.version === version);
    const row = rows.find(migration => migration.migration_name === version);
    if (!source || !row || row.checksum !== source.checksum) throw new Error('LEGACY_CHECKSUM_MISMATCH');
  }
  await verifyFoundation(connection, migrations.find(migration => migration.version === legacyVersions[1]).sql);
}
function verifyRecords(records, migrations) {
  const complete = new Set();
  for (const record of records) {
    const source = migrations.find(migration => migration.version === record.version);
    if (!source || source.checksum !== record.checksum) throw new Error('MIGRATION_CHECKSUM_DRIFT');
    if (!['APPLIED', 'BASELINED_LEGACY'].includes(record.state) || !record.finished_at) throw new Error('INCOMPLETE_MIGRATION_REQUIRES_REVIEW');
    complete.add(record.version);
  }
  // A missing older migration must never run after a newer migration.
  let pendingSeen = false;
  for (const migration of migrations) {
    if (!complete.has(migration.version)) pendingSeen = true;
    else if (pendingSeen) throw new Error('MIGRATION_ORDER_DRIFT');
  }
  return complete;
}
async function runMigrations(connection, { statusOnly = false, beforeWrite } = {}) {
  const migrations = loadMigrations();
  const [[identity]] = await connection.execute('SELECT DATABASE() AS name');
  if (!['warehouse_db', 'warehouse_test'].includes(identity.name)) throw new Error('UNSAFE_MIGRATION_DATABASE');
  const lockName = 'warehouse_sql_migrate:' + identity.name;
  if (!statusOnly) {
    if (beforeWrite) await beforeWrite();
    const [[lock]] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
    if (Number(lock.acquired) !== 1) throw new Error('MIGRATION_LOCK_UNAVAILABLE');
  }
  try {
    const historyExists = await tableExists(connection, '_sql_migrations');
    let records = historyExists ? (await connection.execute('SELECT version,checksum,state,finished_at FROM _sql_migrations ORDER BY version'))[0] : [];
    const legacy = await tableExists(connection, '_prisma_migrations');
    if (!legacy && !historyExists) {
      const [existing] = await connection.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME <> '_warehouse_environment'");
      if (existing.length) throw new Error('UNMANAGED_EXISTING_SCHEMA_REQUIRES_REVIEW');
    }
    if (legacy && records.length === 0) {
      await verifyLegacy(connection, migrations);
      if (statusOnly) return { database: identity.name, legacy: 'VERIFIED_NOT_ADOPTED', pending: [], adoptionRequired: true };
    }
    const complete = verifyRecords(records, migrations);
    if (records.length === 2 && legacyVersions.every(v => complete.has(v))) {
      await verifyFoundation(connection, migrations.find(migration => migration.version === legacyVersions[1]).sql);
    }
    if (statusOnly) return { database: identity.name, applied: records.map(row => ({ version: row.version, state: row.state })), pending: migrations.filter(m => !complete.has(m.version)).map(m => m.version) };
    if (!historyExists) {
      const metadata = readFileSync(join(__dirname, 'migration-history.sql'), 'utf8');
      for (const statement of splitSql(metadata)) await connection.query(statement);
    }
    if (legacy && records.length === 0) {
      await connection.beginTransaction();
      try {
        for (const migration of migrations.filter(m => legacyVersions.includes(m.version))) {
          await connection.execute("INSERT INTO _sql_migrations(version,checksum,state,finished_at) VALUES (?,?,'BASELINED_LEGACY',CURRENT_TIMESTAMP(3))", [migration.version, migration.checksum]);
          complete.add(migration.version);
        }
        await connection.commit();
      } catch (error) { await connection.rollback(); throw error; }
    }
    const appliedNow = [];
    for (const migration of migrations.filter(m => !complete.has(m.version))) {
      await connection.execute("INSERT INTO _sql_migrations(version,checksum,state) VALUES (?,?,'APPLYING')", [migration.version, migration.checksum]);
      // MySQL DDL commits implicitly: persist APPLYING and stop on failure, never fake rollback.
      for (const statement of splitSql(migration.sql)) await connection.query(statement);
      await connection.execute("UPDATE _sql_migrations SET state='APPLIED',finished_at=CURRENT_TIMESTAMP(3) WHERE version=?", [migration.version]);
      appliedNow.push(migration.version);
    }
    return { database: identity.name, adoptedLegacy: legacy && records.length === 0, appliedNow, pending: [] };
  } finally {
    if (!statusOnly) await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
  }
}
module.exports = { loadMigrations, verifyRecords, runMigrations, verifyLegacy };
