const base=require('../../shared/business-repository'),d=require('../../shared/decimal');
async function warehouses(c,req){
 for(const id of [...req.principal.warehouseIds].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1)){
  const warehouse=await base.one(c,'Kho',{id},{lock:true});if(!warehouse)continue;
  await require('../stocktake/lifecycle').recover(c,req,id);await require('../inventory/stock-service').expire(c,req,id);
 }
}
async function free(c,materialId,warehouseId){
 const rows=(await c.execute("SELECT t.qty_on_hand,t.qty_reserved FROM TonKho t WITH (HOLDLOCK,ROWLOCK) JOIN LoNguyenLieu l ON l.id=t.material_lot_id JOIN ViTriLuuKho v ON v.id=t.location_id JOIN Kho k ON k.id=v.warehouse_id WHERE v.warehouse_id=? AND l.material_id=? AND t.quality_bucket='DAT' AND l.status='ACTIVE' AND v.status='ACTIVE' AND k.status='ACTIVE' AND (l.expires_on IS NULL OR l.expires_on>=CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME()))) AND NOT EXISTS(SELECT 1 AS present FROM KhoaViTriKiemKe x WHERE x.location_id=v.id) ORDER BY t.id",[warehouseId,materialId]))[0];return rows.reduce((n,r)=>n+d.parse(r.qty_on_hand)-d.parse(r.qty_reserved),0n);
}
async function usage(c,demandId,warehouseId){
 const[[issued]]=await c.execute("SELECT COALESCE(SUM(l.qty_base),0) AS n FROM ChiTietPhieuXuat l JOIN PhieuXuatKho h ON h.id=l.issue_id JOIN ChiTietYeuCauXuatNL r ON r.id=l.material_request_line_id WHERE r.demand_id=? AND h.warehouse_id=? AND h.status='HOAN_THANH' AND l.generation=h.allocation_generation",[demandId,warehouseId]);
 const[[held]]=await c.execute("SELECT COALESCE(SUM(q.qty_initial-q.qty_consumed-q.qty_released),0) AS n FROM DatGiuTon q JOIN PhieuXuatKho h ON h.id=q.issue_id WHERE q.demand_id=? AND h.warehouse_id=? AND q.status='ACTIVE' AND q.expires_at>SYSUTCDATETIME()",[demandId,warehouseId]);return d.parse(issued.n)+d.parse(held.n);
}
async function otherAssignments(c,materialId,warehouseId,excludeDemand='0',excludePlanId='0'){
 const rows=(await c.execute("SELECT f.* FROM PhanBoTonDuKien f WITH (HOLDLOCK,ROWLOCK) JOIN NhuCauNguyenLieuKHSX n ON n.id=f.demand_id JOIN ChiTietKeHoachSanXuat l ON l.id=n.plan_line_id JOIN KeHoachSanXuat h ON h.id=l.plan_id WHERE f.warehouse_id=? AND n.material_id=? AND f.demand_id<>? AND h.id<>? AND h.status IN ('CHO_DUYET','DA_DUYET','DANG_THUC_HIEN') ORDER BY f.id",[warehouseId,materialId,excludeDemand,excludePlanId]))[0];let claimed=0n;
 for(const row of rows){const remaining=d.parse(row.qty_assigned)-await usage(c,row.demand_id,warehouseId);if(remaining>0n)claimed+=remaining;}return claimed;
}
async function remaining(c,materialId,principal,excludeDemand,excludePlanId='0'){const result=[];for(const id of [...principal.warehouseIds].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1)){const available=await free(c,materialId,id),claimed=await otherAssignments(c,materialId,id,excludeDemand,excludePlanId);result.push({warehouseId:id,quantity:available>claimed?available-claimed:0n});}return result;}
async function allocate(c,demandId,materialId,quantity,principal){let unassigned=quantity,total=0n;for(const free of await remaining(c,materialId,principal,demandId)){const take=unassigned<free.quantity?unassigned:free.quantity;if(take>0n){await base.insert(c,'PhanBoTonDuKien',{demand_id:demandId,warehouse_id:free.warehouseId,qty_assigned:d.format(take)});total+=take;unassigned-=take;}if(!unassigned)break;}return total;}
async function availableForDemand(c,demandId,materialId,principal){let total=0n;for(const r of await remaining(c,materialId,principal,demandId)){const own=await base.one(c,'PhanBoTonDuKien',{demand_id:demandId,warehouse_id:r.warehouseId}),used=await usage(c,demandId,r.warehouseId),remaining=own?d.parse(own.qty_assigned)-used:0n,assigned=remaining>0n?remaining:0n;total+=assigned<r.quantity?assigned:r.quantity;}return total;}
async function refresh(c,demand,principal,required,req){let rest=required;for(const free of await remaining(c,demand.material_id,principal,demand.id)){const take=rest<free.quantity?rest:free.quantity,own=await base.one(c,'PhanBoTonDuKien',{demand_id:demand.id,warehouse_id:free.warehouseId},{lock:true}),used=await usage(c,demand.id,free.warehouseId),quantity=used+take;
 if(own){const previous=d.parse(own.qty_assigned);if(quantity!==previous){await base.update(c,'PhanBoTonDuKien',{id:own.id},{qty_assigned:d.format(quantity)});await base.audit(c,principal,'forecast.refresh','NhuCauNguyenLieuKHSX',demand.id,own,{warehouseId:free.warehouseId,quantityAssigned:d.format(quantity)},req.correlationId);}}
 else if(quantity>0n){await base.insert(c,'PhanBoTonDuKien',{demand_id:demand.id,warehouse_id:free.warehouseId,qty_assigned:d.format(quantity)});await base.audit(c,principal,'forecast.assign','NhuCauNguyenLieuKHSX',demand.id,null,{warehouseId:free.warehouseId,quantityAssigned:d.format(quantity)},req.correlationId);}
 rest-=take;
}return required-rest;}
async function planningAvailability(c,materialId,principal,excludePlanId='0'){
 const rows=await remaining(c,materialId,principal,'0',excludePlanId);
 return{availableBase:d.format(rows.reduce((total,r)=>total+r.quantity,0n)),byWarehouse:rows.map(r=>({warehouseId:r.warehouseId,availableBase:d.format(r.quantity)}))};
}
module.exports={warehouses,allocate,availableForDemand,refresh,planningAvailability};
