// Read-only diagnosis on existing portable data; never creates an order, BOM, calendar, plan or stock.
require('dotenv/config');
const{loadConfig}=require('../src/config/environment'),{createDatabase,withConnection}=require('../src/config/database');
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL);
 try{await withConnection(pool,async c=>{
  await require('./sqlserver-demo-guard').guardDemo(c,config);
  const[[actor]]=await c.execute("SELECT TOP (1) t.id FROM TaiKhoan t JOIN VaiTro_Quyen v ON v.role_id=t.role_id JOIN Quyen q ON q.id=v.permission_id WHERE q.code='plans.create' AND t.status='ACTIVE' ORDER BY t.id");
  if(!actor)throw new Error('PLANNING_ACTOR_REQUIRED');
  const principal={accountId:actor.id,...await require('../src/modules/auth/scope-repository').loadScopes(c,actor.id)};
  const[[order]]=await c.execute("SELECT TOP (1) id,due_date FROM DonHang WHERE status IN ('XAC_NHAN','DANG_GIAO') ORDER BY id DESC");
  if(!order){console.log('NO_EXISTING_CONFIRMED_ORDER; no fixtures created');return;}
  const startDate=require('../src/shared/business-context').businessDate(),endDate=order.due_date>=startDate?order.due_date:startDate;
  const result=await require('../src/modules/production/planning-context').planningContext(c,{principal,params:{id:order.id},query:{startDate,endDate}});
  console.log(JSON.stringify({orderId:result.order.id,status:result.order.status,startDate,endDate,warehouseCount:principal.warehouseIds.length,lines:result.order.lines.map(l=>({product:l.productCode,quantityBase:l.quantityBase,remainingBase:l.remainingBase,bomVersions:l.boms.length,readyWorkshopCandidates:l.workshops.length,workshops:l.workshops.map(w=>({code:w.code,preferred:w.preferred,capacity:w.freeCapacityBase})),materials:l.boms.map(b=>({revision:b.revision,materials:b.materials.map(m=>({code:m.code,requiredForOrder:require('../src/shared/decimal').parse(l.remainingBase)>0n?require('../src/shared/decimal').demand(l.remainingBase,m.quantityPerOutputBase,b.outputQuantityBase,m.discrete):'0.000000',onHand:m.onHandBase,reserved:m.reservedBase,available:m.availableBase}))}))})),readOnly:true}));
 });}finally{await pool.end();}
}
main().catch(error=>{console.error(error.code||'PLANNING_CONTEXT_INSPECTION_FAILED');process.exitCode=1;});
