const { parseDatabaseUrl } = require('../config/environment.js');

function assertTestTarget(environment, url, allowlist, marker) {
  const config = parseDatabaseUrl(url);
  const allowed = (allowlist || '').split(',').map(value => value.trim());
  if (environment !== 'test' || config.database !== 'warehouse_test'
    || !allowed.some(value => value.toLowerCase() === (config.host + ':' + config.port).toLowerCase())
    || !marker || !/^[a-f0-9-]{36}$/i.test(marker)
    || config.user !== 'warehouse_test_app') throw new Error('UNSAFE_TEST_DATABASE');
}

async function verifyTestDatabase(connection, url, allowlist, marker, migration = false) {
  assertTestTarget(process.env.NODE_ENV, url, allowlist, marker);
  const [rows] = await connection.execute("SELECT DB_NAME() AS database_name, ORIGINAL_LOGIN() AS principal, CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) AS instance_name, CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')) AS machine_name");
  if (rows[0]?.database_name !== 'warehouse_test' || rows[0]?.principal !== (migration ? 'warehouse_test_migration' : 'warehouse_test_app')
    || !require('../config/sqlserver-identity').matchesIdentity(rows[0],parseDatabaseUrl(url))) throw new Error('UNSAFE_TEST_DATABASE');
  const [markers] = await connection.execute('SELECT instance_id, environment FROM _warehouse_environment WHERE id = 1');
  if (markers.length !== 1 || markers[0].environment !== 'test'
    || markers[0].instance_id !== marker) throw new Error('UNSAFE_TEST_MARKER');
}

module.exports = { assertTestTarget, verifyTestDatabase };
