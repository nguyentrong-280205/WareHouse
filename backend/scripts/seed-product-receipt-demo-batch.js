// One-time local demo data: a fresh production completion + confirmed finished-goods QC batch with room
// left to receive, because the only existing completion/QC chain in the Docker demo fixture has already
// been fully received. Fictional data for the project demo, same product/lot/plan line already seeded.
require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[key,file]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[key]&&fs.existsSync('/run/secrets/'+file))process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),repo=require('../src/shared/business-repository');
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver'||config.NODE_ENV!=='development')throw new Error('LOCAL_DOCKER_CONFIGURATION_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL);
 try{
  const result=await withTransaction(pool,async c=>{
   await require('./sqlserver-demo-guard').guardDemo(c,config);
   const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE action='demo.productReceiptBatch.seed.20261104' AND actor_kind='SYSTEM'");
   if(done)return{status:'ALREADY_SEEDED'};
   const[[actor]]=await c.execute("SELECT id FROM TaiKhoan WHERE code=N'UC01_DEMO_warehouse' AND status='ACTIVE'");if(!actor)throw new Error('DEMO_ACTOR_REQUIRED');
   const[[refRequest]]=await c.execute("SELECT id,plan_line_id,workshop_id FROM PhieuNhapKhoThanhPham WHERE id=1");if(!refRequest)throw new Error('REFERENCE_REQUEST_REQUIRED');
   const[[lot]]=await c.execute("SELECT id,product_id FROM LoThanhPham WHERE id=1 AND status='ACTIVE'");if(!lot)throw new Error('REFERENCE_LOT_MISSING');
   const qtyCompleted='200.000000';
   const requestId=await repo.insert(c,'PhieuNhapKhoThanhPham',{code:'YCN-DEMO-'+randomUUID(),plan_line_id:refRequest.plan_line_id,workshop_id:refRequest.workshop_id,status:'HOAN_THANH',created_by_id:actor.id});
   const requestLineId=await repo.insert(c,'ChiTietYeuCauNhapTP',{request_id:requestId,plan_line_id:refRequest.plan_line_id,product_lot_id:lot.id,qty_completed:qtyCompleted});
   const qcHeaderId=await repo.insert(c,'BienBanQCThanhPham',{source_id:requestId,status:'DA_XAC_NHAN',created_by_id:actor.id,confirmed_at:(await c.execute('SELECT CONVERT(varchar(23),SYSUTCDATETIME(),121) AS now'))[0][0].now});
   const qcLineId=await repo.insert(c,'ChiTietQCThanhPham',{qc_id:qcHeaderId,source_line_id:requestLineId,product_lot_id:lot.id,batch_sequence:1,qty_inspected:qtyCompleted,qty_accepted:qtyCompleted,qty_rejected:'0.000000',condition_note:'Dữ liệu đồ án hư cấu bổ sung demo 04/11/2026; bản ghi nhập kho thành phẩm trước đó đã dùng hết lượng QC gốc.'});
   await repo.audit(c,{accountId:null,system:true},'demo.productReceiptBatch.seed.20261104','ChiTietQCThanhPham',qcLineId,null,{requestId,requestLineId,qcHeaderId,qcLineId,productId:lot.product_id,lotId:lot.id,qtyCompleted},randomUUID());
   return{status:'SEEDED',requestId:String(requestId),requestLineId:String(requestLineId),qcHeaderId:String(qcHeaderId),qcLineId:String(qcLineId),productLotId:String(lot.id),qtyCompleted};
  });
  console.log(JSON.stringify(result));
 }finally{await pool.end();}
}
main().catch(e=>{console.error('PRODUCT_RECEIPT_DEMO_BATCH_SEED_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
