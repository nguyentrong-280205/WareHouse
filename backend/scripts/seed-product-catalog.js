require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
const {loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction,withConnection}=require('../src/config/database');
const repo=require('../src/shared/business-repository'),fixture=require('./product-catalog-fixture');
const markerFile='.artifacts/product-catalog-20261023.json';
async function main(){
 const config=loadConfig(),pool=createDatabase(config.DATABASE_URL);
 try{
  if(fs.existsSync(markerFile)){
   const marker=JSON.parse(fs.readFileSync(markerFile,'utf8'));
   if(marker.revision!==fixture.revision||marker.machine!==(config.db.machine||config.db.instance))throw new Error('CATALOG_INSTALLATION_CONFLICT');
   await withConnection(pool,async c=>{
    await require('./sqlserver-demo-guard').guardDemo(c,config);
    for(const product of fixture.products)if(!await repo.one(c,'ThanhPham',{code:product.code}))throw new Error('CATALOG_MARKER_DATABASE_MISMATCH');
   });
   console.log('PRODUCT_CATALOG_CURRENT no_reseed_or_overwrite');return;
  }
  await withTransaction(pool,async c=>{
   await require('./sqlserver-demo-guard').guardDemo(c,config);
   const[[schema]]=await c.execute("SELECT COUNT(*) AS n FROM _sql_migrations WHERE version='202610230001_product_description' AND state='APPLIED'");
   if(Number(schema.n)!==1)throw new Error('PRODUCT_CATALOG_MIGRATION_REQUIRED');
   const [[actor]]=await c.execute("SELECT id FROM TaiKhoan WITH(UPDLOCK,HOLDLOCK) WHERE code=N'UC01_DEMO_warehouse' AND status='ACTIVE'");if(!actor)throw new Error('CATALOG_SEED_ACTOR_REQUIRED');
   const units={};for(const code of ['BOTTLE','CAN','PACK','CARTON','PALLET']){const unit=await repo.one(c,'DonViTinh',{code});if(!unit)throw new Error('CATALOG_UNIT_REQUIRED');units[code]=unit.id;}
   for(const p of fixture.products)if(await repo.one(c,'ThanhPham',{code:p.code},{lock:true}))throw new Error('CATALOG_CODE_EXISTS_NO_OVERWRITE');
   const ids=[];
   for(const p of fixture.products){
    const id=await repo.insert(c,'ThanhPham',{code:p.code,name:p.name,base_unit_id:units[p.baseUnitCode],container_type:p.containerType,volume_ml:p.volumeMl,shelf_life_days:p.shelfLifeDays,description:p.description,status:'ACTIVE',created_by_id:actor.id});ids.push(id);
    for(const[code,factor]of [[p.baseUnitCode,1],['PACK',6],['CARTON',24],['PALLET',p.cartonsPerPallet*24]]){
     await repo.insert(c,'QuyCachDongGoi',{product_id:id,unit_id:units[code],revision:1,units_per_pack:factor+'.000000000',effective_from:fixture.effectiveFrom,created_by_id:actor.id,
      ...(code==='PALLET'?{cartons_per_pallet:p.cartonsPerPallet,carton_factor_snapshot:'24.000000000'}:{})});
    }
   }
   const legacy=await repo.one(c,'ThanhPham',{code:'FS_DEMO_20261015_PET_500'},{lock:true});
   if(legacy&&legacy.status!=='LOCKED'){
    await repo.update(c,'ThanhPham',{id:legacy.id},{status:'LOCKED',version:Number(legacy.version)+1,updated_at:new Date().toISOString().slice(0,23).replace('T',' ')});
    await repo.audit(c,{accountId:null,system:true},'catalog.legacyProduct.lock','ThanhPham',legacy.id,legacy,{status:'LOCKED',reason:'User approved replacement with TP001–TP015; preserve history'},randomUUID());
   }
   await repo.audit(c,{accountId:null,system:true},'catalog.sampleProducts.seed','ThanhPham',ids[0],null,{revision:fixture.revision,productIds:ids,noPricesInvented:true,noStockOrLotsCreated:true},randomUUID());
   fs.mkdirSync('.artifacts',{recursive:true});
   fs.writeFileSync(markerFile,JSON.stringify({revision:fixture.revision,machine:config.db.machine||config.db.instance,productIds:ids,createdAt:new Date().toISOString()}),{flag:'wx',mode:0o600});
  });
  console.log('PRODUCT_CATALOG_SEEDED products=15 packaging=60 legacy=LOCKED prices=NOT_CONFIGURED existing_history=PRESERVED');
 }finally{await pool.end();}
}
main().catch(error=>{console.error('PRODUCT_CATALOG_SEED_FAILED '+(/^[A-Z0-9_]+$/.test(error.message)?error.message:error.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
