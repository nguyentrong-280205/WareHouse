require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[k,f]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[k]&&fs.existsSync('/run/secrets/'+f))process.env[k]=fs.readFileSync('/run/secrets/'+f,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),repo=require('../src/shared/business-repository');
const codes=['FS_DEMO_20261015_NL_A','FS_DEMO_20261015_NL_B'];
async function main(){const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw Error('PORTABLE_TARGET_REQUIRED');const pool=createDatabase(config.DATABASE_URL);try{const result=await withTransaction(pool,async c=>{
 await require('./sqlserver-demo-guard').guardDemo(c,config);
 await c.raw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'warehouse:remove-empty-material-locations-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'LOCATION_CLEANUP_LOCK',1;");
 const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='materialLocations.emptyLegacy.removed'");if(done)return{status:'ALREADY_REMOVED',noOverwrite:true};
 const[[layout]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='materialLocations.layout.initialized'");if(!layout)throw Error('LOCATION_LAYOUT_REQUIRED');
 const warehouse=await repo.one(c,'Kho',{code:'FS_DEMO_20261015_NL'},{lock:true});if(!warehouse)throw Error('MATERIAL_WAREHOUSE_REQUIRED');
 const rows=[];for(const code of codes){const row=await repo.one(c,'ViTriLuuKho',{warehouse_id:warehouse.id,code},{lock:true});if(!row)throw Error('EXPECTED_EMPTY_LOCATION_REQUIRED');rows.push(row);}
 const[refs]=await c.execute("SELECT OBJECT_NAME(parent_object_id) AS child,COL_NAME(parent_object_id,parent_column_id) AS field FROM sys.foreign_key_columns WHERE referenced_object_id=OBJECT_ID('dbo.ViTriLuuKho')");
 const allowed=['ChiTietKiemKe','ChiTietLanDem','ChiTietPhieuNhap','ChiTietPhieuXuat','ChiTietTiepNhanTra','DotTaiXuLy','KhoaViTriKiemKe','PhamViKiemKe','SnapshotKiemKe','TiepNhanChuaDinhDanh','TonKho','ViTriNguyenLieuDuocPhep','PhieuChuyenViTri'];
 if(refs.length!==allowed.length||refs.some(r=>!allowed.includes(r.child)||r.field!==(r.child==='PhieuChuyenViTri'?'source_location_id':'location_id')))throw Error('LOCATION_REFERENCES_REVIEW_REQUIRED');
 for(const row of rows)for(const ref of refs){const[[count]]=await c.execute('SELECT COUNT(*) AS n FROM dbo.['+ref.child+'] WITH(UPDLOCK,HOLDLOCK) WHERE ['+ref.field+']=?',[row.id]);if(Number(count.n))throw Error('EMPTY_LOCATION_HAS_REFERENCES');}
 for(const row of rows)await c.execute('DELETE FROM ViTriLuuKho WHERE id=?',[row.id]);
 await repo.audit(c,{accountId:null,system:true},'materialLocations.emptyLegacy.removed','Kho',warehouse.id,{locations:rows},{removedCodes:codes,retainedLocation:'VT_NVL_KHOITAO',noStockChanged:true},randomUUID());
 return{status:'REMOVED',removed:codes,retained:'VT_NVL_KHOITAO'};
 });console.log(JSON.stringify(result));}finally{await pool.end();}}
main().catch(e=>{console.error('EMPTY_LOCATION_REMOVAL_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
