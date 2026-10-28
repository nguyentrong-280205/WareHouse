// Read-only inventory of location references before any data deletion.
const fs=require('node:fs');
const {createDatabase,withConnection}=require('../src/config/database');
const {parseDatabaseUrl}=require('../src/config/environment');
async function main(){
 const url=fs.readFileSync('/run/secrets/app_url','utf8').trim();
 const config=parseDatabaseUrl(url);if(config.machine!=='warehouse-sqlserver'||config.database!=='warehouse_db')throw Error('UNSAFE_TARGET');
 const pool=createDatabase(url);try{await withConnection(pool,async c=>{
  const [locations]=await c.execute("SELECT v.id,v.code,v.name,v.status,k.name AS warehouse FROM ViTriLuuKho v JOIN Kho k ON k.id=v.warehouse_id ORDER BY v.id");
  const [refs]=await c.execute("SELECT OBJECT_SCHEMA_NAME(f.parent_object_id) AS schema_name,OBJECT_NAME(f.parent_object_id) AS table_name,COL_NAME(fc.parent_object_id,fc.parent_column_id) AS column_name FROM sys.foreign_keys f JOIN sys.foreign_key_columns fc ON f.object_id=fc.constraint_object_id WHERE f.referenced_object_id=OBJECT_ID('dbo.ViTriLuuKho')");
  for(const location of locations){const counts={};for(const ref of refs){if(![ref.schema_name,ref.table_name,ref.column_name].every(x=>/^[A-Za-z0-9_]+$/.test(x)))throw Error('INVALID_IDENTIFIER');const [[row]]=await c.execute(`SELECT COUNT(*) AS n FROM [${ref.schema_name}].[${ref.table_name}] WHERE [${ref.column_name}]=?`,[location.id]);if(Number(row.n))counts[ref.table_name+'.'+ref.column_name]=Number(row.n);}console.log(JSON.stringify({id:location.id,code:location.code,name:location.name,status:location.status,warehouse:location.warehouse,references:counts}));}
 });}finally{await pool.end();}}
main().catch(e=>{console.error('LOCATION_REPORT_FAILED '+(e.code||'ERROR'));process.exitCode=1;});
