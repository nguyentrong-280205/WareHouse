async function guardDemo(c, config) {
  if (config.NODE_ENV !== 'development' || config.db.database !== 'warehouse_db' || config.db.user !== 'warehouse_app'
    || !(config.db.instance === 'HTTT02' || config.db.machine === 'warehouse-sqlserver')) throw new Error('UNSAFE_DEMO_TARGET');
  const [[row]]=await c.execute("SELECT DB_NAME() AS name, ORIGINAL_LOGIN() AS principal, CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) AS instance_name, CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')) AS machine_name, CASE WHEN OBJECT_ID(N'dbo._warehouse_environment',N'U') IS NULL THEN 0 ELSE 1 END AS test_marker");
  if(row.name!=='warehouse_db'||row.principal!=='warehouse_app'||!require('../src/config/sqlserver-identity').matchesIdentity(row,config.db)||row.test_marker)throw new Error('UNSAFE_DEMO_TARGET');
}
module.exports={guardDemo};
