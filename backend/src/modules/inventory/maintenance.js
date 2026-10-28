const{randomUUID}=require('node:crypto');
const{withConnection,withTransaction}=require('../../config/database');
const repo=require('./maintenance-repository'),base=require('../../shared/business-repository'),stock=require('./stock-service'),life=require('../stocktake/lifecycle');
function startMaintenance(pool,config,logger){
 if(config.NODE_ENV==='test')return()=>{};let busy=false,stopped=false;
 async function tick(){if(busy||stopped)return;busy=true;try{
  const candidates=await withConnection(pool,async c=>await repo.ready(c)?repo.warehouses(c):[]);
  for(const candidate of candidates){if(stopped)break;await withTransaction(pool,async c=>{
   const warehouse=await base.one(c,'Kho',{id:candidate.warehouse_id},{lock:true});if(!warehouse)return;
   const req={principal:{accountId:null,system:true},body:{reason:'Hết hạn theo chính sách FS04/FS07'},correlationId:randomUUID()};
   await life.recover(c,req,warehouse.id);await stock.expire(c,req,warehouse.id);
  });}
 }catch(error){logger.error({code:typeof error.code==='string'?error.code:'MAINTENANCE_FAILED'},'Expiration maintenance failed; transaction rolled back; next cycle will recheck');}finally{busy=false;}}
 // Scheduling interval is technical polling, not an extension of reservation/stocktake TTL.
 const timer=setInterval(()=>void tick(),30000);timer.unref();void tick();return()=>{stopped=true;clearInterval(timer);};
}
module.exports={startMaintenance};
