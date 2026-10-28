require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[k,f]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[k]&&fs.existsSync('/run/secrets/'+f))process.env[k]=fs.readFileSync('/run/secrets/'+f,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),repo=require('../src/shared/business-repository');
const layout=[
 {code:'VITRi-A',name:'Nguyên liệu sản xuất khô',capacity:'2000.000000',materials:['NVL011','NVL017','NVL018']},
 {code:'VITRi-B',name:'Hương liệu',capacity:'1000.000000',materials:['NVL013','NVL014','NVL015','NVL016','NVL019']},
 {code:'VITRi-C',name:'Bao bì chai và lon',capacity:'2000.000000',materials:['NVL001','NVL002','NVL003','NVL004','NVL005','NVL006','NVL007','NVL008','FS_DEMO_20261015_CAP','FS_DEMO_20261015_PET']},
 {code:'VITRi-D',name:'Vật tư đóng gói',capacity:'1500.000000',materials:['NVL009','NVL010','FS_DEMO_20261015_BOX','FS_DEMO_20261015_LABEL']},
 {code:'VITRi-E',name:'Nước đã xử lý',capacity:'3000.000000',materials:['NVL012']},
 {code:'VITRi-F',name:'Khí thực phẩm',capacity:'500.000000',materials:['NVL020']},
];
async function main(){const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw Error('PORTABLE_TARGET_REQUIRED');const pool=createDatabase(config.DATABASE_URL);try{const result=await withTransaction(pool,async c=>{
 await require('./sqlserver-demo-guard').guardDemo(c,config);
 await c.raw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'warehouse:material-location-layout-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'LOCATION_LAYOUT_LOCK',1;");
 const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='materialLocations.layout.initialized'");if(done)return{status:'ALREADY_CONFIGURED',noOverwrite:true,noRegrant:true};
 const warehouse=await repo.one(c,'Kho',{code:'FS_DEMO_20261015_NL'},{lock:true});if(!warehouse||warehouse.status!=='ACTIVE'||warehouse.type!=='MATERIAL')throw Error('MATERIAL_WAREHOUSE_REQUIRED');
 const unit=await repo.one(c,'DonViTinh',{id:warehouse.capacity_unit_id});if(!unit||unit.code!=='KG'||require('../src/shared/decimal').parse(warehouse.capacity)<require('../src/shared/decimal').parse('10000'))throw Error('CAPACITY_CONFIGURATION_CONFLICT');
 const[[actor]]=await c.execute("SELECT TOP(1) a.id FROM TaiKhoan a JOIN VaiTroQuyen r ON r.id=a.role_id JOIN TaiKhoan_Kho s ON s.account_id=a.id WHERE a.status='ACTIVE' AND r.status='ACTIVE' AND s.warehouse_id=? AND EXISTS(SELECT 1 FROM VaiTro_Quyen v JOIN Quyen q ON q.id=v.permission_id WHERE v.role_id=a.role_id AND q.code='warehouses.write') ORDER BY a.id",[warehouse.id]);if(!actor)throw Error('WAREHOUSE_MANAGER_REQUIRED');
 const[[open]]=await c.execute("SELECT COUNT(*) AS n FROM PhieuNhapKho WHERE warehouse_id=? AND kind='MATERIAL' AND status NOT IN ('HOAN_THANH','HUY')",[warehouse.id]);if(Number(open.n))throw Error('OPEN_MATERIAL_RECEIPTS_REVIEW_REQUIRED');
 const all=[];for(const group of layout){if(await repo.one(c,'ViTriLuuKho',{warehouse_id:warehouse.id,code:group.code},{lock:true}))throw Error('LOCATION_CODE_CONFLICT_NO_OVERWRITE');for(const code of group.materials){const m=await repo.one(c,'NguyenLieu',{code,status:'ACTIVE'},{lock:true});if(!m||m.storage_condition?.trim().toUpperCase()!=='DRY')throw Error('MATERIAL_MAPPING_REVIEW_REQUIRED');all.push({group:group.code,id:m.id,code});}}
 const created=[];for(const group of layout){const id=await repo.insert(c,'ViTriLuuKho',{warehouse_id:warehouse.id,code:group.code,name:group.name,area:group.code.slice(-1),capacity:group.capacity,capacity_unit_id:unit.id,storage_rule:'DRY',created_by_id:actor.id});for(const item of all.filter(x=>x.group===group.code))await c.execute('INSERT INTO ViTriNguyenLieuDuocPhep(location_id,material_id) VALUES(?,?)',[id,item.id]);created.push({id,code:group.code,name:group.name,capacity:group.capacity,materials:group.materials});}
 await repo.audit(c,{accountId:null,system:true},'materialLocations.layout.initialized','Kho',warehouse.id,null,{locations:created,existingStockUnchanged:true,noPermissionsChanged:true},randomUUID());return{status:'CONFIGURED',locations:created,mappings:all.length};
 });console.log(JSON.stringify(result));}finally{await pool.end();}}
main().catch(e=>{console.error('MATERIAL_LOCATION_LAYOUT_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
