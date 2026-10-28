const {randomUUID}=require('node:crypto'),repo=require('./repository'),stock=require('./stock-service'),d=require('../../shared/decimal');
const{fail,requireRow,expectState,now}=require('../../shared/business-context');
// Caller owns one SQL transaction; every quantity comes from a reviewed snapshot.
async function transferWithin(c,{warehouseId,sourceLocationId,accountId,expected,correlationId=randomUUID()}){
 const actor=requireRow(await repo.lockActor(c,accountId));if(actor.status!=='ACTIVE'||actor.role_status!=='ACTIVE'||actor.customer_id!==null)fail(403,'TRANSFER_ACTOR','Tài khoản không khả dụng.');
 const permissions=await repo.rolePermissions(c,actor.role_id),scopes=await require('../auth/scope-repository').loadScopes(c,accountId);
 if(!permissions.includes('warehouses.write')||!scopes.warehouseIds.includes(String(warehouseId)))fail(403,'TRANSFER_SCOPE','Không được chuyển trong kho này.');
 await c.execute("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=?,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'LOCATION_TRANSFER_LOCK',1;",['warehouse:location-transfer:'+warehouseId]);
 const warehouse=requireRow(await repo.one(c,'Kho',{id:warehouseId},{lock:true}));expectState(warehouse,['ACTIVE']);if(warehouse.type!=='MATERIAL')fail(422,'TRANSFER_WAREHOUSE','Chỉ chuyển tồn nguyên liệu.');
 const source=requireRow(await repo.one(c,'ViTriLuuKho',{id:sourceLocationId,warehouse_id:warehouseId},{lock:true}));expectState(source,['ACTIVE']);
 if(!Array.isArray(expected)||!expected.length)fail(422,'TRANSFER_EMPTY','Không có dòng cần chuyển.');
 const orderedTargets=[...new Set(expected.map(e=>String(e.targetLocationId)))].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1),targets=new Map();
 for(const id of orderedTargets){if(id===String(source.id))fail(422,'TRANSFER_SAME_LOCATION','Vị trí nguồn và đích phải khác nhau.');const loc=requireRow(await repo.one(c,'ViTriLuuKho',{id,warehouse_id:warehouse.id},{lock:true}));expectState(loc,['ACTIVE']);targets.set(id,loc);}
 for(const id of [String(source.id),...orderedTargets].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1))if(await repo.one(c,'KhoaViTriKiemKe',{location_id:id},{lock:true}))fail(409,'STOCKTAKE_LOCKED','Vị trí đang bị khóa kiểm kê.');
 const[[openIssue]]=await c.execute("SELECT COUNT(*) AS n FROM ChiTietPhieuXuat l JOIN PhieuXuatKho h ON h.id=l.issue_id WHERE l.location_id=? AND l.generation=h.allocation_generation AND h.status IN ('NHAP','DA_PHAN_BO','DA_XAC_NHAN')",[source.id]);
 const[[openReceipt]]=await c.execute("SELECT COUNT(*) AS n FROM ChiTietPhieuNhap l JOIN PhieuNhapKho h ON h.id=l.receipt_id WHERE l.location_id=? AND l.generation=h.allocation_generation AND h.status IN ('NHAP','DA_PHAN_BO','DA_XAC_NHAN')",[source.id]);
 if(Number(openIssue.n)||Number(openReceipt.n))fail(409,'TRANSFER_DOCUMENT_IN_PROGRESS','Vị trí có phiếu kho đang xử lý.');
 const balances=(await repo.find(c,'TonKho',{location_id:source.id},{lock:true})).filter(b=>d.parse(b.qty_on_hand)>0n);
 if(balances.length!==expected.length||new Set(expected.map(e=>String(e.balanceId))).size!==expected.length)fail(409,'TRANSFER_SNAPSHOT_CHANGED','Danh sách tồn đã thay đổi, cần lập lại phương án.');
 const work=[];
 for(const balance of balances){
  const item=expected.find(e=>String(e.balanceId)===String(balance.id));if(!item||String(balance.material_lot_id)!==String(item.lotId)||balance.product_lot_id!==null||balance.quality_bucket!=='DAT'||d.parse(balance.qty_on_hand)!==d.positive(item.quantity)||d.parse(balance.qty_reserved)!==0n)fail(409,'TRANSFER_SNAPSHOT_CHANGED','Tồn hoặc giữ hàng đã thay đổi.');
  const[[holds]]=await c.execute("SELECT COUNT(*) AS n FROM DatGiuTon WHERE balance_id=? AND status='ACTIVE'",[balance.id]);if(Number(holds.n))fail(409,'TRANSFER_RESERVATION','Có reservation đang hoạt động.');
  const lot=requireRow(await repo.one(c,'LoNguyenLieu',{id:balance.material_lot_id},{lock:true}));expectState(lot,['ACTIVE']);const material=requireRow(await repo.one(c,'NguyenLieu',{id:lot.material_id}));expectState(material,['ACTIVE']);
  if(String(material.id)!==String(item.materialId))fail(409,'TRANSFER_SOURCE_CHANGED','Nguyên liệu của lô đã thay đổi.');
  const target=targets.get(String(item.targetLocationId));await stock.storage(c,target,'MATERIAL',lot,{placement:true});
  work.push({balance,lot,material,target,quantity:d.positive(item.quantity)});
 }
 const beforeWarehouse=await repo.occupied(c,warehouse.id);
 const transferId=await repo.insert(c,'PhieuChuyenViTri',{code:'CVT-'+randomUUID(),warehouse_id:warehouse.id,source_location_id:source.id,created_by_id:accountId,status:'HOAN_THANH'});
 const postingId=await repo.insert(c,'StockPosting',{transfer_id:transferId,created_by_id:accountId});
 const moved=[];
 for(const w of work){
  const destination=await stock.balance(c,warehouse,w.target,'MATERIAL',w.lot,'DAT',w.balance);
  const destinationBefore=requireRow(await repo.one(c,'TonKho',{id:destination.id},{lock:true}));
  await repo.insert(c,'ChiTietChuyenViTri',{transfer_id:transferId,source_balance_id:w.balance.id,destination_balance_id:destination.id,material_lot_id:w.lot.id,unit_id:w.material.base_unit_id,qty_base:d.format(w.quantity),capacity_factor_snapshot:w.balance.capacity_factor_snapshot});
  await stock.move(c,{postingId,balance:w.balance,delta:-w.quantity,reason:'Chuyển nguyên liệu sang vị trí '+w.target.code});
  await stock.move(c,{postingId,balance:destinationBefore,delta:w.quantity,reason:'Nhận nguyên liệu chuyển từ vị trí '+source.code});
  moved.push({sourceBalanceId:String(w.balance.id),destinationBalanceId:String(destination.id),lotId:String(w.lot.id),materialId:String(w.material.id),targetCode:w.target.code,quantityBase:d.format(w.quantity)});
 }
 await stock.capacity(c,warehouse,orderedTargets);
 if(await repo.occupied(c,warehouse.id)!==beforeWarehouse)fail(409,'TRANSFER_NOT_CONSERVED','Sức chứa toàn kho trước và sau không khớp.');
 const remaining=await repo.find(c,'TonKho',{location_id:source.id},{lock:true});if(remaining.some(b=>d.parse(b.qty_on_hand)!==0n||d.parse(b.qty_reserved)!==0n))fail(409,'TRANSFER_SOURCE_NOT_EMPTY','Vị trí cũ chưa hết tồn hoặc còn giữ hàng.');
 await repo.update(c,'ViTriLuuKho',{id:source.id},{status:'LOCKED',version:Number(source.version)+1,updated_at:now()});
 await repo.audit(c,{accountId:String(accountId)},'materialLocations.legacy.transferred','PhieuChuyenViTri',transferId,{sourceLocationId:String(source.id),warehouseOccupied:d.format(beforeWarehouse,15)},{transferId,postingId,sourceStatus:'LOCKED',lines:moved},correlationId);
 return{transferId,postingId,sourceLocationId:String(source.id),lines:moved};
}
module.exports={transferWithin};
