require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[key,file]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[key]&&fs.existsSync('/run/secrets/'+file))process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
const{loadConfig}=require('../src/config/environment');
const{createDatabase,withTransaction}=require('../src/config/database');
const{guardDemo}=require('./sqlserver-demo-guard');
const repo=require('../src/shared/business-repository');
// Dữ liệu đồ án hư cấu: ước lượng khối lượng quy đổi = thể tích (lít) * 1.05 (chai/lon + bao bì), dùng cho capacity factor KG.
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_DOCKER_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL);
 try{
  await withTransaction(pool,async c=>{
   await guardDemo(c,config);
   const[[actor]]=await c.execute("SELECT id FROM TaiKhoan WHERE code=N'UC01_DEMO_warehouse' AND status='ACTIVE'");if(!actor)throw new Error('CAPACITY_FACTOR_SEED_ACTOR_REQUIRED');
   const[units]=await c.execute("SELECT DISTINCT capacity_unit_id FROM Kho WHERE status='ACTIVE'");if(units.length!==1)throw new Error('CAPACITY_UNIT_SET_REVIEW_REQUIRED');
   const capacityUnitId=units[0].capacity_unit_id;
   const[[clock]]=await c.execute('SELECT CONVERT(varchar(23),SYSUTCDATETIME(),121) AS effective_at');
   const[products]=await c.execute("SELECT id,code,volume_ml FROM ThanhPham WHERE status='ACTIVE' AND code LIKE 'TP%' ORDER BY id");
   const summary={capacityUnitId:String(capacityUnitId),inserted:0,preserved:0,products:products.length,sample:[]};
   for(const p of products){
    const existing=await repo.one(c,'HeSoChiemCho',{product_id:p.id,capacity_unit_id:capacityUnitId});
    if(!existing){
     const factor=(Number(p.volume_ml)/1000*1.05).toFixed(9);
     const id=await repo.insert(c,'HeSoChiemCho',{product_id:p.id,capacity_unit_id:capacityUnitId,revision:1,factor_per_base:factor,effective_at:clock.effective_at});
     await repo.audit(c,{accountId:null,system:true},'catalog.productCapacityFactor.seed','HeSoChiemCho',id,null,{productCode:p.code,capacityUnitId:String(capacityUnitId),factorPerBase:factor},randomUUID());
     summary.inserted++;summary.sample.push({product:p.code,factorPerBase:factor});
    }else summary.preserved++;
   }
   console.log(JSON.stringify({...summary,mode:'FILL_MISSING_ONLY',note:'Hệ số ước lượng từ thể tích, dữ liệu đồ án hư cấu'}));
  });
 }finally{await pool.end();}
}
main().catch(error=>{console.error('PRODUCT_CAPACITY_FACTOR_SEED_FAILED '+(/^[A-Z0-9_]+$/.test(error.message)?error.message:error.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
