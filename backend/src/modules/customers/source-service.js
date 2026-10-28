const repo=require('./source-repository'),qc=require('../qc/repository'),d=require('../../shared/decimal');
function createSourceLookupService(context){
 async function lookup(kind,req){return context.read(async c=>{
  const actor=req.principal.accountId,data=[];
  if(kind==='material-deliveries'){for(const row of await repo.materialDeliveries(c,actor))data.push({id:String(row.id),code:row.code,status:row.status,warehouseId:String(row.warehouse_id),purchaseId:String(row.purchase_id),lines:(await repo.find(c,'ChiTietGiaoNL',{delivery_id:row.id})).map(l=>({id:String(l.id),lotId:String(l.material_lot_id),quantityBase:l.qty_received,purchaseLineId:String(l.purchase_line_id)}))});}
  else if(kind==='approved-plans'){
   if(req.principal.customerId)require('../../shared/business-context').fail(403,'FORBIDDEN','Chỉ tài khoản nội bộ có quyền mua hàng được nhận yêu cầu.');
   for(const row of await require('../production/repository').queueCandidates(c,req.principal,'PURCHASING')){
    const source=await require('../purchasing/request-source').requestSource(c,row,req.principal);
    if(source.materialShortages.length)data.push({id:source.id,code:source.code,demands:source.lines[0].materialDemands});
   }
  }
  else if(kind==='warehouses'){for(const id of req.principal.warehouseIds){const r=await repo.one(c,'Kho',{id,status:'ACTIVE'});if(!r)continue;const unit=await repo.one(c,'DonViTinh',{id:r.capacity_unit_id});data.push({id:String(r.id),code:r.code,name:r.name,type:r.type,capacity:r.capacity,occupiedCapacity:d.format(await require('../warehouse/repository').occupancy(c,id),15),capacityUnitId:String(r.capacity_unit_id),capacityUnitCode:unit.code,locations:(await repo.find(c,'ViTriLuuKho',{warehouse_id:id,status:'ACTIVE'})).map(l=>({id:String(l.id),code:l.code,name:l.name}))});}}
  else if(kind==='product-lots'){const products=await require('./repository').catalog(c,'products');for(const p of products)for(const l of await repo.find(c,'LoThanhPham',{product_id:p.id,status:'ACTIVE'}))data.push({id:String(l.id),code:l.code,productId:String(p.id),unitId:String(p.base_unit_id),packagingVersionId:String(l.packaging_version_id),expiresOn:l.expires_on});}
  else if(kind==='count-lots'||kind==='material-lots'){for(const [table,lotTable,lotKind,itemKey]of [['NguyenLieu','LoNguyenLieu','MATERIAL','material_id'],...(kind==='count-lots'?[['ThanhPham','LoThanhPham','PRODUCT','product_id']]:[])])for(const item of await repo.find(c,table,{}))for(const lot of await repo.find(c,lotTable,{[itemKey]:item.id}))data.push({id:String(lot.id),code:lot.code+' / '+item.code,lotKind,itemId:String(item.id),unitId:String(item.base_unit_id),packagingVersionId:lot.packaging_version_id?String(lot.packaging_version_id):undefined});}
  else if(kind==='alert-items'){for(const [table,itemKind]of [['NguyenLieu','MATERIAL'],['ThanhPham','PRODUCT']])for(const r of await repo.find(c,table,{status:'ACTIVE'}))data.push({id:String(r.id),code:r.code,name:r.name,itemKind,unitId:String(r.base_unit_id)});}
  else if(kind==='approved-purchases'){for(const r of await repo.approved(c,'purchases',actor))data.push({id:String(r.id),code:r.code,lines:(await repo.find(c,'ChiTietDonMuaNguyenLieu',{purchase_id:r.id})).map(l=>({id:String(l.id),materialId:String(l.material_id),quantityBase:l.qty_base,unitId:String(l.unit_id)}))});}
  else if(kind==='count-members'){for(const row of await repo.counters(c,actor))data.push({id:String(row.id),name:row.username,warehouseId:String(row.warehouse_id)});}
  else if(kind==='rework-batches'){for(const row of await repo.reworks(c,actor)){const type={MATERIAL:'materialQc',PRODUCT:'productQc',RETURN:'returnQc'}[row.source_qc_type],inspected=await qc.inspected(c,type,row.id,true);data.push({id:String(row.id),code:'Tái xử lý '+row.id,sourceQcType:row.source_qc_type,warehouseId:String(row.warehouse_id),locationId:String(row.location_id),lotId:String(row.material_lot_id||row.product_lot_id),quantityProcessedBase:row.qty_processed,remainingBase:d.format(d.parse(row.qty_processed)-d.parse(inspected)),status:row.status});}}
  else if(kind==='qc-sources'){
   const allowed=req.principal.permissions;
   if(allowed.includes('materialQc.write'))for(const r of await repo.materialDeliveries(c,actor)){const lines=[];for(const l of await repo.find(c,'ChiTietGiaoNL',{delivery_id:r.id}))lines.push({id:String(l.id),lotId:String(l.material_lot_id),quantityBase:l.qty_received,remainingBase:d.format(d.parse(l.qty_received)-d.parse(await qc.inspected(c,'materialQc',l.id)))});data.push({id:String(r.id),kind:'MATERIAL',code:r.code,warehouseId:String(r.warehouse_id),lines});}
   if(allowed.includes('productQc.write'))for(const r of await repo.productRequests(c,actor)){const lines=[];for(const l of await repo.find(c,'ChiTietYeuCauNhapTP',{request_id:r.id}))lines.push({id:String(l.id),lotId:String(l.product_lot_id),quantityBase:l.qty_completed,remainingBase:d.format(d.parse(l.qty_completed)-d.parse(await qc.inspected(c,'productQc',l.id)))});data.push({id:String(r.id),kind:'PRODUCT',code:r.code,lines});}
   if(allowed.includes('returnQc.write'))for(const r of await repo.returnReceptions(c,actor)){const lines=[];for(const l of await repo.find(c,'ChiTietTiepNhanTra',{reception_id:r.id}))lines.push({id:String(l.id),lotId:String(l.product_lot_id),quantityBase:l.qty_base,remainingBase:d.format(d.parse(l.qty_base)-d.parse(await qc.inspected(c,'returnQc',l.id)))});data.push({id:String(r.id),kind:'RETURN',code:'Tiếp nhận trả '+r.id,warehouseId:String(r.warehouse_id),lines});}
  }else if(kind==='allocation-sources'){
   if(req.principal.permissions.includes('receipts.allocate')||req.principal.permissions.includes('dispositions.create'))for(const type of ['materialQc','productQc','returnQc'])for(const r of await repo.qcLines(c,actor,type)){const material=type==='materialQc',lot=await repo.one(c,material?'LoNguyenLieu':'LoThanhPham',{id:r.material_lot_id||r.product_lot_id}),item=await repo.one(c,material?'NguyenLieu':'ThanhPham',{id:lot.material_id||lot.product_id});data.push({id:String(r.id),code:'QC '+r.id+' / lô '+lot.code,family:'RECEIPT',kind:{materialQc:'MATERIAL',productQc:'FINISHED',returnQc:'RETURN'}[type],sourceQcType:{materialQc:'MATERIAL',productQc:'PRODUCT',returnQc:'RETURN'}[type],lotKind:material?'MATERIAL':'PRODUCT',lotId:String(r.material_lot_id||r.product_lot_id),itemId:String(item.id),unitId:String(item.base_unit_id),acceptedBase:r.qty_accepted,rejectedBase:r.qty_rejected,reworkBatchId:r.rework_batch_id?String(r.rework_batch_id):undefined});}
   if(req.principal.permissions.includes('issues.allocate')){
    for(const r of await require('./repository').orders(c))data.push({id:String(r.id),code:r.code,family:'ISSUE',kind:'SALE',lines:r.lines.map(l=>({id:String(l.id),productId:String(l.product_id),quantityBase:l.qty_base}))});
    for(const r of await repo.materialIssues(c,actor))data.push({id:String(r.id),code:r.code,family:'ISSUE',kind:'MATERIAL',lines:(await repo.find(c,'ChiTietYeuCauXuatNL',{request_id:r.id})).map(l=>({id:String(l.id),materialId:String(l.material_id),demandId:String(l.demand_id),quantityBase:l.qty_base}))});
   }
  }
  if(kind==='warehouses')for(const warehouse of data){
   const[rules]=await c.execute('SELECT p.location_id,p.material_id FROM ViTriNguyenLieuDuocPhep p JOIN ViTriLuuKho v ON v.id=p.location_id WHERE v.warehouse_id=?',[warehouse.id]);
   warehouse.materialLocationRulesEnabled=rules.length>0;
   for(const location of warehouse.locations)location.allowedMaterialIds=rules.filter(r=>String(r.location_id)===location.id).map(r=>String(r.material_id));
  }
  return{data};
 });}
 return{lookup};
}
module.exports={createSourceLookupService};
