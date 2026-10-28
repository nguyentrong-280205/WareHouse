// User-authorized focused transaction verification; isolated warehouse_test only.
const fs=require('node:fs'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const url=fs.readFileSync('/run/secrets/test_app_url','utf8').trim();process.env.NODE_ENV='test';process.env.TEST_ALLOWED_ENDPOINTS='sqlserver:1433';process.env.TEST_INSTANCE_ID=fs.readFileSync('/run/secrets/test_marker','utf8').trim();
const{createDatabase,withTransaction,withConnection}=require('../src/config/database'),{verifyTestDatabase}=require('../src/shared/test-guard'),repo=require('../src/shared/business-repository'),d=require('../src/shared/decimal'),{transferWithin}=require('../src/modules/inventory/location-transfer');
const prefix='lt_'+randomUUID().replace(/-/g,'').slice(0,12),rollback=Error('ROLLBACK_TEST_FIXTURE');
async function lockCheck(pool,warehouseId){await withConnection(pool,async a=>withConnection(pool,async b=>{
 await a.beginTransaction();await b.beginTransaction();
 try{const resource='warehouse:location-transfer:'+warehouseId,query="DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=?,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=0; SELECT @r AS value";
  const[first]=await a.execute(query,[resource]),[second]=await b.execute(query,[resource]);assert.ok(first[0].value>=0);assert.ok(second[0].value<0,'second transaction must not acquire transfer lock');
 }finally{await b.rollback();await a.rollback();}
}));}
async function main(){const pool=createDatabase(url);let completed=false;try{
 try{await withTransaction(pool,async c=>{
  await verifyTestDatabase(c,url,process.env.TEST_ALLOWED_ENDPOINTS,process.env.TEST_INSTANCE_ID);
  const[[roleRow]]=await c.execute('INSERT INTO VaiTroQuyen(code,name) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?)',[prefix,prefix]);const role=roleRow.id;
  let[[permission]]=await c.execute('SELECT id FROM Quyen WHERE code=?',['warehouses.write']);if(!permission){[[permission]]=await c.execute('INSERT INTO Quyen(code) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?)',['warehouses.write']);}
  await c.execute('INSERT INTO VaiTro_Quyen(role_id,permission_id) VALUES (?,?)',[role,permission.id]);
  const[[accountRow]]=await c.execute('INSERT INTO TaiKhoan(code,login,password_hash,display_name,role_id,customer_id,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES(?,?,?,?,?,NULL,?)',[prefix,prefix,'TEST_FIXTURE_NO_LOGIN',prefix,role,'2026-01-01 00:00:00.000']);const account=accountRow.id;
  let unit=await repo.one(c,'DonViTinh',{code:'KG'});if(!unit){const id=await repo.insert(c,'DonViTinh',{code:'KG',name:'Kilogram',dimension:'MASS',discrete:false,scale:6});unit={id};}
  const warehouse=await repo.insert(c,'Kho',{code:prefix,name:prefix,type:'MATERIAL',capacity:'100',capacity_unit_id:unit.id,created_by_id:account});
  await c.execute('INSERT INTO TaiKhoan_Kho(account_id,warehouse_id) VALUES (?,?)',[account,warehouse]);
  const source=await repo.insert(c,'ViTriLuuKho',{code:prefix+'_source',name:'Source',warehouse_id:warehouse,capacity:'100',capacity_unit_id:unit.id,storage_rule:'DRY',created_by_id:account});
  const target=await repo.insert(c,'ViTriLuuKho',{code:prefix+'_target',name:'Target',warehouse_id:warehouse,capacity:'5',capacity_unit_id:unit.id,storage_rule:'DRY',created_by_id:account});
  const material=await repo.insert(c,'NguyenLieu',{code:prefix,name:prefix,base_unit_id:unit.id,requires_expiry:false,storage_condition:'DRY',created_by_id:account});
  const lot=await repo.insert(c,'LoNguyenLieu',{code:prefix,material_id:material,manufactured_on:'2026-01-01',created_by_id:account});
  const factor=await repo.insert(c,'HeSoChiemCho',{material_id:material,capacity_unit_id:unit.id,revision:1,factor_per_base:'1',effective_at:'2026-01-01 00:00:00.000'});
  const balance=await repo.insert(c,'TonKho',{location_id:source,material_lot_id:lot,product_lot_id:null,quality_bucket:'DAT',qty_on_hand:'10.500000',qty_reserved:'0',capacity_factor_id:factor,capacity_factor_snapshot:'1'});
  await c.execute('INSERT INTO ViTriNguyenLieuDuocPhep(location_id,material_id) VALUES (?,?)',[target,material]);
  const params={warehouseId:warehouse,sourceLocationId:source,accountId:account,expected:[{balanceId:balance,lotId:lot,materialId:material,targetLocationId:target,quantity:'10.500000'}]};
  await lockCheck(pool,warehouse);
  await c.raw('SAVE TRANSACTION before_capacity_failure');
  await assert.rejects(()=>transferWithin(c,params),e=>e.code==='LOCATION_CAPACITY_EXCEEDED');
  await c.raw('ROLLBACK TRANSACTION before_capacity_failure');
  assert.equal(d.parse((await repo.one(c,'TonKho',{id:balance})).qty_on_hand),d.parse('10.5'));
  assert.equal((await repo.find(c,'PhieuChuyenViTri',{source_location_id:source})).length,0);
  assert.equal((await repo.find(c,'TonKho',{location_id:target})).length,0);
  await repo.update(c,'ViTriLuuKho',{id:target},{capacity:'100'});
  await assert.rejects(()=>transferWithin(c,{...params,expected:[{...params.expected[0],quantity:'11'}]}),e=>e.code==='TRANSFER_SNAPSHOT_CHANGED');
  const result=await transferWithin(c,params),afterSource=await repo.one(c,'TonKho',{id:balance}),afterTarget=await repo.one(c,'TonKho',{id:result.lines[0].destinationBalanceId});
  assert.equal(d.parse(afterSource.qty_on_hand),0n);assert.equal(d.parse(afterTarget.qty_on_hand),d.parse('10.5'));
  assert.equal((await repo.one(c,'ViTriLuuKho',{id:source})).status,'LOCKED');
  const ledger=await repo.find(c,'LichSuBienDongTon',{posting_id:result.postingId});assert.equal(ledger.length,2);assert.equal(ledger.reduce((n,l)=>n+d.parse(l.quantity_delta,6,20,true),0n),0n);
  assert.equal((await repo.find(c,'ChiTietChuyenViTri',{transfer_id:result.transferId})).length,1);
  completed=true;throw rollback;
 },{beforeBegin:c=>verifyTestDatabase(c,url,process.env.TEST_ALLOWED_ENDPOINTS,process.env.TEST_INSTANCE_ID)});}catch(e){if(e!==rollback)throw e;}
 assert.ok(completed);const[remains]=await pool.execute('SELECT id FROM Kho WHERE code=?',[prefix]);assert.equal(remains.length,0,'fixture must roll back');
 console.log('LOCATION_TRANSFER_FOCUSED_CHECK_PASSED real warehouse_test: rollback after capacity failure, snapshot rejection, conserved paired ledger, source lock, concurrency lock and full fixture rollback.');
 }finally{await pool.end();}}
main().catch(e=>{console.error('LOCATION_TRANSFER_FOCUSED_CHECK_FAILED '+(e.code||e.message));process.exitCode=1;});
