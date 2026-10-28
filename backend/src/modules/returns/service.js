const {randomUUID}=require('node:crypto');
const repo=require('./repository'),d=require('../../shared/decimal'),stock=require('../inventory/stock-service');
const {fail,requireRow,expectVersion,expectState,scope,now}=require('../../shared/business-context');
const kinds={deliveries:{table:'DotGiaoHang',line:'ChiTietGiaoHang',fk:'delivery_id'},returnRequests:{table:'YeuCauTraHang',line:'ChiTietTraHang',fk:'request_id'},returnReceptions:{table:'TiepNhanTra',line:'ChiTietTiepNhanTra',fk:'reception_id'}};
function createReturnService(context){
 async function visible(c,kind,row,req){
  if(kind==='returnReceptions'){scope(req.principal,row.warehouse_id);return;}
  if(req.principal.customerId){const order=requireRow(await repo.one(c,'DonHang',{id:row.order_id,customer_id:req.principal.customerId}));expectState(requireRow(await repo.one(c,'KhachHang',{id:order.customer_id})),['ACTIVE']);return;}
  const issues=kind==='deliveries'?[{issue_id:row.issue_id}]:await repo.find(c,'ChiTietTraHang',{request_id:row.id});
  for(const i of issues){const line=kind==='deliveries'?i:requireRow(await repo.one(c,'ChiTietPhieuXuat',{id:i.issue_line_id})),issue=requireRow(await repo.one(c,'PhieuXuatKho',{id:line.issue_id}));scope(req.principal,issue.warehouse_id);}
 }
 async function result(c,kind,row,req){await visible(c,kind,row,req);const t=kinds[kind],ls=await repo.find(c,t.line,{[t.fk]:row.id});if(kind!=='returnReceptions')for(const l of ls){const line=await repo.one(c,'ChiTietPhieuXuat',{id:l.issue_line_id}),issue=await repo.one(c,'PhieuXuatKho',{id:line.issue_id});l.original_issue_id=issue.id;l.original_warehouse_id=issue.warehouse_id;l.actual_product_lot_id=line.product_lot_id;}
  let warehouseId=row.warehouse_id;if(kind==='deliveries')warehouseId=(await repo.one(c,'PhieuXuatKho',{id:row.issue_id})).warehouse_id;
  return{id:String(row.id),version:row.version,status:row.status,code:row.code,orderId:row.order_id?String(row.order_id):undefined,issueId:row.issue_id?String(row.issue_id):undefined,warehouseId:warehouseId?String(warehouseId):undefined,returnRequestId:row.request_id?String(row.request_id):undefined,reason:row.reason,
  lines:ls.map(l=>kind==='deliveries'?{id:String(l.id),issueLineId:String(l.issue_line_id),productLotId:String(l.actual_product_lot_id),quantityDispatchedBase:l.qty_dispatched,quantityDeliveredBase:l.qty_delivered,lastDeliveredAt:l.last_delivered_at}:kind==='returnRequests'?{id:String(l.id),originalDeliveryLineId:String(l.delivery_line_id),originalIssueLineId:String(l.issue_line_id),originalIssueId:String(l.original_issue_id),originalWarehouseId:String(l.original_warehouse_id),productLotId:String(l.product_lot_id),quantityBase:l.qty_base}:{id:String(l.id),returnLineId:String(l.return_line_id),locationId:String(l.location_id),productLotId:String(l.product_lot_id),quantityBase:l.qty_base,unitId:String(l.unit_id)})};}
 async function list(kind,req){return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.list(c,kind,req.principal,{...req.query,page,pageSize});return{data:await Promise.all(rows.map(row=>result(c,kind,row,req))),meta:{page,pageSize,total}};});}
 async function read(kind,req){return context.read(async c=>result(c,kind,requireRow(await repo.one(c,kinds[kind].table,{id:req.params.id})),req));}
 async function confirmDelivery(req){return context.write(req,'deliveries.confirm',async c=>{
  const row=requireRow(await repo.one(c,'DotGiaoHang',{id:req.params.id},{lock:true}));await visible(c,'deliveries',row,req);expectVersion(row,req.body.expectedVersion);
  const delivered=new Date(req.body.deliveredAt);if(delivered.getTime()>Date.now())fail(422,'DELIVERY_DATE_INVALID','Thời điểm giao không được ở tương lai.');
  const issue=requireRow(await repo.one(c,'PhieuXuatKho',{id:row.issue_id}));expectState(issue,['HOAN_THANH']);
  if(delivered.getTime()<Date.parse(String(issue.posted_at).replace(' ','T')+'Z'))fail(422,'DELIVERY_DATE_INVALID','Thời điểm giao phải sau khi xuất kho.');
  for(const evidenceId of req.body.evidenceIds||[]){const evidence=requireRow(await repo.one(c,'BangChung',{id:evidenceId}));scope(req.principal,evidence.warehouse_id);}
  for(const l of req.body.lines){const line=requireRow(await repo.one(c,'ChiTietGiaoHang',{delivery_id:row.id,issue_line_id:l.issueLineId},{lock:true})),qty=d.positive(l.quantityDeliveredBase);if(qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Chai/lon phải nguyên.');
   const total=d.parse(line.qty_delivered)+qty;if(total>d.parse(line.qty_dispatched))fail(409,'DELIVERY_QUOTA','Lượng giao thành công vượt lượng đã xuất.');
   await repo.update(c,'ChiTietGiaoHang',{id:line.id},{qty_delivered:d.format(total),last_delivered_at:delivered.toISOString().slice(0,23).replace('T',' ')});
  }
  await repo.update(c,'DotGiaoHang',{id:row.id},{version:row.version+1});
  const order=requireRow(await repo.one(c,'DonHang',{id:row.order_id},{lock:true})),orderLines=await repo.find(c,'ChiTietDonHang',{order_id:order.id});let complete=true;
  for(const l of orderLines)if(d.parse(await repo.orderDelivered(c,l.id))<d.parse(l.qty_base))complete=false;
  if(complete)await repo.update(c,'DonHang',{id:order.id},{status:'DA_GIAO',version:order.version+1,updated_at:now()});
  const after=await repo.one(c,'DotGiaoHang',{id:row.id});await repo.audit(c,req.principal,'deliveries.confirm','DotGiaoHang',row.id,row,{...after,confirmation:req.body},req.correlationId);return result(c,'deliveries',after,req);
 });}
 async function createRequest(req){return context.write(req,'returnRequests.create',async c=>{
  if(!req.principal.customerId)fail(403,'CUSTOMER_REQUIRED','Chỉ khách hàng tạo yêu cầu trả hàng.');expectState(requireRow(await repo.one(c,'KhachHang',{id:req.principal.customerId})),['ACTIVE']);
  const b=req.body,order=requireRow(await repo.one(c,'DonHang',{id:b.orderId,customer_id:req.principal.customerId},{lock:true}));if(!b.reason.trim())fail(422,'REASON_REQUIRED','Phải ghi lý do trả hàng.');
  const id=await repo.insert(c,'YeuCauTraHang',{code:'YCT-'+randomUUID(),order_id:order.id,customer_id:order.customer_id,reason:b.reason,created_by_id:req.principal.accountId});
  for(const l of [...b.lines].sort((a,b)=>BigInt(a.originalDeliveryLineId)<BigInt(b.originalDeliveryLineId)?-1:1)){
   const delivered=requireRow(await repo.one(c,'ChiTietGiaoHang',{id:l.originalDeliveryLineId,issue_line_id:l.originalIssueLineId},{lock:true})),dispatch=requireRow(await repo.one(c,'DotGiaoHang',{id:delivered.delivery_id,order_id:order.id})),issueLine=requireRow(await repo.one(c,'ChiTietPhieuXuat',{id:l.originalIssueLineId,issue_id:dispatch.issue_id,product_lot_id:l.productLotId}));
   const qty=d.positive(l.quantityBase);if(qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Chai/lon phải nguyên.');if(qty+d.parse(await repo.requested(c,delivered.id))>d.parse(delivered.qty_delivered))fail(409,'RETURN_DELIVERY_QUOTA','Chỉ được trả lượng đã giao thành công chưa có yêu cầu trả hiệu lực.');
   await repo.insert(c,'ChiTietTraHang',{request_id:id,delivery_line_id:delivered.id,issue_line_id:issueLine.id,product_lot_id:l.productLotId,qty_base:l.quantityBase});
  }
  const row=await repo.one(c,'YeuCauTraHang',{id});await repo.audit(c,req.principal,'returnRequests.create','YeuCauTraHang',id,null,row,req.correlationId);return result(c,'returnRequests',row,req);
 },201);}
 async function receive(req){return context.write(req,'returnReceptions.post',async c=>{
  const b=req.body,warehouse=await stock.gate(c,req,b.warehouseId);if(warehouse.type!=='CONTROLLED')fail(422,'CONTROLLED_WAREHOUSE_REQUIRED','Hàng trả phải vào kho kiểm soát/cách ly.');
  const request=requireRow(await repo.one(c,'YeuCauTraHang',{id:b.returnRequestId},{lock:true}));await visible(c,'returnRequests',request,req);expectVersion(request,b.expectedVersion);expectState(request,['DA_GUI','TIEP_NHAN_MOT_PHAN']);
  for(const id of [...new Set(b.lines.map(l=>l.locationId))].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1))await stock.location(c,warehouse,id);
  const id=await repo.insert(c,'TiepNhanTra',{request_id:request.id,warehouse_id:warehouse.id,created_by_id:req.principal.accountId}),postingId=await repo.insert(c,'StockPosting',{return_reception_id:id,created_by_id:req.principal.accountId});
  for(const l of b.lines){const origin=requireRow(await repo.one(c,'ChiTietTraHang',{id:l.returnLineId,request_id:request.id,product_lot_id:l.productLotId},{lock:true})),qty=d.positive(l.quantityBase);if(qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Chai/lon phải nguyên.');if(qty+d.parse(await repo.received(c,origin.id))>d.parse(origin.qty_base))fail(409,'RETURN_RECEIPT_QUOTA','Lượng tiếp nhận vượt lượng yêu cầu còn lại.');
   const lot=requireRow(await repo.one(c,'LoThanhPham',{id:l.productLotId})),product=requireRow(await repo.one(c,'ThanhPham',{id:lot.product_id}));if(String(product.base_unit_id)!==l.unitId)fail(422,'UNIT_MISMATCH','Lượng tiếp nhận dùng đơn vị cơ sở.');
   const lineId=await repo.insert(c,'ChiTietTiepNhanTra',{reception_id:id,return_line_id:origin.id,product_lot_id:lot.id,location_id:l.locationId,unit_id:l.unitId,qty_base:l.quantityBase}),loc=await stock.location(c,warehouse,l.locationId),balance=await stock.balance(c,warehouse,loc,'PRODUCT',lot,'QUARANTINE');
   await stock.move(c,{postingId,balance,delta:qty,returnReceptionLineId:lineId,reason:'Tiếp nhận hàng trả vào cách ly, chưa phải hàng đạt QC'});
  }
  await stock.capacity(c,warehouse,b.lines.map(l=>l.locationId));let complete=true;for(const l of await repo.find(c,'ChiTietTraHang',{request_id:request.id}))if(d.parse(await repo.received(c,l.id))!==d.parse(l.qty_base))complete=false;
  await repo.update(c,'YeuCauTraHang',{id:request.id},{status:complete?'DA_TIEP_NHAN':'TIEP_NHAN_MOT_PHAN',version:request.version+1});const row=await repo.one(c,'TiepNhanTra',{id});await repo.audit(c,req.principal,'returnReceptions.post','TiepNhanTra',id,null,row,req.correlationId);return result(c,'returnReceptions',row,req);
 },201);}
 return{list,read,confirmDelivery,createRequest,receive};
}
module.exports={createReturnService};
