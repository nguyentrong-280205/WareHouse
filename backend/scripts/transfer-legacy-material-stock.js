// Explicit approval 28/10: move reviewed sample stock through a single audited transfer.
require('dotenv/config');
const fs=require('node:fs');for(const[k,f]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[k]&&fs.existsSync('/run/secrets/'+f))process.env[k]=fs.readFileSync('/run/secrets/'+f,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),repo=require('../src/shared/business-repository');
const profile=require('./planning-sample-profile'),{prefixes}=require('../src/modules/warehouse/material-lot-codes');
async function main(){const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw Error('PORTABLE_TARGET_REQUIRED');const pool=createDatabase(config.DATABASE_URL);try{const result=await withTransaction(pool,async c=>{
 await require('./sqlserver-demo-guard').guardDemo(c,config);
 await c.raw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'warehouse:legacy-transfer-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'LEGACY_TRANSFER_LOCK',1;");
 const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE action='materialLocations.legacy.transferred' AND target_type='PhieuChuyenViTri'");if(done)return{status:'ALREADY_TRANSFERRED',noStockChange:true};
 const warehouse=await repo.one(c,'Kho',{code:'FS_DEMO_20261015_NL'},{lock:true}),source=warehouse&&await repo.one(c,'ViTriLuuKho',{warehouse_id:warehouse.id,code:'VT_NVL_KHOITAO'},{lock:true});if(!source)throw Error('LEGACY_SOURCE_REQUIRED');
 const[[actor]]=await c.execute("SELECT id FROM TaiKhoan WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE login=? AND status=?",['quanlykho01','ACTIVE']);if(!actor)throw Error('TRANSFER_MANAGER_REQUIRED');
 const expected=[];
 for(const m of profile.materials){
  const material=await repo.one(c,'NguyenLieu',{code:m.code},{lock:true});if(!material)throw Error('REVIEWED_MATERIAL_MISSING');
  const lot=await repo.one(c,'LoNguyenLieu',{material_id:material.id,code:'LO-'+prefixes[m.code]+'-01'},{lock:true});if(!lot)throw Error('REVIEWED_LOT_MISSING');
  const balance=await repo.one(c,'TonKho',{location_id:source.id,material_lot_id:lot.id,product_lot_id:null,quality_bucket:'DAT'},{lock:true});if(!balance)throw Error('REVIEWED_BALANCE_MISSING');
  const[targets]=await c.execute('SELECT v.id,v.code FROM ViTriNguyenLieuDuocPhep p JOIN ViTriLuuKho v ON v.id=p.location_id WHERE p.material_id=? AND v.warehouse_id=? AND v.status=?',[material.id,warehouse.id,'ACTIVE']);if(targets.length!==1)throw Error('LOCATION_MAPPING_REVIEW_REQUIRED');
  expected.push({balanceId:balance.id,lotId:lot.id,materialId:material.id,targetLocationId:targets[0].id,quantity:m.initialQuantity});
 }
 const transfer=await require('../src/modules/inventory/location-transfer').transferWithin(c,{warehouseId:warehouse.id,sourceLocationId:source.id,accountId:actor.id,expected});return{status:'TRANSFERRED',...transfer};
 });console.log(JSON.stringify(result));}finally{await pool.end();}}
main().catch(e=>{console.error('LEGACY_TRANSFER_FAILED '+(/^[A-Z0-9_]+$/.test(e.code||e.message)?e.code||e.message:'TRANSACTION_OR_CONFLICT'));process.exitCode=1;});
