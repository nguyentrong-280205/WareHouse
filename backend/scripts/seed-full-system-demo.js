require('dotenv/config');
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database');
const repo=require('../src/shared/business-repository'),fixture=require('./full-system-fixture'),{roles}=require('./uc01-data');
const{randomUUID}=require('node:crypto');
const prefix=fixture.revision+'_',effective='2026-10-15',effectiveAt=effective+' 00:00:00.000';
async function ensure(c,table,key,values,decimalFields=[]){
 const existing=await repo.one(c,table,key,{lock:true});if(existing){for(const[k,v]of Object.entries(values)){if(v===undefined)continue;const same=decimalFields.includes(k)?require('../src/shared/decimal').parse(String(existing[k]),k.includes('factor')||k==='units_per_pack'?9:6)===require('../src/shared/decimal').parse(String(v),k.includes('factor')||k==='units_per_pack'?9:6):(typeof existing[k]==='boolean'?Number(existing[k]):String(existing[k]))===(typeof existing[k]==='boolean'?Number(v):String(v));if(!same)throw new Error('DEMO_CONFLICT_NO_OVERWRITE');}return String(existing.id);}
 return repo.insert(c,table,{...key,...values});
}
async function main(){
 const config=loadConfig();if(config.NODE_ENV!=='development'||config.db.database!=='warehouse_db'||config.db.user!=='warehouse_app'||!(config.db.instance==='HTTT02'||config.db.machine==='warehouse-sqlserver'))throw new Error('UNSAFE_DEMO_TARGET');const pool=createDatabase(config.DATABASE_URL);
 try{await withTransaction(pool,async c=>{
  await require('./sqlserver-demo-guard').guardDemo(c,config);
  const[[consolidated]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE action='workshops.consolidate.completed' AND actor_kind='SYSTEM'");if(consolidated){console.log('LEGACY_WORKSHOP_SEED_SKIPPED_AFTER_CONSOLIDATION');return;}

  const[[migration]]=await c.execute("SELECT COUNT(*) AS n FROM _sql_migrations WHERE version='202610160001_native_schema' AND state='APPLIED' AND finished_at IS NOT NULL");if(Number(migration.n)!==1)throw new Error('MIGRATION_REQUIRED');
  const accounts=(await c.execute('SELECT id,code,role_id,customer_id FROM TaiKhoan WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE code LIKE ? ORDER BY id',['UC01_DEMO_%']))[0],roleRows=(await c.execute('SELECT id,code FROM VaiTroQuyen WITH (HOLDLOCK,ROWLOCK) WHERE code LIKE ? ORDER BY id',['UC01_DEMO_%']))[0];
  if(accounts.length!==10||roleRows.length!==9)throw new Error('UC01_DEMO_REQUIRED_NO_ACCOUNT_OVERWRITE');
  const manager=accounts.find(a=>String(a.role_id)===String(roleRows.find(r=>r.code==='UC01_DEMO_warehouse')?.id));if(!manager)throw new Error('UC01_DEMO_REQUIRED');
  const actor=String(manager.id),unitIds={},warehouseIds=[];
  for(const u of fixture.units){const{code,...values}=u;unitIds[code]=await ensure(c,'DonViTinh',{code},values);}
  const productId=await ensure(c,'ThanhPham',{code:prefix+'PET_500'},{name:'Thành phẩm PET 500ml giả FS',base_unit_id:unitIds.BOTTLE,container_type:'PET',volume_ml:'500.000000',shelf_life_days:180,created_by_id:actor},['volume_ml']);
  const materialIds={};for(const m of fixture.materials)materialIds[m.code]=await ensure(c,'NguyenLieu',{code:prefix+m.code},{name:m.name,base_unit_id:unitIds.PIECE,requires_expiry:0,storage_condition:'DRY',created_by_id:actor});
  for(const p of fixture.packaging){await ensure(c,'QuyCachDongGoi',{product_id:productId,unit_id:unitIds[p.unit],revision:1},{units_per_pack:p.factor,effective_from:effective,created_by_id:actor},['units_per_pack']);await ensure(c,'GiaBanThanhPham',{product_id:productId,unit_id:unitIds[p.unit],revision:1},{unit_price:p.price,effective_at:effectiveAt,created_by_id:actor},['unit_price']);}
  for(const w of fixture.warehouses){const id=await ensure(c,'Kho',{code:prefix+w.suffix},{name:w.name,type:w.type,capacity:w.capacity,capacity_unit_id:unitIds.KG,created_by_id:actor},['capacity']);warehouseIds.push(id);for(const l of w.locations)await ensure(c,'ViTriLuuKho',{warehouse_id:id,code:prefix+l.code},{name:'Vị trí giả '+l.code,capacity:l.capacity,capacity_unit_id:unitIds.KG,storage_rule:'DRY',created_by_id:actor},['capacity']);}
  const workshopId=await ensure(c,'XuongSanXuat',{code:prefix+'WS_A'},{name:'Xưởng giả FS A'});await ensure(c,'NhaCungCap',{code:prefix+'SUPPLIER'},{name:'Nhà cung cấp giả FS',address:'Dữ liệu giả cho chạy cục bộ'});
  const bomId=await ensure(c,'DinhMuc',{product_id:productId,revision:1},{output_qty_base:'24.000000',wastage_percent:'0.000000',effective_from:effective,created_by_id:actor},['output_qty_base','wastage_percent']);
  for(const m of fixture.materials){await ensure(c,'ChiTietDinhMuc',{bom_id:bomId,material_id:materialIds[m.code]},{unit_id:unitIds.PIECE,qty_per_output:m.per24},['qty_per_output']);for(const[u,factor]of [['KG',m.kg],['M3',m.m3]])await ensure(c,'HeSoChiemCho',{material_id:materialIds[m.code],product_id:null,capacity_unit_id:unitIds[u],revision:1},{factor_per_base:factor,effective_at:effectiveAt},['factor_per_base']);}
  for(const[u,factor]of [['KG','0.550000000'],['M3','0.000900000']])await ensure(c,'HeSoChiemCho',{material_id:null,product_id:productId,capacity_unit_id:unitIds[u],revision:1},{factor_per_base:factor,effective_at:effectiveAt},['factor_per_base']);
  for(const day of fixture.workingDates)await ensure(c,'LichNangLucXuong',{workshop_id:workshopId,product_id:productId,business_date:day},{capacity_base:fixture.dailyCapacity},['capacity_base']);
  for(const r of roles){const role=roleRows.find(x=>x.code==='UC01_DEMO_'+r.code);if(!role)throw new Error('UC01_ROLE_REQUIRED');for(const code of fixture.extraPermissions[r.code]||[]){let q=(await c.execute('SELECT id FROM Quyen WHERE code=?',[code]))[0][0];if(!q){q=(await c.execute('INSERT INTO Quyen(code,description) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?)',[code,'FS01–FS12 approved support action']))[0][0];}if(!(await c.execute('SELECT 1 AS present FROM VaiTro_Quyen WHERE role_id=? AND permission_id=?',[role.id,q.id]))[0].length)await c.execute('INSERT INTO VaiTro_Quyen(role_id,permission_id) VALUES (?,?)',[role.id,q.id]);}
   if(r.code==='customer')continue;for(const a of accounts.filter(a=>String(a.role_id)===String(role.id))){if(a.customer_id!==null)throw new Error('INTERNAL_CUSTOMER_CONFLICT');for(const warehouseId of warehouseIds)if(!(await c.execute('SELECT 1 AS present FROM TaiKhoan_Kho WHERE account_id=? AND warehouse_id=?',[a.id,warehouseId]))[0].length)await c.execute('INSERT INTO TaiKhoan_Kho(account_id,warehouse_id) VALUES (?,?)',[a.id,warehouseId]);if(!(await c.execute('SELECT 1 AS present FROM TaiKhoan_Xuong WHERE account_id=? AND workshop_id=?',[a.id,workshopId]))[0].length)await c.execute('INSERT INTO TaiKhoan_Xuong(account_id,workshop_id) VALUES (?,?)',[a.id,workshopId]);}
  }
  await repo.audit(c,{accountId:null,system:true},'demo.support.seed','Kho',warehouseIds[0],null,{revision:fixture.revision,warehouseIds,workshopId,productId,noOpeningStock:true,noAccountsAdded:true},randomUUID());
 });console.log('Full-system fake support configuration ready; no credentials printed, no account overwrite, no opening stock.');}finally{await pool.end();}
}
main().catch(error=>{console.error('FULL_SYSTEM_DEMO_FAILED: '+(/^[A-Z0-9_]+$/.test(error.message)?error.message:'CONFIGURATION_OR_CONFLICT')+'; no reset or overwrite.');process.exitCode=1;});
