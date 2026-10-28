require('dotenv/config');
const fs=require('node:fs'),path=require('node:path');
const {createDatabase,withConnection}=require('../src/config/database');
const {loadMigrations,verifyRecords}=require('../database/sqlserver/migrator');
async function inspect(url){
 const pool=createDatabase(url);
 try{return await withConnection(pool,async c=>{
  const[[identity]]=await c.execute("SELECT DB_NAME() AS name,CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) AS instance_name,CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')) AS machine_name,CONVERT(varchar(128),DATABASEPROPERTYEX(DB_NAME(),'Collation')) AS collation");
  if(!['warehouse_db','warehouse_test'].includes(identity.name)||!require('../src/config/sqlserver-identity').matchesIdentity(identity,require('../src/config/environment').parseDatabaseUrl(url)))throw new Error('UNEXPECTED_SQLSERVER_SCHEMA_TARGET');
  const[history]=await c.execute('SELECT version,checksum,state,finished_at FROM dbo._sql_migrations ORDER BY version');verifyRecords(history,loadMigrations());
  const[tables]=await c.execute("SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID(N'dbo') AND name NOT LIKE N'[_]%' ORDER BY name");
  const[foreignKeys]=await c.execute('SELECT OBJECT_NAME(parent_object_id) AS table_name,OBJECT_NAME(referenced_object_id) AS referenced_table,is_disabled,is_not_trusted FROM sys.foreign_keys ORDER BY table_name,referenced_table');
  const[checks]=await c.execute('SELECT OBJECT_NAME(parent_object_id) AS table_name,definition,is_disabled,is_not_trusted FROM sys.check_constraints ORDER BY table_name,name');
  const[indexes]=await c.execute("SELECT OBJECT_NAME(object_id) AS table_name,name,is_unique,is_primary_key,has_filter,filter_definition FROM sys.indexes WHERE object_id IN (SELECT object_id FROM sys.tables WHERE schema_id=SCHEMA_ID(N'dbo')) AND name IS NOT NULL ORDER BY table_name,name");
  const[columns]=await c.execute("SELECT OBJECT_NAME(c.object_id) AS table_name,c.name AS column_name,TYPE_NAME(c.user_type_id) AS data_type,c.max_length,c.precision,c.scale,c.is_nullable,c.is_identity,c.is_computed,c.collation_name FROM sys.columns c JOIN sys.tables t ON t.object_id=c.object_id WHERE t.schema_id=SCHEMA_ID(N'dbo') ORDER BY table_name,c.column_id");
  if(tables.length!==76||foreignKeys.length!==237||[...checks,...foreignKeys].some(r=>r.is_disabled||r.is_not_trusted))throw new Error('SQLSERVER_SCHEMA_METADATA_MISMATCH');
  return{...identity,history,tables,foreignKeys,checks,indexes,columns};
 });}finally{await pool.end();}
}
async function main(){
 const dev=await inspect(process.env.MIGRATION_DATABASE_URL),test=await inspect(process.env.TEST_MIGRATION_DATABASE_URL);
 const output=path.join(__dirname,'../.artifacts/sqlserver');fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(path.join(output,'schema-metadata.json'),JSON.stringify({capturedAt:new Date().toISOString(),development:dev,test},null,2));
 const source=JSON.parse(fs.readFileSync(path.join(output,'mysql-source-inventory.json'),'utf8'));
 const lines=['# Schema SQL Server thực tế — 16/10/2026','','Metadata đọc trên HTTT02 sau migration; không thực hiện kiểm thử UC. Mô hình gồm **76 bảng nghiệp vụ, 237 FK**, CHECK và index dưới đây; không thêm lớp nghiệp vụ. Tên bảng giữ nguyên MySQL nguồn. `_sql_migrations` kỹ thuật và `_warehouse_environment` test được liệt kê riêng.','','| Database | Bảng nghiệp vụ | FK | CHECK | Index (gồm PK/metadata) | Filtered unique |','|---|---:|---:|---:|---:|---:|',...[dev,test].map(s=>'| '+s.name+' | '+s.tables.length+' | '+s.foreignKeys.length+' | '+s.checks.length+' | '+s.indexes.length+' | '+s.indexes.filter(i=>i.is_unique&&i.has_filter).length+' |'),'','Tất cả FK/CHECK đang enabled và trusted. Collation database Latin1_General_100_CI_AI_SC; cột mã/login/hash theo BIN2 trong migration. Ngày UTC datetime2(3), lượng/giá decimal(20,6), tiền(20,0), hệ số(20,9).','','## Mapping và thống kê nguồn trước chuyển dữ liệu','','Số liệu nguồn là COUNT/MAX ID read-only, không phải dữ liệu đã chuyển. Seed SQL Server được tái tạo từ fixture; không import hàng nguồn. Mọi copy dữ liệu thật phải duyệt mapping/quota/FK/row count/rollback trước.','','| Bảng SQL Server dbo (cũng là tên nguồn) | Cột | FK đi ra | Dòng MySQL nguồn | Max ID MySQL |','|---|---:|---:|---:|---|'];
 for(const table of dev.tables){const from=source.tables.find(t=>t.table===table.name);lines.push('| '+table.name+' | '+dev.columns.filter(c=>c.table_name===table.name).length+' | '+dev.foreignKeys.filter(f=>f.table_name===table.name).length+' | '+(from?.count??'—')+' | '+(from?.maxId??'—')+' |');}
 lines.push('','## Bảng kỹ thuật và migration','','- SQL Server `_sql_migrations`: lineage mới `202610160001_native_schema`, APPLIED ở cả hai DB; không baseline hoặc copy history MySQL.','- `_warehouse_environment`: chỉ warehouse_test, marker UUID cục bộ; database/endpoint/principal/instance được kiểm trước ghi test.','- MySQL `_prisma_migrations` (2 dòng) và `_sql_migrations` (9 dòng) giữ nguyên tại nguồn; không tạo `_prisma_migrations` trên SQL Server.','','## Index unique nullable có chủ đích','','| Bảng | Index | Điều kiện lọc |','|---|---|---|',...dev.indexes.filter(i=>i.is_unique&&i.has_filter).map(i=>'| '+i.table_name+' | '+i.name+' | `'+i.filter_definition+'` |'),'','## Hồ sơ chi tiết','','Định nghĩa đầy đủ cột/PK/FK/CHECK/index/computed: `backend/database/sqlserver/migrations/202610160001_native_schema.sql`. Metadata đầy đủ đọc thực tế: `backend/.artifacts/sqlserver/schema-metadata.json` (ignored). Migration MySQL cũ giữ nguyên byte ở `backend/database/migrations`; Prisma chỉ archive.','');
 fs.writeFileSync(path.join(__dirname,'../../docs/sqlserver_schema_manifest.md'),lines.join('\n'));
 for(const s of[dev,test])console.log(JSON.stringify({database:s.name,tables:s.tables.length,foreignKeys:s.foreignKeys.length,checks:s.checks.length,indexes:s.indexes.length,history:s.history.map(r=>({version:r.version,state:r.state})),trustedConstraints:true}));
}
main().catch(error=>{console.error('SQLSERVER_SCHEMA_INSPECTION_FAILED',error.code||error.message);process.exitCode=1;});
