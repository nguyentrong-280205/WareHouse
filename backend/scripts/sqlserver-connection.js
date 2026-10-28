require('dotenv/config');
const { createDatabase, withConnection } = require('../src/config/database');
async function main() {
  for (const key of ['DATABASE_URL','TEST_DATABASE_URL']) {
    const pool = createDatabase(process.env[key]);
    try {
      const [[row]] = await withConnection(pool, c => c.execute("SELECT DB_NAME() AS database_name, CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) AS instance_name, CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')) AS machine_name, ORIGINAL_LOGIN() AS principal, CAST(99999999999999.123456 AS decimal(20,6)) AS exact_quantity, CAST(99999999999999999999 AS decimal(20,0)) AS exact_amount"));
      if (!require('../src/config/sqlserver-identity').matchesIdentity(row,require('../src/config/environment').parseDatabaseUrl(process.env[key])) || row.database_name !== (key === 'DATABASE_URL' ? 'warehouse_db' : 'warehouse_test')
        || row.exact_quantity !== '99999999999999.123456' || row.exact_amount !== '99999999999999999999') throw new Error('SQLSERVER_CONNECTION_IDENTITY_OR_PRECISION_MISMATCH');
      console.log(JSON.stringify({ database: row.database_name, instance: row.instance_name, principal: row.principal, decimalTransport: 'EXACT', connection: 'OK' }));
      if (key === 'TEST_DATABASE_URL') {
        const { assertTestTarget } = require('../src/shared/test-guard');
        assertTestTarget('test', process.env[key], process.env.TEST_ALLOWED_ENDPOINTS, process.env.TEST_INSTANCE_ID);
        console.log('TEST_ENDPOINT_GUARD_OK');
      }
    } finally { await pool.end(); }
  }
}
main().catch(error => { console.error('SQLSERVER_CONNECTION_FAILED', error.code || 'CONFIGURATION_OR_CONNECTION'); process.exitCode = 1; });
