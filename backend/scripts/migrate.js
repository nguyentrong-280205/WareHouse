require('dotenv/config');
const { readFileSync } = require('node:fs');
const { createDatabase, withConnection } = require('../src/config/database.js');
const { parseDatabaseUrl } = require('../src/config/environment.js');
const { verifyTestDatabase } = require('../src/shared/test-guard.js');
const { runMigrations } = require('../database/sqlserver/migrator.js');

async function main() {
  const target = process.argv[2];
  if (!['development', 'test'].includes(target)) throw new Error('INVALID_MIGRATION_TARGET');
  const statusOnly = process.argv.includes('--status');
  const url = target === 'test' ? process.env.TEST_MIGRATION_DATABASE_URL
    : (process.env.MIGRATION_DATABASE_URL_FILE ? readFileSync(process.env.MIGRATION_DATABASE_URL_FILE, 'utf8').trim() : process.env.MIGRATION_DATABASE_URL);
  if (!url) throw new Error('MISSING_MIGRATION_CONFIGURATION');
  const config = parseDatabaseUrl(url);
  const expectedName = target === 'test' ? 'warehouse_test' : 'warehouse_db';
  const expectedUser = target === 'test' ? 'warehouse_test_migration' : 'warehouse_migration';
  if (config.database !== expectedName || config.user !== expectedUser) throw new Error('UNSAFE_MIGRATION_TARGET');
  const pool = createDatabase(url, { migration: true });
  let appPool;
  try {
    if (target === 'test') {
      process.env.NODE_ENV = 'test';
      const appUrl = process.env.TEST_DATABASE_URL;
      const app = parseDatabaseUrl(appUrl);
      if (app.host !== config.host || app.port !== config.port || app.database !== config.database) throw new Error('TEST_ENDPOINT_MISMATCH');
      appPool = createDatabase(appUrl);
      await withConnection(appPool, connection => verifyTestDatabase(connection, appUrl, process.env.TEST_ALLOWED_ENDPOINTS, process.env.TEST_INSTANCE_ID));
    } else if (process.env.DATABASE_URL) {
      const app = parseDatabaseUrl(process.env.DATABASE_URL);
      if (app.host !== config.host || app.port !== config.port || app.database !== config.database) throw new Error('DEVELOPMENT_ENDPOINT_MISMATCH');
    }
    const result = await withConnection(pool, connection => runMigrations(connection, {
      statusOnly,
      identityTarget: config,
      beforeWrite: target === 'test' ? () => verifyTestDatabase(connection, process.env.TEST_DATABASE_URL, process.env.TEST_ALLOWED_ENDPOINTS, process.env.TEST_INSTANCE_ID, true) : undefined,
    }));
    console.log(JSON.stringify(result, null, 2));
  } finally { if (appPool) await appPool.end(); await pool.end(); }
}
main().catch(error => {
  // Diagnostics must never mask the original failure (for example in a read-only image).
  try {
    require('node:fs').mkdirSync('.artifacts/sqlserver', { recursive: true });
    require('node:fs').writeFileSync('.artifacts/sqlserver/migration-error.log', JSON.stringify({ code:error.code, number:error.number, lineNumber:error.lineNumber, message:error.message, precedingErrors:error.precedingErrors?.map(e=>({number:e.number,lineNumber:e.lineNumber,message:e.message})) }, null, 2));
  } catch { /* Report the original sanitized code below even if logging is unavailable. */ }
  const code = typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code) ? error.code
    : typeof error.message === 'string' && /^[A-Z0-9_]+$/.test(error.message) ? error.message : 'VERIFICATION_FAILED';
  console.error('SQL_MIGRATION_FAILED: ' + code + '; no reset performed.');
  process.exitCode = 1;
});
