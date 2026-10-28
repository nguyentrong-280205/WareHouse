require('dotenv/config');
const {randomUUID}=require('node:crypto');
const{loadConfig}=require('../src/config/environment');
const{createDatabase,withTransaction,withConnection}=require('../src/config/database');
const{guardDemo}=require('./sqlserver-demo-guard');
const fixture=require('./product-price-fixture'),repo=require('../src/shared/business-repository');
const {currentPrice}=require('../src/modules/orders/repository');
const{businessDate}=require('../src/shared/business-context');
const d=require('../src/shared/decimal');
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_DOCKER_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL),verify=process.argv.includes('--verify');
 try{
  const execute=verify?withConnection:withTransaction;
  await execute(pool,async c=>{
   await guardDemo(c,config);
   // Match the server clock used by currentPrice; avoid a future price if container clocks differ.
   const[[clock]]=await c.execute('SELECT CONVERT(varchar(23),SYSUTCDATETIME(),121) AS effective_at');
   const[[actor]]=await c.execute("SELECT id FROM TaiKhoan WHERE code=N'UC01_DEMO_warehouse' AND status='ACTIVE'");if(!actor)throw new Error('PRICE_SEED_ACTOR_REQUIRED');
   const summary={revision:fixture.revision,inserted:0,preserved:0,products:15,units:0,sample:[]};
   for(const p of fixture.products){
    const product=await repo.one(c,'ThanhPham',{code:p.code},{lock:!verify});if(!product)throw new Error('PRICE_PRODUCT_REQUIRED');
    // Keep one effective packaging version per unit; use its exact factor, including administrator changes.
    const versions=await require('../src/modules/warehouse/repository').packaging(c,product.id),packs=new Map();
    for(const pack of versions)if(pack.effective_from<=businessDate())packs.set(String(pack.unit_id),pack);
    if(packs.size!==4)throw new Error('PRICE_EFFECTIVE_PACKAGING_REQUIRED');
    for(const pack of packs.values()){
     const existing=await repo.find(c,'GiaBanThanhPham',{product_id:product.id,unit_id:pack.unit_id},{lock:!verify});
     if(!verify&&!existing.length){
      const raw=d.parse(p.basePrice)*d.positive(pack.units_per_pack,9);
      if(raw%d.ten(9))throw new Error('PRICE_FACTOR_PRECISION_INVALID');
      const unitPrice=d.format(raw/d.ten(9));d.parse(unitPrice);
      const priceId=await repo.insert(c,'GiaBanThanhPham',{product_id:product.id,unit_id:pack.unit_id,revision:1,unit_price:unitPrice,effective_at:clock.effective_at,created_by_id:actor.id});
      await repo.audit(c,{accountId:null,system:true},'catalog.samplePrices.seed','GiaBanThanhPham',priceId,null,{revision:fixture.revision,productCode:p.code,unitCode:pack.unit_code,unitPrice,packagingVersionId:pack.id},randomUUID());
      summary.inserted++;
     }else summary.preserved++;
     const price=await currentPrice(c,product.id,pack.unit_id);if(!price)throw new Error('PRICE_NOT_CURRENT_REVIEW_REQUIRED');
     summary.units++;
     if(p.code==='TP001')summary.sample.push({product:p.code,unit:pack.unit_code,price:price.unit_price,amountFor5:d.money('5',price.unit_price)});
    }
   }
   console.log(JSON.stringify({...summary,mode:verify?'READ_ONLY_VERIFICATION':'FILL_MISSING_ONLY',existingOrders:'UNCHANGED'}));
  });
 }finally{await pool.end();}
}
main().catch(error=>{console.error('PRODUCT_PRICES_FAILED '+(/^[A-Z0-9_]+$/.test(error.message)?error.message:error.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
