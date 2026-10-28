// Read-only connection and metadata inspection. No UC scenarios or test runner.
const fs=require('node:fs'),path=require('node:path');
const {createDatabase,withConnection}=require('../src/config/database');
const {loadMigrations,verifyRecords}=require('../database/sqlserver/migrator');
async function main(){
 const secrets=path.join(__dirname,'../../infra/secrets/docker');
 const marker=fs.readFileSync(path.join(secrets,'testMarker'),'utf8').trim();
 for(const[name,file]of [['warehouse_db','migrationUrl'],['warehouse_test','testMigrationUrl']]){
  const url=new URL(fs.readFileSync(path.join(secrets,file),'utf8').trim());
  url.hostname='localhost';url.port=process.env.SQLSERVER_PORT||'14330';
  const pool=createDatabase(url.toString());
  try{await withConnection(pool,async c=>{
   const[[identity]]=await c.execute("SELECT DB_NAME() AS name,CONVERT(varchar(128),SERVERPROPERTY('ProductVersion')) AS version,CONVERT(varchar(128),SERVERPROPERTY('Edition')) AS edition,CONVERT(varchar(128),SERVERPROPERTY('MachineName')) AS machine_name");
   const[[tables]]=await c.execute("SELECT COUNT(*) AS n FROM sys.tables WHERE schema_id=SCHEMA_ID(N'dbo') AND name NOT LIKE N'[_]%'");
   const[[keys]]=await c.execute('SELECT COUNT(*) AS n FROM sys.foreign_keys WHERE is_disabled=0 AND is_not_trusted=0');
   const[history]=await c.execute('SELECT version,checksum,state,finished_at FROM dbo._sql_migrations ORDER BY version');
   verifyRecords(history,loadMigrations());
   if(identity.name!==name||Number(tables.n)!==76||Number(keys.n)!==237)throw new Error('DOCKER_SCHEMA_METADATA_MISMATCH');
   const[[accounts]]=await c.execute('SELECT COUNT(*) AS n FROM dbo.TaiKhoan');
   console.log(JSON.stringify({database:name,server:identity.machine_name,version:identity.version,edition:identity.edition,tables:Number(tables.n),trustedForeignKeys:Number(keys.n),accounts:Number(accounts.n),pendingMigrations:loadMigrations().filter(m=>!history.some(h=>h.version===m.version)).length}));
  });}finally{await pool.end();}
 }
 const testUrl=new URL(fs.readFileSync(path.join(secrets,'testAppUrl'),'utf8').trim());testUrl.hostname='localhost';testUrl.port=process.env.SQLSERVER_PORT||'14330';
 const pool=createDatabase(testUrl.toString());process.env.NODE_ENV='test';
 try{await withConnection(pool,c=>require('../src/shared/test-guard').verifyTestDatabase(c,testUrl.toString(),'localhost:'+testUrl.port,marker));console.log('DOCKER_TEST_DATABASE_IDENTITY_AND_MARKER_VERIFIED_READ_ONLY');}finally{await pool.end();}
}
main().catch(error=>{console.error('DOCKER_FOUNDATION_INSPECTION_FAILED '+(error.code||(/^[A-Z0-9_]+$/.test(error.message)?error.message:'CONFIGURATION')));process.exitCode=1;});
