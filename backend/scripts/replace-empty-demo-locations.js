// Replace only the three explicitly approved, unreferenced demo locations.
require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[k,f]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[k]&&fs.existsSync('/run/secrets/'+f))process.env[k]=fs.readFileSync('/run/secrets/'+f,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),repo=require('../src/shared/business-repository');
const replacements=[
 {old:'FS_DEMO_20261015_TP_A',warehouse:'FS_DEMO_20261015_TP',type:'FINISHED',code:'VITRi-TP-A',name:'Vị trí thành phẩm A'},
 {old:'FS_DEMO_20261015_TP_B',warehouse:'FS_DEMO_20261015_TP',type:'FINISHED',code:'VITRi-TP-B',name:'Vị trí thành phẩm B'},
 {old:'FS_DEMO_20261015_CTRL_A',warehouse:'FS_DEMO_20261015_CTRL',type:'CONTROLLED',code:'VITRi-HL-A',name:'Vị trí hàng lỗi A'},
];
async function main(){const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver'||config.db.database!=='warehouse_db')throw Error('PORTABLE_TARGET_REQUIRED');const pool=createDatabase(config.DATABASE_URL);try{const result=await withTransaction(pool,async c=>{
 await require('./sqlserver-demo-guard').guardDemo(c,config);
 await c.raw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'warehouse:replace-demo-locations-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'LOCATION_REPLACEMENT_LOCK',1;");
 const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='warehouseLocations.demo.replaced'");if(done)return{status:'ALREADY_REPLACED',noOverwrite:true};
 const[refs]=await c.execute("SELECT OBJECT_SCHEMA_NAME(parent_object_id) AS schema_name,OBJECT_NAME(parent_object_id) AS child,COL_NAME(parent_object_id,parent_column_id) AS field FROM sys.foreign_key_columns WHERE referenced_object_id=OBJECT_ID('dbo.ViTriLuuKho')");
 const allowed=['ChiTietKiemKe','ChiTietLanDem','ChiTietPhieuNhap','ChiTietPhieuXuat','ChiTietTiepNhanTra','DotTaiXuLy','KhoaViTriKiemKe','PhamViKiemKe','SnapshotKiemKe','TiepNhanChuaDinhDanh','TonKho','ViTriNguyenLieuDuocPhep','PhieuChuyenViTri'];
 if(refs.length!==allowed.length||refs.some(r=>r.schema_name!=='dbo'||!allowed.includes(r.child)||(r.child==='PhieuChuyenViTri'?r.field!=='source_location_id':r.field!=='location_id')))throw Error('LOCATION_REFERENCES_REVIEW_REQUIRED');
 const rows=[];for(const item of replacements){const warehouse=await repo.one(c,'Kho',{code:item.warehouse},{lock:true});if(!warehouse||warehouse.type!==item.type||warehouse.status!=='ACTIVE')throw Error('WAREHOUSE_CONFIGURATION_CHANGED');const old=await repo.one(c,'ViTriLuuKho',{warehouse_id:warehouse.id,code:item.old},{lock:true});if(!old||old.status!=='ACTIVE')throw Error('DEMO_LOCATION_CHANGED');if(await repo.one(c,'ViTriLuuKho',{warehouse_id:warehouse.id,code:item.code},{lock:true}))throw Error('LOCATION_CODE_CONFLICT');
  for(const ref of refs){const[[count]]=await c.execute('SELECT COUNT(*) AS n FROM dbo.['+ref.child+'] WITH(UPDLOCK,HOLDLOCK) WHERE ['+ref.field+']=?',[old.id]);if(Number(count.n))throw Error('DEMO_LOCATION_HAS_REFERENCES');}
  rows.push({item,warehouse,old});}
 const created=[];for(const{item,warehouse,old}of rows){const id=await repo.insert(c,'ViTriLuuKho',{warehouse_id:warehouse.id,code:item.code,name:item.name,area:item.code.slice(-1),capacity:old.capacity,capacity_unit_id:old.capacity_unit_id,storage_rule:old.storage_rule,created_by_id:old.created_by_id});const[result]=await c.execute('DELETE FROM ViTriLuuKho WHERE id=?',[old.id]);if(result.affectedRows!==1)throw Error('LOCATION_DELETE_CONFLICT');created.push({oldId:String(old.id),oldCode:old.code,id,code:item.code,name:item.name,capacity:old.capacity});}
 await repo.audit(c,{accountId:null,system:true},'warehouseLocations.demo.replaced','Kho',rows[0].warehouse.id,{locations:rows.map(r=>r.old)},{locations:created,stockChanged:false},randomUUID());return{status:'REPLACED',locations:created};
 });console.log(JSON.stringify(result));}finally{await pool.end();}}
main().catch(e=>{console.error('LOCATION_REPLACEMENT_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
