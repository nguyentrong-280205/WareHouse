const repo=require('./repository'),d=require('../../shared/decimal');
const {fail,requireRow,expectState,scope,businessDate}=require('../../shared/business-context');
// All callers hold the warehouse gate before locations/sources/balances. Never creates stock outside posting.
async function gate(c,req,warehouseId){scope(req.principal,warehouseId);const row=requireRow(await repo.one(c,'Kho',{id:warehouseId},{lock:true}));expectState(row,['ACTIVE']);await require('../stocktake/lifecycle').recover(c,req,warehouseId);return row;}
async function location(c,warehouse,id){const row=requireRow(await repo.one(c,'ViTriLuuKho',{id,warehouse_id:warehouse.id},{lock:true}));expectState(row,['ACTIVE']);const lock=await repo.one(c,'KhoaViTriKiemKe',{location_id:id},{lock:true});if(lock)fail(409,'STOCKTAKE_LOCKED','Vị trí đang thuộc phiên kiểm kê; cần hoàn tất hoặc phục hồi phiên trước.');return row;}
async function unitQuantity(c,kind,lot,unitId,quantity,packagingId){
 if(kind==='MATERIAL'){
  const item=requireRow(await repo.one(c,'NguyenLieu',{id:lot.material_id}));expectState(item,['ACTIVE']);
  if(String(item.base_unit_id)!==String(unitId)||packagingId)fail(422,'UNIT_MISMATCH','Nguyên liệu dùng đơn vị cơ sở đã cấu hình.');
  const unit=requireRow(await repo.one(c,'DonViTinh',{id:unitId})),qty=d.positive(quantity);if(unit.discrete&&qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Đơn vị đếm phải nguyên.');
  return{qty:d.format(qty),factor:'1.000000000',item};
 }
 const item=requireRow(await repo.one(c,'ThanhPham',{id:lot.product_id}));expectState(item,['ACTIVE']);
 if(String(unitId)===String(item.base_unit_id)&&!packagingId)return{qty:d.convert(quantity,'1',true),factor:'1.000000000',item};
 const pack=requireRow(await repo.one(c,'QuyCachDongGoi',{id:packagingId,product_id:item.id,unit_id:unitId}));
 if(pack.effective_from>businessDate())fail(422,'PACKAGING_NOT_EFFECTIVE','Quy cách chưa hiệu lực.');
 return{qty:d.convert(quantity,pack.units_per_pack,true),factor:pack.units_per_pack,item};
}
async function release(c,row,status='RELEASED'){
 const holds=await repo.find(c,'DatGiuTon',{issue_id:row.id,status:'ACTIVE'},{lock:true});
 for(const h of holds.sort((a,b)=>BigInt(a.balance_id)<BigInt(b.balance_id)?-1:1)){
  const balance=requireRow(await repo.one(c,'TonKho',{id:h.balance_id},{lock:true})),remaining=d.parse(h.qty_initial)-d.parse(h.qty_consumed)-d.parse(h.qty_released);
  const reserved=d.parse(balance.qty_reserved)-remaining;if(reserved<0n)fail(409,'RESERVATION_INCONSISTENT','Reservation cần đối soát, không tự sửa số liệu.');
  await repo.update(c,'TonKho',{id:balance.id},{qty_reserved:d.format(reserved),version:String(BigInt(balance.version)+1n)});
  await repo.update(c,'DatGiuTon',{id:h.id},{qty_released:d.format(d.parse(h.qty_released)+remaining),status});
 }
}
async function expire(c,req,warehouseId){for(const row of await repo.expiredIssues(c,warehouseId)){
 await release(c,row,'EXPIRED');await repo.update(c,'PhieuXuatKho',{id:row.id},{status:'HET_HAN',version:row.version+1,allocation_generation:row.allocation_generation+1});
 await repo.audit(c,req.principal,'issues.expire','PhieuXuatKho',row.id,row,{status:'HET_HAN'},req.correlationId);
}}
async function balance(c,warehouse,loc,kind,lot,bucket,sourceFactor){
 await storage(c,loc,kind,lot);
 const criteria={location_id:loc.id,material_lot_id:kind==='MATERIAL'?lot.id:null,product_lot_id:kind==='MATERIAL'?null:lot.id,quality_bucket:bucket};
 let row=await repo.one(c,'TonKho',criteria,{lock:true});
 if(!row){const factor=sourceFactor?{id:sourceFactor.capacity_factor_id,factor_per_base:sourceFactor.capacity_factor_snapshot}:await repo.capacityFactor(c,warehouse.id,kind==='MATERIAL'?lot.material_id:null,kind==='MATERIAL'?null:lot.product_id);if(!factor)fail(409,'CAPACITY_FACTOR_REQUIRED','SKU chưa có hệ số sức chứa hiệu lực theo đơn vị của kho.');
  const id=await repo.insert(c,'TonKho',{...criteria,capacity_factor_id:factor.id,capacity_factor_snapshot:factor.factor_per_base});row=await repo.one(c,'TonKho',{id},{lock:true});}
 if(sourceFactor&&d.parse(sourceFactor.capacity_factor_snapshot,9)!==d.parse(row.capacity_factor_snapshot,9))fail(409,'PHYSICAL_FACTOR_MISMATCH','Hệ số của tồn đích không trùng snapshot vật lý nguồn; cần đối soát trước khi chuyển bucket.');return row;
}
async function move(c,{postingId,balance:row,delta,receiptLineId,issueLineId,returnReceptionLineId,reason}){
 const before=d.parse(row.qty_on_hand),after=before+delta;if(after<0n||after<d.parse(row.qty_reserved))fail(409,'STOCK_UNAVAILABLE','Tồn sau ghi sổ thấp hơn lượng đang giữ.');d.parse(d.format(after));
 await repo.update(c,'TonKho',{id:row.id},{qty_on_hand:d.format(after),version:String(BigInt(row.version)+1n)});
 await repo.insert(c,'LichSuBienDongTon',{posting_id:postingId,balance_id:row.id,quantity_delta:d.format(delta),qty_before:d.format(before),qty_after:d.format(after),receipt_line_id:receiptLineId,issue_line_id:issueLineId,return_reception_line_id:returnReceptionLineId,reason});
}
async function capacity(c,warehouse,locationIds){
 if(await repo.occupied(c,warehouse.id)>d.parse(warehouse.capacity)*d.ten(9))fail(409,'WAREHOUSE_CAPACITY_EXCEEDED','Không đủ sức chứa kho.');
 for(const id of [...new Set(locationIds)].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1)){const loc=requireRow(await repo.one(c,'ViTriLuuKho',{id,warehouse_id:warehouse.id}));if(await repo.occupied(c,warehouse.id,id)>d.parse(loc.capacity)*d.ten(9))fail(409,'LOCATION_CAPACITY_EXCEEDED','Không đủ sức chứa vị trí.');}
}
async function storage(c,loc,kind,lot,{placement=false}={}){if(kind!=='MATERIAL')return;const item=requireRow(await repo.one(c,'NguyenLieu',{id:lot.material_id}));if(item.storage_condition?.trim()&&item.storage_condition.trim().toUpperCase()!==loc.storage_rule?.trim().toUpperCase())fail(422,'STORAGE_CONDITION_MISMATCH','Điều kiện bảo quản của vị trí không khớp điều kiện đã khai báo cho nguyên liệu.');
 if(placement){const[[rule]]=await c.execute('SELECT CASE WHEN EXISTS(SELECT 1 FROM ViTriNguyenLieuDuocPhep p JOIN ViTriLuuKho v ON v.id=p.location_id WHERE v.warehouse_id=?) THEN 1 ELSE 0 END AS configured,CASE WHEN EXISTS(SELECT 1 FROM ViTriNguyenLieuDuocPhep WHERE location_id=? AND material_id=?) THEN 1 ELSE 0 END AS allowed',[loc.warehouse_id,loc.id,item.id]);if(rule.configured&&!rule.allowed)fail(422,'MATERIAL_LOCATION_MISMATCH','Nguyên liệu không được phép nhập vào vị trí này. Hãy chọn vị trí thuộc nhóm nguyên liệu.');}
}
module.exports={gate,location,unitQuantity,release,expire,balance,move,capacity,storage};
