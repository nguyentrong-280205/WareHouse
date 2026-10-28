// Focused user-authorized checks only. Real SQL Server; all fixtures roll back.
const {randomUUID}=require('node:crypto');
const {createDatabase,withTransaction}=require('../../src/config/database');
const {verifyTestDatabase}=require('../../src/shared/test-guard');
const repo=require('../../src/shared/business-repository');
const inventoryRepo=require('../../src/modules/inventory/repository');
const {createWarehouseService}=require('../../src/modules/warehouse/service');
const {createOrderService}=require('../../src/modules/orders/service');
const {createInventoryService}=require('../../src/modules/inventory/service');
const {businessDate,now}=require('../../src/shared/business-context');
const {defaultExpiry}=require('../../src/shared/lot-expiry');
const decimal=require('../../src/shared/decimal');
const prefix='catalog_'+randomUUID().slice(0,8);
const url=process.env.TEST_DATABASE_URL;
let pool;
afterAll(async()=>{if(pool)await pool.end();});
test('conversion snapshots, editable defaults, lot history, real FEFO reservation and posting remain consistent',async()=>{
 pool=createDatabase(url);
 const guard=c=>verifyTestDatabase(c,url,process.env.TEST_ALLOWED_ENDPOINTS,process.env.TEST_INSTANCE_ID);
 const rollback=new Error('EXPECTED_FIXTURE_ROLLBACK');
 await expect(withTransaction(pool,async c=>{
  await guard(c);
  // Context routes service calls through the SAME real transaction. HTTP/auth wrappers are outside this focused check.
  const context={read:fn=>fn(c),write:(_req,_operation,fn)=>fn(c)};
  const warehouse=createWarehouseService(context),orders=createOrderService(context),inventory=createInventoryService(context);
  const [[role]]=await c.execute('INSERT INTO VaiTroQuyen(code,name) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?)',[prefix,prefix]);
  const [[account]]=await c.execute('INSERT INTO TaiKhoan(code,login,password_hash,display_name,role_id,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?,?,?,?,?)',[prefix,prefix,'NOT_A_LOGIN_HASH',prefix,role.id,now()]);
  const units={};
  for(const code of ['CAN','BOTTLE','PACK','CARTON','PALLET','KG']){
   const existing=await repo.one(c,'DonViTinh',{code});
   units[code]=existing?.id||await repo.insert(c,'DonViTinh',{code,name:code,dimension:code==='KG'?'MASS':'COUNT',discrete:code!=='KG',scale:code==='KG'?6:0});
  }
  const customerId=await repo.insert(c,'KhachHang',{code:prefix,name:prefix,updated_at:now()});
  const warehouseId=await repo.insert(c,'Kho',{code:prefix,name:prefix,type:'FINISHED',capacity:'100000',capacity_unit_id:units.KG,created_by_id:account.id});
  const locationId=await repo.insert(c,'ViTriLuuKho',{code:prefix,name:prefix,warehouse_id:warehouseId,capacity:'100000',capacity_unit_id:units.KG,created_by_id:account.id});
  const principal={accountId:account.id,customerId,warehouseIds:[warehouseId],permissions:['issues.read','issues.allocate','issues.confirmAllocation','issues.postSale']};
  const req=(body={},id)=>({body,params:id?{id}:{},principal,correlationId:randomUUID()});
  const packaging=[['CAN','1'],['PACK','6'],['CARTON','24'],['PALLET','1440']].map(([unitCode,unitsPerPack])=>({unitCode,unitsPerPack,revision:1,effectiveFrom:'2020-01-01',...(unitCode==='PALLET'?{cartonsPerPallet:60}:{})}));
  let product=await warehouse.mutate('products','create',req({code:prefix,name:prefix,baseUnitId:units.CAN,containerType:'CAN',volumeMl:'330',shelfLifeDays:365,description:'Isolated rollback fixture',packaging,salesPrices:[{unitId:units.PALLET,unitPrice:'100'}]}));
  const pack=code=>product.packaging.filter(p=>p.unitCode===code).at(-1);
  for(const[code,expected]of [['CAN','2.000000'],['PACK','12.000000'],['CARTON','48.000000'],['PALLET','2880.000000']])expect(decimal.convert('2',pack(code).unitsPerPack,true)).toBe(expected);
  expect(()=>decimal.convert('0.5','1',true)).toThrow();
  await expect(warehouse.mutate('products','create',req({code:prefix+'_bad',name:'bad',baseUnitId:units.BOTTLE,containerType:'CAN',volumeMl:'330',shelfLifeDays:365}))).rejects.toMatchObject({code:'PRODUCT_BASE_UNIT_INVALID'});
  const body=()=>({dueDate:businessDate(),deliveryAddress:'Fixture',recipient:'Fixture',recipientPhone:'0900000000',lines:[{productId:product.id,unitId:units.PALLET,packagingVersionId:pack('PALLET').id,quantity:'2'}]});
  const oldOrder=await orders.create(req(body()));
  product=await warehouse.mutate('products','update',req({expectedVersion:product.version,packaging:[{unitCode:'PALLET',unitsPerPack:'1920',cartonsPerPallet:80,revision:2,effectiveFrom:'2020-01-01'}]},product.id));
  const newOrder=await orders.create(req(body()));
  const oldLine=(await repo.find(c,'ChiTietDonHang',{order_id:oldOrder.id}))[0],newLine=(await repo.find(c,'ChiTietDonHang',{order_id:newOrder.id}))[0];
  expect(oldLine.factor_snapshot).toBe('1440.000000000');expect(oldLine.qty_base).toBe('2880.000000');
  expect(newLine.factor_snapshot).toBe('1920.000000000');expect(newLine.qty_base).toBe('3840.000000');
  await expect(warehouse.mutate('products','update',req({expectedVersion:product.version,packaging:[{unitCode:'PALLET',unitsPerPack:'1920',cartonsPerPallet:80,revision:1,effectiveFrom:'2020-01-01'}]},product.id))).rejects.toMatchObject({code:'PACKAGING_IMMUTABLE'});
  // Above expected service rejection writes no schema; outer transaction remains usable.
  product=await warehouse.read('products',req({},product.id));
  product=await warehouse.mutate('products','update',req({expectedVersion:product.version,packaging:[{unitCode:'PALLET',unitsPerPack:'1800',cartonsPerPallet:60,revision:3,effectiveFrom:'2020-01-01'},{unitCode:'CARTON',unitsPerPack:'30',revision:2,effectiveFrom:'2020-01-01'}]},product.id));
  expect(pack('PALLET').cartonFactorSnapshot).toBe('30.000000000');
  expect((await repo.one(c,'ChiTietDonHang',{id:oldLine.id})).factor_snapshot).toBe('1440.000000000');
  expect(defaultExpiry('2024-02-28',1)).toBe('2024-02-29');expect(defaultExpiry('2024-02-28',365)).toBe('2025-02-27');
  const manufacture=new Date(Date.parse(businessDate()+'T00:00:00Z')-10*86400000).toISOString().slice(0,10);
  const lotBody=code=>({code:prefix+'_'+code,itemId:product.id,manufacturedOn:manufacture,packagingVersionId:pack('CAN').id});
  const automatic=await warehouse.mutate('productLots','create',req(lotBody('auto')));
  expect(automatic.expiresOn).toBe(defaultExpiry(manufacture,365));
  const manual=await warehouse.mutate('productLots','create',req({...lotBody('manual'),expiresOn:defaultExpiry(businessDate(),20)}));
  product=await warehouse.mutate('products','update',req({expectedVersion:product.version,shelfLifeDays:540},product.id));
  expect((await warehouse.read('productLots',req({},automatic.id))).expiresOn).toBe(automatic.expiresOn);
  expect((await warehouse.read('productLots',req({},manual.id))).expiresOn).toBe(manual.expiresOn);
  expect((await warehouse.mutate('productLots','create',req(lotBody('new_default')))).expiresOn).toBe(defaultExpiry(manufacture,540));
  const factorId=await repo.insert(c,'HeSoChiemCho',{product_id:product.id,capacity_unit_id:units.KG,revision:1,factor_per_base:'1',effective_at:'2020-01-01 00:00:00.000'});
  const stocks={};
  for(const[code,days,received,status,bucket,reserved]of [['a',5,'2020-01-01','ACTIVE','DAT','0'],['b',5,'2020-01-02','ACTIVE','DAT','0'],['c',10,'2020-01-01','ACTIVE','DAT','0'],['expired',-1,'2020-01-01','ACTIVE','DAT','0'],['locked',1,'2020-01-01','LOCKED','DAT','0'],['quarantine',1,'2020-01-01','ACTIVE','QUARANTINE','0'],['reserved',1,'2020-01-01','ACTIVE','DAT','100']]){
   const expires=new Date(Date.parse(businessDate()+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);
   const lot=await warehouse.mutate('productLots','create',req({...lotBody(code),expiresOn:expires}));
   await repo.update(c,'LoThanhPham',{id:lot.id},{status,first_received_at:received+' 00:00:00.000'});
   const balanceId=await repo.insert(c,'TonKho',{location_id:locationId,product_lot_id:lot.id,quality_bucket:bucket,qty_on_hand:'100',qty_reserved:reserved,capacity_factor_id:factorId,capacity_factor_snapshot:'1'});
   stocks[code]={lot,balanceId};
  }
  expect((await inventoryRepo.candidates(c,warehouseId,'PRODUCT',product.id)).map(r=>r.id)).toEqual(['a','b','c'].map(key=>stocks[key].balanceId));
  await expect(warehouse.mutate('productLots','update',req({expectedVersion:0,expiresOn:defaultExpiry(businessDate(),40)},stocks.a.lot.id))).rejects.toMatchObject({code:'HISTORY_IMMUTABLE'});
  await orders.submit(req({expectedVersion:oldOrder.version},oldOrder.id));
  const allocate=key=>inventory.allocate('issues',req({kind:'SALE',warehouseId,sourceId:oldOrder.id,lines:[{sourceLineId:oldLine.id,lotKind:'PRODUCT',lotId:stocks[key].lot.id,locationId,unitId:units.CAN,quantity:'10'}]}));
  const wrong=await allocate('b');
  await expect(inventory.command('issues','confirmAllocation',req({expectedVersion:wrong.version},wrong.id))).rejects.toMatchObject({code:'FEFO_REQUIRED'});
  const correct=await allocate('a');
  const confirmed=await inventory.command('issues','confirmAllocation',req({expectedVersion:correct.version},correct.id));
  let balance=await repo.one(c,'TonKho',{id:stocks.a.balanceId});
  expect(balance.qty_on_hand).toBe('100.000000');expect(balance.qty_reserved).toBe('10.000000');
  const posted=await inventory.post('issues','postSale',req({expectedVersion:confirmed.version,expectedAllocationVersion:confirmed.allocationVersion},confirmed.id));
  expect(posted.status).toBe('HOAN_THANH');balance=await repo.one(c,'TonKho',{id:stocks.a.balanceId});
  expect(balance.qty_on_hand).toBe('90.000000');expect(balance.qty_reserved).toBe('0.000000');
  expect((await repo.one(c,'DatGiuTon',{issue_id:posted.id})).status).toBe('CONSUMED');
  expect((await repo.one(c,'LichSuBienDongTon',{balance_id:stocks.a.balanceId})).quantity_delta).toBe('-10.000000');
  expect(await repo.find(c,'LichSuBienDongTon',{balance_id:stocks.a.balanceId})).toHaveLength(1);
  throw rollback;
 },{beforeBegin:guard})).rejects.toBe(rollback);
 // Prove no fixture or business document survives rollback.
 expect(await repo.one(pool,'ThanhPham',{code:prefix})).toBeUndefined();
 expect(await repo.one(pool,'Kho',{code:prefix})).toBeUndefined();
},60000);
