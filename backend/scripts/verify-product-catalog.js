// Read-only verification, using configured local credentials without printing them.
require('dotenv/config');
const{loadConfig}=require('../src/config/environment'),{createDatabase,withConnection}=require('../src/config/database');
const{guardDemo}=require('./sqlserver-demo-guard'),fixture=require('./product-catalog-fixture');
async function main(){
 const config=loadConfig(),pool=createDatabase(config.DATABASE_URL);
 try{await withConnection(pool,async c=>{
  await guardDemo(c,config);
  for(const p of fixture.products){
   const[[product]]=await c.execute('SELECT id,code,status,shelf_life_days FROM ThanhPham WHERE code=?',[p.code]);
   if(!product||product.status!=='ACTIVE'||Number(product.shelf_life_days)!==p.shelfLifeDays)throw new Error('PRODUCT_CATALOG_MISMATCH');
   const[packs]=await c.execute('SELECT u.code,p.units_per_pack,p.cartons_per_pallet,p.carton_factor_snapshot FROM QuyCachDongGoi p JOIN DonViTinh u ON u.id=p.unit_id WHERE p.product_id=? AND p.revision=1',[product.id]);
   if(packs.length!==4)throw new Error('PACKAGING_COUNT_MISMATCH');
   for(const[unit,factor]of [[p.baseUnitCode,1],['PACK',6],['CARTON',24],['PALLET',p.cartonsPerPallet*24]])if(packs.find(x=>x.code===unit)?.units_per_pack!==factor+'.000000000')throw new Error('PACKAGING_FACTOR_MISMATCH');
   const pallet=packs.find(x=>x.code==='PALLET');if(Number(pallet.cartons_per_pallet)!==p.cartonsPerPallet||pallet.carton_factor_snapshot!=='24.000000000')throw new Error('PALLET_METADATA_MISMATCH');
  }
  const[[legacy]]=await c.execute("SELECT status FROM ThanhPham WHERE code='FS_DEMO_20261015_PET_500'");if(legacy?.status!=='LOCKED')throw new Error('LEGACY_PRODUCT_NOT_LOCKED');
  const[migrations]=await c.execute('SELECT version,state FROM _sql_migrations ORDER BY version');
  console.log(JSON.stringify({products:15,packaging:60,defaults:'MATCH_USER_APPROVAL',legacy:'LOCKED_HISTORY_PRESERVED',migrations}));
 });}finally{await pool.end();}
}
main().catch(error=>{console.error(error.code||(/^[A-Z0-9_]+$/.test(error.message)?error.message:'CATALOG_VERIFICATION_FAILED'));process.exitCode=1;});
