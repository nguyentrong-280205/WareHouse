const repo=require('./repository'),d=require('../../shared/decimal');
const{requireRow,expectState,scope,fail}=require('../../shared/business-context');
async function suggestions(c,req){
 const warehouseId=req.query.warehouseId;scope(req.principal,warehouseId);
 const warehouse=requireRow(await repo.one(c,'Kho',{id:warehouseId}));expectState(warehouse,['ACTIVE']);
 if(!['MATERIAL','CONTROLLED'].includes(warehouse.type))fail(422,'WAREHOUSE_TYPE','Chọn kho nguyên liệu phù hợp.');
 const request=requireRow(await repo.one(c,'PhieuXuatKhoNguyenLieu',{id:req.params.id}));expectState(request,['DA_GUI','DANG_CAP']);
 const assignments=await require('../production/assignment-repository').assignments(c,request.id);
 if(assignments.some(a=>String(a.warehouse_id)!==String(warehouseId)))fail(403,'SCOPE_FORBIDDEN','Phiếu đã phân công tại kho khác.');
 const line=requireRow(await repo.one(c,'ChiTietKeHoachSanXuat',{id:request.plan_line_id})),plan=requireRow(await repo.one(c,'KeHoachSanXuat',{id:line.plan_id}));
 if(!await require('../production/material-release-gate').canRequestMaterials(c,plan,req.principal))fail(409,'MATERIAL_PURCHASE_APPROVAL_REQUIRED','Kế hoạch chưa đủ điều kiện cấp nguyên liệu.');
 const stockByMaterial=new Map(),balances=[],lines=[],shortages=[];
 for(const source of await repo.find(c,'ChiTietYeuCauXuatNL',{request_id:request.id})){
  const material=requireRow(await repo.one(c,'NguyenLieu',{id:source.material_id})),unit=requireRow(await repo.one(c,'DonViTinh',{id:source.unit_id}));
  if(!stockByMaterial.has(String(material.id))){
   const available=[];
   for(const stock of await repo.candidates(c,warehouseId,'MATERIAL',material.id)){
    const lot=requireRow(await repo.one(c,'LoNguyenLieu',{id:stock.material_lot_id})),qty=d.parse(stock.qty_on_hand)-d.parse(stock.qty_reserved);
    if(qty<=0n)continue;
    available.push({stock,remaining:qty,lot});
    balances.push({id:String(stock.id),warehouseId:String(warehouseId),locationId:String(stock.location_id),lotKind:'MATERIAL',qualityBucket:'DAT',lotId:String(lot.id),itemId:String(material.id),itemCode:material.code,itemName:material.name,lotCode:lot.code,unitId:String(unit.id),available:d.format(qty),expiresOn:lot.expires_on});
   }
   stockByMaterial.set(String(material.id),available);
  }
  const used=d.parse(await repo.issueUsed(c,'material_request_line_id',source.id,'0')),quantity=d.parse(source.qty_base),remaining=quantity>used?quantity-used:0n;let outstanding=remaining;
  for(const candidate of stockByMaterial.get(String(material.id))){
   const take=outstanding<candidate.remaining?outstanding:candidate.remaining;if(take<=0n)continue;
   lines.push({sourceLineId:String(source.id),lotKind:'MATERIAL',balanceId:String(candidate.stock.id),lotId:String(candidate.lot.id),locationId:String(candidate.stock.location_id),unitId:String(source.unit_id),quantity:d.format(take)});
   candidate.remaining-=take;outstanding-=take;if(!outstanding)break;
  }
  if(outstanding>0n)shortages.push({sourceLineId:String(source.id),materialCode:material.code,materialName:material.name,unitName:unit.name,remainingBase:d.format(outstanding),hasPartial:outstanding<remaining});
 }
 return{data:{requestId:String(request.id),warehouseId:String(warehouseId),lines,balances,shortages}};
}
module.exports={suggestions};
