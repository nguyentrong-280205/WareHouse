const {randomUUID}=require('node:crypto');
const repo=require('./repository'),stock=require('./stock-service'),d=require('../../shared/decimal'),policy=require('../../shared/business-policy');
const qc=require('../qc/repository').definitions;
const {fail,requireRow,expectVersion,expectState,scope,businessDate,now}=require('../../shared/business-context');
const docs={receipts:{header:'PhieuNhapKho',line:'ChiTietPhieuNhap',fk:'receipt_id'},issues:{header:'PhieuXuatKho',line:'ChiTietPhieuXuat',fk:'issue_id'}};
const receiptKinds={MATERIAL:{kind:'materialQc',field:'material_qc_line_id'},FINISHED:{kind:'productQc',field:'product_qc_line_id'},RETURN:{kind:'returnQc',field:'return_qc_line_id'}};
function receiptConfig(row){if(row.kind!=='REJECTED')return receiptKinds[row.kind];return receiptKinds[({MATERIAL:'MATERIAL',PRODUCT:'FINISHED',RETURN:'RETURN'})[row.source_qc_type]];}
function createInventoryService(context){
 function allowedKinds(family,req){const p=req.principal.permissions;if(p.includes(family+'.read')||p.includes(family+'.allocate')||p.includes(family+'.confirmAllocation'))return family==='receipts'?['MATERIAL','FINISHED','RETURN','REJECTED']:['MATERIAL','SALE'];return Object.entries(family==='receipts'?{MATERIAL:'receipts.postMaterial',FINISHED:'receipts.postProduct',RETURN:'receipts.postReturn',REJECTED:'dispositions.execute'}:{MATERIAL:'issues.postMaterial',SALE:'issues.postSale'}).filter(([,permission])=>p.includes(permission)).map(([kind])=>kind);}
 async function lines(c,family,row){return repo.find(c,docs[family].line,{[docs[family].fk]:row.id,generation:row.allocation_generation});}
 async function result(c,family,row,req){scope(req.principal,row.warehouse_id);if(!allowedKinds(family,req).includes(row.kind))fail(403,'DOCUMENT_KIND_FORBIDDEN','Không có quyền đọc loại chứng từ này.');return{id:String(row.id),code:row.code,kind:row.kind,sourceQcType:row.source_qc_type,warehouseId:String(row.warehouse_id),warehouseName:(await repo.one(c,'Kho',{id:row.warehouse_id}))?.name,status:row.status,version:row.version,allocationVersion:row.allocation_generation,coordinatorId:String(row.created_by_id),postedAt:row.posted_at?String(row.posted_at).replace(' ','T')+'Z':null,onHandChanged:row.status==='HOAN_THANH',capacitySnapshot:row.capacity_snapshot,expiresAt:row.expires_at?String(row.expires_at).replace(' ','T')+'Z':null,sourceId:row.order_id?String(row.order_id):row.material_request_id?String(row.material_request_id):undefined,
  lines:(await require('../../shared/reference-names').describeRows(c,(await lines(c,family,row)).map(l=>({id:String(l.id),sourceLineId:l.order_line_id?String(l.order_line_id):l.material_request_line_id?String(l.material_request_line_id):undefined,qcLineId:l.material_qc_line_id?String(l.material_qc_line_id):l.product_qc_line_id?String(l.product_qc_line_id):l.return_qc_line_id?String(l.return_qc_line_id):undefined,lotKind:l.material_lot_id?'MATERIAL':'PRODUCT',lotId:String(l.material_lot_id||l.product_lot_id),locationId:String(l.location_id),unitId:String(l.unit_id),packagingVersionId:l.packaging_version_id?String(l.packaging_version_id):undefined,quantity:l.qty_input,quantityBase:l.qty_base,qualityBucket:row.kind==='REJECTED'?'FAILED':'DAT'})))).map(l=>({...l,sourceLineName:l.itemName}))};}
 async function list(family,req){return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.page(c,docs[family].header,req.principal,{...req.query,page,pageSize,allowedKinds:allowedKinds(family,req)});return{data:await Promise.all(rows.map(r=>result(c,family,r,req))),meta:{page,pageSize,total}};});}
 async function read(family,req){return context.read(async c=>{const row=requireRow(await repo.one(c,docs[family].header,{id:req.params.id}));if(family==='issues'&&row.kind==='MATERIAL'&&!req.principal.permissions.includes('issues.allocate')&&!req.principal.permissions.includes('issues.confirmAllocation'))await require('../production/assignment-repository').assertAssignment(c,row.material_request_id,row.warehouse_id,req.principal.accountId);return result(c,family,row,req);});}
 async function lot(c,l,expectedKind,allowExpired=false){if(l.lotKind!==expectedKind)fail(422,'LOT_KIND_MISMATCH','Loại lô không khớp nghiệp vụ.');const row=requireRow(await repo.one(c,expectedKind==='MATERIAL'?'LoNguyenLieu':'LoThanhPham',{id:l.lotId},{lock:true}));expectState(row,allowExpired?['ACTIVE','LOCKED']:['ACTIVE']);if(!allowExpired&&row.expires_on&&row.expires_on<businessDate())fail(409,'LOT_EXPIRED','Lô đã hết hạn theo ngày Việt Nam.');return row;}
 async function sourceIssue(c,row){const sale=row.kind==='SALE',source=requireRow(await repo.one(c,sale?'DonHang':'PhieuXuatKhoNguyenLieu',{id:sale?row.order_id:row.material_request_id},{lock:true}));expectState(source,sale?['XAC_NHAN','DANG_GIAO']:['DA_GUI','DANG_CAP']);if(!sale){const pl=requireRow(await repo.one(c,'ChiTietKeHoachSanXuat',{id:source.plan_line_id}));expectState(requireRow(await repo.one(c,'KeHoachSanXuat',{id:pl.plan_id},{lock:true})),['DA_DUYET','DANG_THUC_HIEN']);}return source;}
 async function sourceReceipt(c,row,line,req){
  const config=receiptConfig(row);if(!config)fail(422,'QC_TYPE_REQUIRED','Hàng lỗi cần xác định loại QC nguồn.');const t=qc[config.kind],initial=requireRow(await repo.one(c,t.line,{id:line[config.field]})),initialHeader=requireRow(await repo.one(c,t.header,{id:initial.qc_id}));
  const origin=requireRow(await require('../qc/repository').origin(c,config.kind,initialHeader,{lock:true}));
  const header=requireRow(await repo.one(c,t.header,{id:initial.qc_id},{lock:true}));expectState(header,['DA_XAC_NHAN']);
  const q=requireRow(await repo.one(c,t.line,{id:initial.id},{lock:true}));
  if(origin.warehouse_id)scope(req.principal,origin.warehouse_id);
  if((origin._rework||config.kind==='returnQc'||row.kind!=='REJECTED'&&t.scope==='warehouse')&&String(origin.warehouse_id)!==String(row.warehouse_id))fail(422,'SOURCE_WAREHOUSE_MISMATCH','Kho phải trùng nơi tiếp nhận vật lý của nguồn.');
  if(String(q[t.lot])!==String(line[t.lot]))fail(422,'QC_LOT_MISMATCH','Lô không trùng kết quả QC.');
  return{config,t,q,origin};
 }
 async function validateQuota(c,family,row,ls,req){
  const sums=new Map();
  if(family==='issues')await sourceIssue(c,row);
  for(const l of [...ls].sort((a,b)=>BigInt(a.id)<BigInt(b.id)?-1:1)){
   if(family==='receipts'){
    const{config,q}=await sourceReceipt(c,row,l,req),key=String(q.id),sum=(sums.get(key)||0n)+d.parse(l.qty_base);sums.set(key,sum);
    if(sum+d.parse(await repo.receiptUsed(c,config.field,q.id,row.id,row.kind==='REJECTED'))>d.parse(row.kind==='REJECTED'?q.qty_rejected:q.qty_accepted))fail(409,'QC_RECEIPT_QUOTA','Lượng nhập/đang phân bổ vượt phần lượng QC tương ứng.');
   }else{
    const sale=row.kind==='SALE',field=sale?'order_line_id':'material_request_line_id',source=requireRow(await repo.one(c,sale?'ChiTietDonHang':'ChiTietYeuCauXuatNL',{id:l[field],[sale?'order_id':'request_id']:sale?row.order_id:row.material_request_id},{lock:true}));
    const key=String(source.id),sum=(sums.get(key)||0n)+d.parse(l.qty_base);sums.set(key,sum);
    const sourceLot=requireRow(await repo.one(c,sale?'LoThanhPham':'LoNguyenLieu',{id:sale?l.product_lot_id:l.material_lot_id}));
    if(String(source[sale?'product_id':'material_id'])!==String(sourceLot[sale?'product_id':'material_id']))fail(422,'SOURCE_ITEM_MISMATCH','SKU không trùng dòng nguồn.');
    if(!sale&&String(l.unit_id)!==String(source.unit_id))fail(422,'MATERIAL_BASE_UNIT_REQUIRED','Đơn vị xuất phải trùng đơn vị cơ sở của nguyên liệu trên yêu cầu.');
    if(sum+d.parse(await repo.issueUsed(c,field,source.id,row.id))>d.parse(source.qty_base))fail(409,'ISSUE_SOURCE_QUOTA','Lượng xuất/giữ vượt lượng nguồn còn lại.');
   }
  }
 }
 async function fefo(c,row,ls){
  const groups=new Map();
  for(const l of ls){const kind=l.material_lot_id?'MATERIAL':'PRODUCT',lotRow=requireRow(await repo.one(c,kind==='MATERIAL'?'LoNguyenLieu':'LoThanhPham',{id:l.material_lot_id||l.product_lot_id})),itemId=lotRow.material_id||lotRow.product_id,key=kind+':'+itemId;
   if(!groups.has(key))groups.set(key,{kind,itemId,desired:new Map(),total:0n});const g=groups.get(key),balance=requireRow(await repo.one(c,'TonKho',{location_id:l.location_id,material_lot_id:l.material_lot_id,product_lot_id:l.product_lot_id,quality_bucket:'DAT'},{lock:true}));
   g.desired.set(String(balance.id),(g.desired.get(String(balance.id))||0n)+d.parse(l.qty_base));g.total+=d.parse(l.qty_base);
  }
  for(const g of groups.values()){
   let remaining=g.total;const expected=new Map();
   for(const candidate of await repo.candidates(c,row.warehouse_id,g.kind,g.itemId)){const available=d.parse(candidate.qty_on_hand)-d.parse(candidate.qty_reserved),take=remaining<available?remaining:available;if(take>0n)expected.set(String(candidate.id),take);remaining-=take;if(!remaining)break;}
   if(remaining)fail(409,'STOCK_UNAVAILABLE','Không đủ tồn khả dụng đạt QC, còn hạn và ngoài phạm vi kiểm kê.');
   if(expected.size!==g.desired.size||[...expected].some(([id,qty])=>g.desired.get(id)!==qty))fail(409,'FEFO_REQUIRED','Phân bổ phải tuân thủ FEFO/FIFO theo lô và vị trí.');
  }
 }
 async function previewCapacity(c,warehouse,row,ls,req){
  const changes=new Map();const add=(id,n)=>changes.set(String(id),(changes.get(String(id))||0n)+n);
  for(const l of ls){const src=await sourceReceipt(c,row,l,req),kind=l.material_lot_id?'MATERIAL':'PRODUCT',lotRow=requireRow(await repo.one(c,kind==='MATERIAL'?'LoNguyenLieu':'LoThanhPham',{id:l.material_lot_id||l.product_lot_id}));let physical;
   if(src.origin._rework||src.config.kind==='returnQc'){
    const originLine=src.origin._rework?src.origin:requireRow(await repo.one(c,'ChiTietTiepNhanTra',{id:src.q.source_line_id}));await stock.location(c,warehouse,originLine.location_id);
    physical=requireRow(await repo.one(c,'TonKho',{location_id:originLine.location_id,material_lot_id:l.material_lot_id,product_lot_id:l.product_lot_id,quality_bucket:'QUARANTINE'},{lock:true}));add(originLine.location_id,-d.parse(l.qty_base)*d.parse(physical.capacity_factor_snapshot,9));
   }
   const existing=await repo.one(c,'TonKho',{location_id:l.location_id,material_lot_id:l.material_lot_id,product_lot_id:l.product_lot_id,quality_bucket:row.kind==='REJECTED'?'FAILED':'DAT'},{lock:true});
   const configured=existing||physical?null:await repo.capacityFactor(c,warehouse.id,lotRow.material_id,lotRow.product_id),factor=existing?.capacity_factor_snapshot||physical?.capacity_factor_snapshot||configured?.factor_per_base;
   if(!factor)fail(409,'CAPACITY_FACTOR_REQUIRED','Cần hệ số sức chứa hiệu lực trước xác nhận.');if(physical&&d.parse(factor,9)!==d.parse(physical.capacity_factor_snapshot,9))fail(409,'PHYSICAL_FACTOR_MISMATCH','Hệ số tồn đích không trùng snapshot nguồn.');add(l.location_id,d.parse(l.qty_base)*d.parse(factor,9));
  }
  const before=await repo.occupied(c,warehouse.id),delta=[...changes.values()].reduce((a,b)=>a+b,0n),after=before+delta;if(after>d.parse(warehouse.capacity)*d.ten(9))fail(409,'WAREHOUSE_CAPACITY_EXCEEDED','Snapshot xác nhận: sức chứa kho không đủ.');
  const locations=[];for(const[id,delta]of changes){const loc=requireRow(await repo.one(c,'ViTriLuuKho',{id,warehouse_id:warehouse.id})),occupied=await repo.occupied(c,warehouse.id,id),projected=occupied+delta;if(projected<0n||projected>d.parse(loc.capacity)*d.ten(9))fail(409,'LOCATION_CAPACITY_EXCEEDED','Snapshot xác nhận: sức chứa vị trí không đủ hoặc nguồn vật lý chưa đầy đủ.');locations.push({locationId:id,occupied:d.format(occupied,15),projected:d.format(projected,15)});}
  return{at:now(),capacityReservation:false,warehouseOccupied:d.format(before,15),warehouseProjected:d.format(after,15),locations};
 }
 async function allocate(family,req,update=false){return context.write(req,family+(update?'.updateAllocation':'.allocate'),async c=>{
  const config=docs[family],b=req.body,warehouse=await stock.gate(c,req,b.warehouseId);await stock.expire(c,req,warehouse.id);
  let before,id=req.params.id,generation=1;
  if(update){before=requireRow(await repo.one(c,config.header,{id},{lock:true}));scope(req.principal,before.warehouse_id);expectVersion(before,b.expectedVersion);expectState(before,['NHAP','DA_PHAN_BO']);if(String(before.warehouse_id)!==String(warehouse.id)||before.kind!==b.kind)fail(422,'ALLOCATION_IDENTITY','Đổi kho/loại phải hủy phiếu và tạo phiếu mới.');generation=before.allocation_generation+1;}
  if(family==='receipts'){
   const type=b.kind==='MATERIAL'?'MATERIAL':b.kind==='FINISHED'?'FINISHED':'CONTROLLED';if(warehouse.type!==type&&warehouse.type!=='CONTROLLED')fail(422,'WAREHOUSE_TYPE','Loại kho không phù hợp phiếu nhập.');
  }else if(b.fefoExceptionApprovalId)fail(422,'FEFO_EXCEPTION_DISABLED','FS06 không cho ngoại lệ FEFO.');
  const values={kind:b.kind,warehouse_id:warehouse.id,allocation_generation:generation,status:'DA_PHAN_BO',...(family==='issues'?{order_id:b.kind==='SALE'?b.sourceId:null,material_request_id:b.kind==='MATERIAL'?b.sourceId:null}:{source_qc_type:b.kind==='REJECTED'?b.sourceQcType:null})};
  if(family==='issues'&&b.kind==='MATERIAL'&&!update&&b.assignment){
   await require('../production/assignment-service').createAssignmentService(context).assignWithin(c,{...req,params:{id:b.sourceId},body:{expectedVersion:b.assignment.expectedVersion,warehouseId:b.warehouseId,staffIds:b.assignment.staffIds}});
  }
  if(update){if(family==='issues'&&String(before.order_id||before.material_request_id)!==b.sourceId)fail(422,'ALLOCATION_SOURCE','Không đổi nguồn của phiếu hiện có.');await repo.update(c,config.header,{id},{...values,version:before.version+1});}
  else id=await repo.insert(c,config.header,{...values,code:(family==='receipts'?'PN-':'PX-')+randomUUID(),created_by_id:req.principal.accountId});
  const row=requireRow(await repo.one(c,config.header,{id}));
  if(family==='issues'&&row.kind==='MATERIAL')await require('../production/assignment-repository').assertAssignment(c,row.material_request_id,row.warehouse_id);
  // Lock every selected location in numeric order under the warehouse gate.
  for(const locationId of [...new Set(b.lines.map(l=>l.locationId))].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1))await stock.location(c,warehouse,locationId);
  for(const l of b.lines){const expected=(b.kind==='MATERIAL'||b.kind==='REJECTED'&&b.sourceQcType==='MATERIAL')?'MATERIAL':'PRODUCT',lotRow=await lot(c,l,expected,b.kind==='REJECTED'),converted=await stock.unitQuantity(c,expected,lotRow,l.unitId,l.quantity,l.packagingVersionId);
   await stock.storage(c,requireRow(await repo.one(c,'ViTriLuuKho',{id:l.locationId,warehouse_id:warehouse.id})),expected,lotRow,{placement:family==='receipts'});
   const receipt=family==='receipts'?receiptConfig(row):null;if(family==='receipts'&&!receipt)fail(422,'QC_TYPE_REQUIRED','Chọn loại QC nguồn của hàng lỗi.');
   const sourceFields=family==='receipts'?{[receipt.field]:l.qcLineId}:{[b.kind==='SALE'?'order_line_id':'material_request_line_id']:l.sourceLineId};
   await repo.insert(c,config.line,{[config.fk]:id,generation,...sourceFields,material_lot_id:expected==='MATERIAL'?lotRow.id:null,product_lot_id:expected==='PRODUCT'?lotRow.id:null,location_id:l.locationId,unit_id:l.unitId,packaging_version_id:l.packagingVersionId,qty_input:l.quantity,factor_snapshot:converted.factor,qty_base:converted.qty});
  }
  await validateQuota(c,family,row,await lines(c,family,row),req);await repo.audit(c,req.principal,family+'.allocate',config.header,id,before,row,req.correlationId);
  if(family==='issues'&&row.kind==='MATERIAL'){
   if(!req.principal.permissions.includes('issues.confirmAllocation'))fail(403,'MATERIAL_ISSUE_SEND_FORBIDDEN','Bạn cần quyền xác nhận phân bổ để lập và gửi phiếu cho nhân viên.');
   const values=await confirmAllocationValues(c,family,row,warehouse,req);
   await repo.update(c,config.header,{id:row.id},{...values,version:row.version+1});
   const sent=await repo.one(c,config.header,{id:row.id});
   await repo.audit(c,req.principal,'issues.confirmAllocation',config.header,row.id,row,sent,req.correlationId);
   return result(c,family,sent,req);
  }
  return result(c,family,row,req);
 },update?200:201);}
 async function confirmAllocationValues(c,family,row,warehouse,req){
  const ls=await lines(c,family,row);let values;
  if(family==='issues'&&row.kind==='MATERIAL')await require('../production/assignment-repository').assertAssignment(c,row.material_request_id,row.warehouse_id);
   expectState(row,['DA_PHAN_BO']);await validateQuota(c,family,row,ls,req);if(!ls.length)fail(409,'EMPTY_DOCUMENT','Phiếu chưa có dòng.');
   for(const id of [...new Set(ls.map(l=>String(l.location_id)))].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1))await stock.location(c,warehouse,id);
   for(const l of ls){const kind=l.material_lot_id?'MATERIAL':'PRODUCT',current=await lot(c,{lotKind:kind,lotId:String(l.material_lot_id||l.product_lot_id)},kind,row.kind==='REJECTED');await stock.unitQuantity(c,kind,current,l.unit_id,l.qty_input,l.packaging_version_id);await stock.storage(c,requireRow(await repo.one(c,'ViTriLuuKho',{id:l.location_id,warehouse_id:warehouse.id})),kind,current,{placement:family==='receipts'});}
   values={status:'DA_XAC_NHAN',confirmed_at:now()};
   if(family==='receipts')values.capacity_snapshot=JSON.stringify(await previewCapacity(c,warehouse,row,ls,req));
   if(family==='issues'){
    await fefo(c,row,ls);const start=Date.now(),expires=new Date(start+policy.reservationMinutes*60000).toISOString().slice(0,23).replace('T',' '),hard=new Date(start+policy.reservationMaxMinutes*60000).toISOString().slice(0,23).replace('T',' ');values={...values,expires_at:expires,hard_expires_at:hard,renew_count:0};
    for(const l of ls){const balance=requireRow(await repo.one(c,'TonKho',{location_id:l.location_id,material_lot_id:l.material_lot_id,product_lot_id:l.product_lot_id,quality_bucket:'DAT'},{lock:true}));
     const source=l.material_request_line_id?requireRow(await repo.one(c,'ChiTietYeuCauXuatNL',{id:l.material_request_line_id})):null;
     const reserved=d.parse(balance.qty_reserved)+d.parse(l.qty_base);if(reserved>d.parse(balance.qty_on_hand))fail(409,'STOCK_UNAVAILABLE','Tồn đã được phiếu khác giữ.');
     await repo.update(c,'TonKho',{id:balance.id},{qty_reserved:d.format(reserved),version:String(BigInt(balance.version)+1n)});
     await repo.insert(c,'DatGiuTon',{issue_id:row.id,issue_line_id:l.id,balance_id:balance.id,demand_id:source?.demand_id,qty_initial:l.qty_base,expires_at:expires});
    }
   }

  return values;
 }
 async function command(family,action,req){return context.write(req,family+'.'+action,async c=>{
  const config=docs[family],initial=requireRow(await repo.one(c,config.header,{id:req.params.id})),warehouse=await stock.gate(c,req,initial.warehouse_id);await stock.expire(c,req,warehouse.id);
  const row=requireRow(await repo.one(c,config.header,{id:initial.id},{lock:true}));expectVersion(row,req.body.expectedVersion);
  let values;
  if(action==='confirmAllocation'){
   values=await confirmAllocationValues(c,family,row,warehouse,req);
  }else if(action==='renewReservation'){
   if(family!=='issues')fail(422,'INVALID_OPERATION','Chỉ phiếu xuất có reservation.');expectState(row,['DA_XAC_NHAN']);
   const requested=new Date(req.body.requestedExpiresAt).getTime(),current=Date.parse(String(row.expires_at).replace(' ','T')+'Z'),hard=Date.parse(String(row.hard_expires_at).replace(' ','T')+'Z');
   if(row.renew_count>=policy.reservationMaxRenewals||requested<=current||requested>hard||requested>current+policy.reservationMinutes*60000)fail(422,'RESERVATION_RENEW_LIMIT','Chỉ gia hạn một lần tối đa 120 phút, không quá 240 phút từ xác nhận.');
   const expires=new Date(requested).toISOString().slice(0,23).replace('T',' ');await repo.update(c,'DatGiuTon',{issue_id:row.id,status:'ACTIVE'},{expires_at:expires});values={expires_at:expires,renew_count:row.renew_count+1};
  }else{
   expectState(row,['NHAP','DA_PHAN_BO','DA_XAC_NHAN','HET_HAN']);if(!req.body.reason?.trim())fail(422,'REASON_REQUIRED','Phải ghi lý do hủy/mở lại.');
   if(family==='issues')await stock.release(c,row);
   values={status:action==='cancel'?'HUY':'NHAP',allocation_generation:row.allocation_generation+1,confirmed_at:null,expires_at:undefined};
  }
  await repo.update(c,config.header,{id:row.id},{...values,version:row.version+1});const after=await repo.one(c,config.header,{id:row.id});await repo.audit(c,req.principal,family+'.'+action,config.header,row.id,row,after,req.correlationId);return result(c,family,after,req);
 });}
 async function post(family,action,req){return context.write(req,family+'.'+action,async c=>{
  const config=docs[family],initial=requireRow(await repo.one(c,config.header,{id:req.params.id})),warehouse=await stock.gate(c,req,initial.warehouse_id);await stock.expire(c,req,warehouse.id);
  const row=requireRow(await repo.one(c,config.header,{id:initial.id},{lock:true}));expectVersion(row,req.body.expectedVersion);expectState(row,['DA_XAC_NHAN']);
  if(row.allocation_generation!==req.body.expectedAllocationVersion)fail(409,'STALE_ALLOCATION','Phân bổ đã thay đổi.');
  const expected=action==='postMaterial'?'MATERIAL':action==='postSale'?'SALE':action==='postReturn'?'RETURN':action==='postRejected'?'REJECTED':'FINISHED';if(row.kind!==expected)fail(422,'POST_KIND_MISMATCH','Endpoint không phù hợp loại phiếu.');
  if(family==='issues'&&row.kind==='MATERIAL')await require('../production/assignment-repository').assertAssignment(c,row.material_request_id,row.warehouse_id,req.principal.accountId);
  if(family==='issues'&&row.kind==='MATERIAL'&&String(row.created_by_id)===String(req.principal.accountId))fail(403,'MATERIAL_ISSUE_MAKER_CHECKER','Nhân viên tiếp nhận phải khác người lập phiếu xuất.');
  const ls=await lines(c,family,row);await validateQuota(c,family,row,ls,req);
  for(const id of [...new Set(ls.map(l=>String(l.location_id)))].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1))await stock.location(c,warehouse,id);
  const holds=family==='issues'?await repo.find(c,'DatGiuTon',{issue_id:row.id,status:'ACTIVE'},{lock:true}):[];
  if(family==='issues'){
   if(holds.length!==ls.length)fail(409,'RESERVATION_REQUIRED','Reservation không đủ hoặc đã hết hiệu lực.');
   // Remove this document's reserved quantities inside the same transaction, then recheck FEFO.
   for(const h of holds){const balance=requireRow(await repo.one(c,'TonKho',{id:h.balance_id},{lock:true})),reserved=d.parse(balance.qty_reserved)-d.parse(h.qty_initial);if(reserved<0n)fail(409,'RESERVATION_INCONSISTENT','Reservation cần đối soát.');await repo.update(c,'TonKho',{id:balance.id},{qty_reserved:d.format(reserved),version:String(BigInt(balance.version)+1n)});}
   await fefo(c,row,ls);
  }
  const postingId=await repo.insert(c,'StockPosting',{[config.fk]:row.id,created_by_id:req.principal.accountId});
  for(const l of ls){const kind=l.material_lot_id?'MATERIAL':'PRODUCT',lotRow=await lot(c,{lotKind:kind,lotId:String(l.material_lot_id||l.product_lot_id)},kind,row.kind==='REJECTED'),loc=await stock.location(c,warehouse,l.location_id);
   const conversion=await stock.unitQuantity(c,kind,lotRow,l.unit_id,l.qty_input,l.packaging_version_id);if(d.parse(conversion.qty)!==d.parse(l.qty_base)||d.parse(conversion.factor,9)!==d.parse(l.factor_snapshot,9))fail(409,'CONVERSION_CHANGED','Quy đổi không còn trùng snapshot phân bổ, cần điều phối lại.');
   const qcSource=family==='receipts'?await sourceReceipt(c,row,l,req):null;
   let quarantine;
   if(qcSource&&(qcSource.origin._rework||qcSource.config.kind==='returnQc')){
    const receptionLine=qcSource.origin._rework?qcSource.origin:requireRow(await repo.one(c,'ChiTietTiepNhanTra',{id:qcSource.q.source_line_id}));
    const sourceLoc=await stock.location(c,warehouse,receptionLine.location_id);quarantine=await stock.balance(c,warehouse,sourceLoc,kind,lotRow,'QUARANTINE');
    await stock.move(c,{postingId,balance:quarantine,delta:-d.parse(l.qty_base),receiptLineId:l.id,reason:'Chuyển phần QC hàng trả đạt khỏi cách ly'});
   }
   await stock.storage(c,loc,kind,lotRow,{placement:family==='receipts'});
   const balance=await stock.balance(c,warehouse,loc,kind,lotRow,row.kind==='REJECTED'?'FAILED':'DAT',quarantine);
   await stock.move(c,{postingId,balance:await repo.one(c,'TonKho',{id:balance.id},{lock:true}),delta:(family==='receipts'?1n:-1n)*d.parse(l.qty_base),[family==='receipts'?'receiptLineId':'issueLineId']:l.id,reason:family==='receipts'?'Ghi sổ nhập kho đã xác nhận':'Ghi sổ xuất kho, tiêu thụ reservation'});
   if(family==='issues'){const hold=requireRow(holds.find(h=>String(h.issue_line_id)===String(l.id)));await repo.update(c,'DatGiuTon',{id:hold.id},{status:'CONSUMED',qty_consumed:hold.qty_initial});}
   else if(!lotRow.first_received_at)await repo.update(c,kind==='MATERIAL'?'LoNguyenLieu':'LoThanhPham',{id:lotRow.id},{first_received_at:now()});
  }
  if(family==='receipts')await stock.capacity(c,warehouse,ls.map(l=>String(l.location_id)));
  await repo.update(c,config.header,{id:row.id},{status:'HOAN_THANH',posted_at:now(),version:row.version+1});
  if(family==='issues'&&row.kind==='MATERIAL'){
   const source=await repo.one(c,'PhieuXuatKhoNguyenLieu',{id:row.material_request_id},{lock:true});let complete=true;
   for(const l of await repo.find(c,'ChiTietYeuCauXuatNL',{request_id:source.id}))if(d.parse(await repo.issueUsed(c,'material_request_line_id',l.id,'0'))<d.parse(l.qty_base))complete=false;
   await repo.update(c,'PhieuXuatKhoNguyenLieu',{id:source.id},{status:complete?'HOAN_THANH':'DANG_CAP',version:source.version+1,updated_at:now()});
  }
  if(family==='receipts'){
   const origins=new Map();for(const l of ls){const src=await sourceReceipt(c,row,l,req);origins.set(src.config.kind+':'+src.origin.id+':'+!!src.origin._rework,src);}
   for(const {config:qconfig,t,origin}of origins.values()){
    if(origin._rework)continue;const sourceLines=await repo.find(c,t.sourceLine,{[t.sourceKey]:origin.id});let complete=sourceLines.length>0;
    for(const sourceLine of sourceLines)if(d.parse(await repo.receivedFromSource(c,qconfig.kind,sourceLine.id))<d.parse(sourceLine[t.quantity]))complete=false;
    const next=complete?'HOAN_THANH':qconfig.kind==='productQc'?'DANG_NHAP':qconfig.kind==='materialQc'?'NHAN_MOT_PHAN':origin.status;
    if(next!==origin.status){await repo.update(c,t.source,{id:origin.id},{status:next,version:origin.version+1});await repo.audit(c,req.principal,'receipts.sourceProgress',t.source,origin.id,origin,{...origin,status:next},req.correlationId);}
   }
  }
  if(family==='issues'&&row.kind==='SALE'){
   const dispatchId=await repo.insert(c,'DotGiaoHang',{issue_id:row.id,order_id:row.order_id});for(const l of ls)await repo.insert(c,'ChiTietGiaoHang',{delivery_id:dispatchId,issue_line_id:l.id,qty_dispatched:l.qty_base});
   const order=await repo.one(c,'DonHang',{id:row.order_id},{lock:true});await repo.update(c,'DonHang',{id:order.id},{status:'DANG_GIAO',version:order.version+1,updated_at:now()});
  }
  const after=await repo.one(c,config.header,{id:row.id});await repo.audit(c,req.principal,family+'.'+action,config.header,row.id,row,after,req.correlationId);
  if(family==='issues'&&row.kind==='MATERIAL')await repo.audit(c,req.principal,'issues.material.accepted',config.header,row.id,{status:row.status},{status:after.status,acceptedBy:String(req.principal.accountId),acceptedAt:after.posted_at,postingId:String(postingId),allocationVersion:row.allocation_generation},req.correlationId);
  return result(c,family,after,req);
 });}
 async function search(req){return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.search(c,req.principal,{...req.query,page,pageSize});return{data:await require('../../shared/reference-names').describeRows(c,rows.map(r=>({id:String(r.id),warehouseId:String(r.warehouse_id),locationId:String(r.location_id),lotKind:r.material_lot_id?'MATERIAL':'PRODUCT',lotId:String(r.material_lot_id||r.product_lot_id),itemId:String(r.item_id),itemCode:r.item_code,itemName:r.item_name,lotCode:r.lot_code,qualityBucket:r.quality_bucket,unitId:String(r.unit_id),onHand:r.qty_on_hand,reserved:r.active_reserved,available:r.eligible&&r.quality_bucket==='DAT'&&(!r.expires_on||r.expires_on>=businessDate())?d.format(d.parse(r.qty_on_hand)-d.parse(r.active_reserved)):'0.000000',expiresOn:r.expires_on,version:String(r.version)}))),meta:{page,pageSize,total}};});}
 async function reservations(req){return context.read(async c=>{const row=requireRow(await repo.one(c,'PhieuXuatKho',{id:req.params.id}));scope(req.principal,row.warehouse_id);return{data:await Promise.all((await repo.find(c,'DatGiuTon',{issue_id:row.id})).map(async h=>{const line=requireRow(await repo.one(c,'ChiTietPhieuXuat',{id:h.issue_line_id})),expired=h.status==='ACTIVE'&&Date.parse(String(h.expires_at).replace(' ','T')+'Z')<=Date.now();return{id:String(h.id),issueId:String(h.issue_id),issueLineId:String(h.issue_line_id),balanceId:String(h.balance_id),demandId:h.demand_id?String(h.demand_id):null,allocationVersion:line.generation,quantityInitialBase:h.qty_initial,quantityConsumedBase:h.qty_consumed,quantityReleasedBase:h.qty_released,quantityRemainingBase:h.status==='ACTIVE'&&!expired?d.format(d.parse(h.qty_initial)-d.parse(h.qty_consumed)-d.parse(h.qty_released)):'0.000000',status:expired?'EXPIRED':h.status,expiresAt:String(h.expires_at).replace(' ','T')+'Z'};}))};});}
 return{list,read,allocate,command,post,search,reservations,materialSuggestions:req=>context.read(c=>require('./material-issue-suggestions').suggestions(c,req))};
}
module.exports={createInventoryService};
