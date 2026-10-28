const fs=require('node:fs'),sql=require('mssql');
async function main(){
 const config=JSON.parse(fs.readFileSync('/run/secrets/bootstrap','utf8'));
 if(!/^[a-f0-9-]{36}$/.test(config.installationId)||!/^[a-f0-9-]{36}$/.test(config.testMarker))throw new Error('INVALID_INSTALLATION_MARKERS');
 const pool=await new sql.ConnectionPool({server:'sqlserver',port:1433,user:'sa',password:config.saPassword,database:'master',options:{encrypt:true,trustServerCertificate:true},pool:{max:1,min:0}}).connect();
 const query=async(text,params={})=>{const r=new sql.Request(pool);for(const[k,v]of Object.entries(params))r.input(k,sql.NVarChar(4000),v);return r.query(text);};
 try{
  const identity=(await query("SELECT CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')) AS machine,SERVERPROPERTY('InstanceName') AS instance")).recordset[0];
  if(identity.machine?.toLowerCase()!=='warehouse-sqlserver'||identity.instance!==null)throw new Error('UNEXPECTED_BOOTSTRAP_SERVER');
  // Preflight both DBs and logins before writes. Adopt only this installation's marked DBs.
  for(const db of ['warehouse_db','warehouse_test']){
   const exists=(await query('SELECT DB_ID(@db) AS id',{db})).recordset[0].id;
   if(exists){const row=(await query(`SELECT CONVERT(nvarchar(128),value) AS id FROM [${db}].sys.extended_properties WHERE class=0 AND name=N'warehouse_installation_id'`)).recordset[0];if(row?.id!==config.installationId)throw new Error('EXISTING_DATABASE_NOT_OWNED');}
  }
  for(const user of Object.keys(config.credentials)){
   if(!['warehouse_app','warehouse_migration','warehouse_test_app','warehouse_test_migration'].includes(user))throw new Error('INVALID_BOOTSTRAP_USER');
   const row=(await query('SELECT PWDCOMPARE(@password,password_hash) AS matches FROM sys.sql_logins WHERE name=@name',{name:user,password:config.credentials[user]})).recordset[0];
   if(row&&row.matches!==1)throw new Error('EXISTING_LOGIN_CONFLICT');
  }
  for(const db of ['warehouse_db','warehouse_test']){
   if(!(await query('SELECT DB_ID(@db) AS id',{db})).recordset[0].id){
    await query(`CREATE DATABASE [${db}] COLLATE Latin1_General_100_CI_AI_SC`);
    await query(`USE [${db}]; EXEC sys.sp_addextendedproperty @name=N'warehouse_installation_id',@value=@marker;`,{marker:config.installationId});
   }
  }
  for(const[user,password]of Object.entries(config.credentials)){
   const db=user.startsWith('warehouse_test_')?'warehouse_test':'warehouse_db';
   if(!(await query('SELECT 1 AS present FROM sys.sql_logins WHERE name=@name',{name:user})).recordset.length){
    // Password comes from our generated secret; escape SQL literals, never print SQL.
    await query(`CREATE LOGIN [${user}] WITH PASSWORD=N'${password.replaceAll("'","''")}',CHECK_POLICY=ON,CHECK_EXPIRATION=OFF,DEFAULT_DATABASE=[${db}]`);
   }
   await query(`USE [${db}]; IF DATABASE_PRINCIPAL_ID(N'${user}') IS NULL CREATE USER [${user}] FOR LOGIN [${user}];`);
   if(user.endsWith('_migration'))for(const role of ['db_ddladmin','db_datareader','db_datawriter'])await query(`USE [${db}]; IF IS_ROLEMEMBER(N'${role}',N'${user}')<>1 ALTER ROLE [${role}] ADD MEMBER [${user}];`);
   else await query(`USE [${db}]; GRANT SELECT,INSERT,UPDATE,DELETE ON SCHEMA::dbo TO [${user}];`);
  }
  await query("USE [warehouse_test]; IF OBJECT_ID(N'dbo._warehouse_environment',N'U') IS NULL BEGIN CREATE TABLE dbo._warehouse_environment(id tinyint NOT NULL PRIMARY KEY CHECK(id=1),environment nvarchar(16) NOT NULL CHECK(environment=N'test'),instance_id char(36) NOT NULL); INSERT INTO dbo._warehouse_environment VALUES(1,N'test',@marker); END; IF NOT EXISTS(SELECT 1 FROM dbo._warehouse_environment WHERE id=1 AND environment=N'test' AND instance_id=@marker) THROW 51001,'TEST_MARKER_CONFLICT',1;",{marker:config.testMarker});
  console.log('WAREHOUSE_DOCKER_BOOTSTRAP_OK databases=warehouse_db,warehouse_test no_source_data_imported');
 }finally{await pool.close();}
}
main().catch(error=>{console.error('DOCKER_BOOTSTRAP_FAILED '+(/^[A-Z0-9_]+$/.test(error.message)?error.message:error.code||'CONNECTION_OR_CONFIGURATION'));process.exitCode=1;});
