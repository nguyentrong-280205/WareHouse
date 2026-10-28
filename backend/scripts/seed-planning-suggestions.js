require('dotenv/config');
const{randomUUID}=require('node:crypto');
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database');
const repo=require('../src/shared/business-repository'),profile=require('./planning-sample-profile');
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_DOCKER_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL);
 try{
  const result=await withTransaction(pool,async c=>{
   await require('./sqlserver-demo-guard').guardDemo(c,config);
   await c.raw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'warehouse:seed:planning-suggestions-20261023',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'PLANNING_SEED_LOCK_UNAVAILABLE',1;");
   const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='planning.sample.completed' ORDER BY id");
   if(done){
    const lotPrefixes=require('../src/modules/warehouse/material-lot-codes').prefixes;
    const codes=profile.materials.flatMap(m=>[m.code+'_KHOITAO_20261023','LO-'+lotPrefixes[m.code]+'-01']);
    const[result]=await c.execute('UPDATE l SET first_received_at=p.posted FROM LoNguyenLieu l CROSS APPLY(SELECT MIN(s.created_at) AS posted FROM TonKho t JOIN LichSuBienDongTon h ON h.balance_id=t.id JOIN StockPosting s ON s.id=h.posting_id WHERE t.material_lot_id=l.id AND h.quantity_delta>0) p WHERE l.first_received_at IS NULL AND p.posted IS NOT NULL AND l.code IN ('+codes.map(()=>'?').join(',')+')',codes);
    if(result.affectedRows)await repo.audit(c,{accountId:null,system:true},'planning.sample.receiptDates','AuditLog',done.id,null,{filled:result.affectedRows,source:'First positive stock posting timestamp; only owned sample lots'},randomUUID());
    return{status:'ALREADY_INITIALIZED',noRefill:true,noScopeRegrant:true,receiptDatesFilled:result.affectedRows};
   }
   const[[clock]]=await c.execute('SELECT CONVERT(varchar(23),DATEADD(second,-1,SYSUTCDATETIME()),121) AS effective_at');
   async function actors(permission){
    const[rows]=await c.execute("SELECT DISTINCT a.id,a.role_id FROM TaiKhoan a JOIN VaiTroQuyen r ON r.id=a.role_id JOIN VaiTro_Quyen v ON v.role_id=r.id JOIN Quyen q ON q.id=v.permission_id WHERE q.code=? AND a.customer_id IS NULL AND a.status='ACTIVE' AND r.status='ACTIVE' ORDER BY a.id",[permission]);
    const output=[];for(const row of rows)output.push({accountId:row.id,roleId:row.role_id,...await require('../src/modules/auth/scope-repository').loadScopes(c,row.id)});return output;
   }
   const warehouse=await repo.one(c,'Kho',{code:'FS_DEMO_20261015_NL'},{lock:true});if(!warehouse||warehouse.status!=='ACTIVE')throw new Error('SAMPLE_MATERIAL_WAREHOUSE_REQUIRED');
   const manager=(await actors('stocktakes.create')).find(a=>a.warehouseIds.includes(warehouse.id));
   const board=(await actors('adjustments.decide')).find(a=>a.warehouseIds.includes(warehouse.id));
   const counters=(await actors('stocktakes.count')).filter(a=>a.warehouseIds.includes(warehouse.id)).slice(0,2);
   if(!manager||!board||counters.length!==2)throw new Error('SAMPLE_STOCKTAKE_ACTORS_REQUIRED');
   const units={};for(const code of ['PIECE','KG','L']){const unit=await repo.one(c,'DonViTinh',{code});if(!unit)throw new Error('SAMPLE_UNIT_REQUIRED');units[code]=unit.id;}
   for(const m of profile.materials)if(await repo.one(c,'NguyenLieu',{code:m.code},{lock:true}))throw new Error('SAMPLE_MATERIAL_CODE_CONFLICT');
   if(await repo.one(c,'ViTriLuuKho',{code:'VT_NVL_KHOITAO'}))throw new Error('SAMPLE_LOCATION_CODE_CONFLICT');
   const locationId=await repo.insert(c,'ViTriLuuKho',{warehouse_id:warehouse.id,code:'VT_NVL_KHOITAO',name:'Vị trí vật tư khởi tạo đồ án',area:'Khu vật tư mẫu',capacity:'3000.000000',capacity_unit_id:warehouse.capacity_unit_id,storage_rule:'DRY',created_by_id:manager.accountId});
   if(String(warehouse.capacity_unit_id)!==String(units.KG))throw new Error('SAMPLE_WAREHOUSE_CAPACITY_UNIT_CONFLICT');
   const materialIds={},lots={};
   for(const m of profile.materials){
    const id=await repo.insert(c,'NguyenLieu',{code:m.code,name:m.name,base_unit_id:units[m.unit],requires_expiry:m.requiresExpiry,storage_condition:'DRY',created_by_id:manager.accountId});materialIds[m.code]=id;
    await repo.insert(c,'HeSoChiemCho',{material_id:id,capacity_unit_id:units.KG,revision:1,factor_per_base:m.capacityFactor,effective_at:clock.effective_at});
    lots[m.code]=await repo.insert(c,'LoNguyenLieu',{code:m.code+'_KHOITAO_20261023',material_id:id,manufactured_on:'2026-10-01',expires_on:m.requiresExpiry?'2027-10-01':null,first_received_at:clock.effective_at,created_by_id:manager.accountId});
   }
   const workshopIds={};for(const code of ['XSX001','XSX002','XSX003','XSX004']){const row=await repo.one(c,'XuongSanXuat',{code});if(!row||row.status!=='ACTIVE')throw new Error('SAMPLE_WORKSHOP_REQUIRED');workshopIds[code]=row.id;}
   const[accounts]=await c.execute("SELECT a.id FROM TaiKhoan a WITH(UPDLOCK,HOLDLOCK) JOIN VaiTroQuyen r WITH(HOLDLOCK) ON r.id=a.role_id WHERE r.code IN ('UC01_DEMO_planner','UC01_DEMO_board','UC01_DEMO_workshop') AND a.customer_id IS NULL AND a.status='ACTIVE' AND r.status='ACTIVE'");
   let scopeLinks=0,boms=0,calendarDays=0;
   for(const account of accounts)for(const workshopId of Object.values(workshopIds))if(!(await c.execute('SELECT 1 AS present FROM TaiKhoan_Xuong WHERE account_id=? AND workshop_id=?',[account.id,workshopId]))[0].length){await c.execute('INSERT INTO TaiKhoan_Xuong(account_id,workshop_id) VALUES (?,?)',[account.id,workshopId]);scopeLinks++;}
   for(const recipe of profile.recipes){
    const product=await repo.one(c,'ThanhPham',{code:recipe.productCode},{lock:true});if(!product)throw new Error('SAMPLE_PRODUCT_REQUIRED');
    if(!(await repo.find(c,'DinhMuc',{product_id:product.id,is_plan_override:false})).length){
     const[[revision]]=await c.execute('SELECT COALESCE(MAX(revision),0)+1 AS value FROM DinhMuc WHERE product_id=?',[product.id]);
     const bom=await repo.insert(c,'DinhMuc',{product_id:product.id,revision:revision.value,output_qty_base:recipe.output,effective_from:profile.startDate,created_by_id:manager.accountId});
     for(const m of recipe.materials){const item=profile.materials.find(x=>x.code===m.code);await repo.insert(c,'ChiTietDinhMuc',{bom_id:bom,material_id:materialIds[m.code],unit_id:units[item.unit],qty_per_output:m.quantity});}boms++;
    }
    for(const code of recipe.workshops){
     const[result]=await c.execute("DECLARE @start date=CONVERT(date,?),@end date=CONVERT(date,?); WITH dates AS(SELECT @start AS day UNION ALL SELECT DATEADD(day,1,day) FROM dates WHERE day<@end) INSERT INTO LichNangLucXuong(workshop_id,product_id,business_date,capacity_base) SELECT ?,?,day,CONVERT(decimal(20,6),?) FROM dates d WHERE NOT EXISTS(SELECT 1 FROM LichNangLucXuong x WHERE x.workshop_id=? AND x.product_id=? AND x.business_date=d.day) OPTION(MAXRECURSION 100); SELECT @@ROWCOUNT AS inserted_count",[profile.startDate,profile.endDate,workshopIds[code],product.id,profile.dailyCapacity,workshopIds[code],product.id]);calendarDays+=Number(result[0].inserted_count);
    }
   }
   const inventory=await require('./planning-sample-inventory').initializeInventory(c,{manager,board,counters},warehouse,{id:locationId},lots,profile);
   await repo.audit(c,{accountId:null,system:true},'planning.sample.completed','BienBanKiemKe',inventory.stocktakeId,null,{revision:profile.revision,materials:20,boms,calendarDays,scopeLinks,scopeRoles:['planner','board','workshop'],...inventory},randomUUID());
   return{status:'INITIALIZED',materials:20,boms,calendarDays,scopeLinks,...inventory};
  });console.log(JSON.stringify(result));
 }finally{await pool.end();}
}
main().catch(error=>{try{require('node:fs').writeFileSync('.artifacts/planning-sample-error.json',JSON.stringify({code:error.code,number:error.number,message:error.message,preceding:error.precedingErrors?.map(e=>({number:e.number,message:e.message}))}));}catch{}console.error('PLANNING_SAMPLE_FAILED '+(/^[A-Z0-9_]+$/.test(error.message)?error.message:error.code||'CONFIGURATION_OR_TRANSACTION'));process.exitCode=1;});
