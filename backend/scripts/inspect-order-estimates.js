// Read-only diagnosis for the portable local database. No login, fixture, order update or submit.
require('dotenv/config');
const{loadConfig}=require('../src/config/environment'),{createDatabase,withConnection}=require('../src/config/database');
const{createOrderService}=require('../src/modules/orders/service');
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL);
 try{
  await withConnection(pool,c=>require('./sqlserver-demo-guard').guardDemo(c,config));
  const[orders]=await pool.execute("SELECT TOP (5) o.id,o.customer_id FROM DonHang o JOIN KhachHang k ON k.id=o.customer_id WHERE o.status='NHAP' AND k.status='ACTIVE' ORDER BY o.id DESC");
  const service=createOrderService({read:fn=>withConnection(pool,fn)});
  for(const row of orders){
   const order=await service.read({params:{id:row.id},principal:{customerId:row.customer_id}});
   const[stored]=await pool.execute('SELECT total_amount,status,version FROM DonHang WHERE id=?',[row.id]);
   const[lines]=await pool.execute('SELECT unit_price,amount,price_id FROM ChiTietDonHang WHERE order_id=?',[row.id]);
   console.log(JSON.stringify({id:order.id,status:order.status,pricingStatus:order.pricingStatus,estimatedTotalAmount:order.estimatedTotalAmount,lines:order.lines.map(l=>({product:l.productCode,unit:l.unitName,quantity:l.quantity,estimatedUnitPrice:l.estimatedUnitPrice,estimatedAmount:l.estimatedAmount,reason:l.estimateUnavailableReason})),storedTotal:stored[0].total_amount,storedLinePrices:lines}));
  }
  if(!orders.length)console.log('NO_EXISTING_DRAFT_ORDERS; no fixtures created');
 }finally{await pool.end();}
}
main().catch(error=>{console.error(error.code||'ORDER_ESTIMATE_INSPECTION_FAILED');process.exitCode=1;});
