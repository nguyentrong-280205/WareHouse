require('dotenv/config');
const{randomUUID}=require('node:crypto');
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database');
const repo=require('../src/shared/business-repository'),fixture=require('./supplier-price-fixture'),d=require('../src/shared/decimal');
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL);
 try{await withTransaction(pool,async c=>{
  await require('./sqlserver-demo-guard').guardDemo(c,config);
  await c.execute("DECLARE @r int; EXEC @r=sp_getapplock @Resource=N'warehouse:supplier-quotes-20261026',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'SUPPLIER_SEED_LOCK',1;");
  const summary={suppliersAdded:0,quotesAdded:0,quotesPreserved:0,materials:0},ids=new Map();
  for(const supplier of fixture.suppliers){let row=await repo.one(c,'NhaCungCap',{code:supplier.code},{lock:true});if(row&&(row.name!==supplier.name||row.status!=='ACTIVE'))throw new Error('SUPPLIER_CODE_CONFLICT_NO_OVERWRITE');if(!row){const id=await repo.insert(c,'NhaCungCap',{...supplier,address:'Địa chỉ mẫu phục vụ đồ án; không phải thông tin doanh nghiệp xác nhận.'});row=await repo.one(c,'NhaCungCap',{id});summary.suppliersAdded++;await repo.audit(c,{accountId:null,system:true},'suppliers.sample.create','NhaCungCap',id,null,{...supplier,fixture:fixture.revision},randomUUID());}ids.set(supplier.code,row.id);}
  const[[clock]]=await c.execute('SELECT CONVERT(varchar(23),SYSUTCDATETIME(),121) AS effective_at');
  for(const material of await repo.find(c,'NguyenLieu',{status:'ACTIVE'})){
   const spec=fixture.materials.find(m=>m.code===material.code),legacy=require('./full-system-fixture').materials.find(m=>material.code===require('./full-system-fixture').revision+'_'+m.code);
   if(!spec&&!legacy)throw new Error('UNMAPPED_MATERIAL_REQUIRES_REVIEW');
   const oldPrices={PET:'1100',CAP:'180',LABEL:'120',BOX:'4500'};
   const base=spec?spec.price:oldPrices[legacy.code];if(!base)throw new Error('LEGACY_PRICE_MAPPING_REQUIRED');
   const supplier=spec?spec.supplier:({PET:'NCC002',CAP:'NCC002',LABEL:'NCC003',BOX:'NCC003'}[legacy.code]);
   for(const code of [supplier,'NCC009']){
    const key={supplier_id:ids.get(code),material_id:material.id,unit_id:material.base_unit_id};
    if((await repo.find(c,'BaoGiaNguyenLieu',key,{lock:true})).length){summary.quotesPreserved++;continue;}
    const raw=d.parse(base)*(code==='NCC009'?108n:100n);if(raw%100n)throw new Error('PRICE_PRECISION_INVALID');
    const price=d.format(raw/100n);d.parse(price);
    const id=await repo.insert(c,'BaoGiaNguyenLieu',{...key,revision:1,unit_price:price,effective_at:clock.effective_at});summary.quotesAdded++;
    await repo.audit(c,{accountId:null,system:true},'suppliers.sample.quote','BaoGiaNguyenLieu',id,null,{...key,price,fixture:fixture.revision},randomUUID());
   }
   summary.materials++;
  }
  console.log(JSON.stringify({...summary,mode:'FILL_MISSING_ONLY',existingOrders:'UNCHANGED'}));
 });}finally{await pool.end();}
}
main().catch(e=>{console.error('SUPPLIER_SEED_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));if(e instanceof TypeError)console.error(e.message+' '+(e.stack.match(/seed-supplier-quotes\.js:\d+:\d+/)||[''])[0]);process.exitCode=1;});
