const {randomUUID}=require('node:crypto');
const repo=require('./repository'),d=require('../../shared/decimal');
const {fail,requireRow,expectState,expectVersion,scope,now}=require('../../shared/business-context');
function createQcService(context){
 function sourceScope(req,t,row){if(row._rework||t.scope==='warehouse')scope(req.principal,row.warehouse_id);else if(!req.principal.workshopIds.includes(String(row.workshop_id)))fail(403,'WORKSHOP_SCOPE','Không được cấp phạm vi xưởng.');}
 async function source(c,kind,header,req,lock=false){const t=repo.definitions[kind],row=requireRow(await repo.origin(c,kind,header,{lock}));sourceScope(req,t,row);if(row._rework&&row.source_qc_type!==({materialQc:'MATERIAL',productQc:'PRODUCT',returnQc:'RETURN'})[kind])fail(422,'REWORK_QC_TYPE','Loại QC không trùng đợt tái xử lý.');return row;}
 async function result(c,kind,row,req){
  const t=repo.definitions[kind];await source(c,kind,row,req);const output=[];
  for(const l of await repo.find(c,t.line,{qc_id:row.id})){
   const material=kind==='materialQc',lot=requireRow(await repo.one(c,material?'LoNguyenLieu':'LoThanhPham',{id:l[t.lot]})),item=requireRow(await repo.one(c,material?'NguyenLieu':'ThanhPham',{id:lot.material_id||lot.product_id})),field={materialQc:'material_qc_line_id',productQc:'product_qc_line_id',returnQc:'return_qc_line_id'}[kind];
   const received=await repo.receivedGood(c,kind,l.id),used=await require('../inventory/repository').receiptUsed(c,field,l.id,'0');
   const remaining=d.parse(l.qty_accepted)-d.parse(used);if(remaining<0n)fail(409,'QC_QUOTA_INCONSISTENT','Quota QC cần đối soát.');
   output.push({id:String(l.id),sourceLineId:String(l.source_line_id||l.rework_batch_id),lotId:String(l[t.lot]),unitId:String(item.base_unit_id),inspectedBase:l.qty_inspected,quantityInspectedBase:l.qty_inspected,acceptedBase:l.qty_accepted,rejectedBase:l.qty_rejected,receivedGoodBase:received,remainingAcceptedBase:d.format(remaining),batchSequence:l.batch_sequence,...(l.rejection_reason?{rejectionReason:l.rejection_reason}:{}),...(l.condition_note?{condition:l.condition_note}:{})});
  }
  return{id:String(row.id),code:({materialQc:'QCNL-',productQc:'QCTP-',returnQc:'QCTRA-'})[kind]+row.id,sourceId:row.source_id?String(row.source_id):undefined,reworkBatchId:row.rework_batch_id?String(row.rework_batch_id):undefined,status:row.status,version:row.version,lines:output};
 }
 async function list(kind,req){return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.list(c,kind,req.principal,{...req.query,page,pageSize});return{data:await Promise.all(rows.map(r=>result(c,kind,r,req))),meta:{page,pageSize,total}};});}
 async function read(kind,req){return context.read(async c=>result(c,kind,requireRow(await repo.one(c,repo.definitions[kind].header,{id:req.params.id})),req));}
 async function create(kind,req){return context.write(req,kind+'.create',async c=>{
  const t=repo.definitions[kind],b=req.body;if(!!b.sourceId===!!b.reworkBatchId)fail(422,'QC_SOURCE_REQUIRED','Chọn đúng một nguồn gốc hoặc đợt tái xử lý.');const origin=await source(c,kind,{source_id:b.sourceId,rework_batch_id:b.reworkBatchId},req,true);
  expectState(origin,kind==='productQc'?['CHO_QC','QC_HOAN_TAT','DANG_NHAP']:['CHO_QC','QC_HOAN_TAT','NHAN_MOT_PHAN']);
  const id=await repo.insert(c,t.header,{source_id:origin._rework?undefined:origin.id,rework_batch_id:origin._rework?origin.id:undefined,created_by_id:req.principal.accountId}),claimed=new Map();
  for(const l of [...b.lines].sort((a,b)=>BigInt(a.sourceLineId)<BigInt(b.sourceLineId)?-1:1)){
   const original=requireRow(await repo.originalLine(c,t,origin,l.sourceLineId,{lock:true}));
   if(String(original[t.lot])!==l.lotId)fail(422,'LOT_MISMATCH','Lô phải trùng dòng nguồn thực tế.');
   const inspected=d.positive(l.quantityInspectedBase),accepted=d.parse(l.acceptedBase),rejected=d.parse(l.rejectedBase);
   if(accepted+rejected!==inspected)fail(422,'QC_SUM_INVALID','Đạt cộng không đạt phải bằng lượng kiểm.');
   if(rejected&&!l.rejectionReason?.trim())fail(422,'QC_REASON_REQUIRED','Hàng không đạt phải có lý do.');
   if(kind!=='materialQc'&&(inspected%d.ten(6)||accepted%d.ten(6)||rejected%d.ten(6)))fail(422,'DISCRETE_QUANTITY','Chai/lon phải nguyên.');
   if(kind==='materialQc'){const materialLot=requireRow(await repo.one(c,'LoNguyenLieu',{id:original.material_lot_id})),material=requireRow(await repo.one(c,'NguyenLieu',{id:materialLot.material_id})),unit=requireRow(await repo.one(c,'DonViTinh',{id:material.base_unit_id}));if(unit.discrete&&(inspected%d.ten(6)||accepted%d.ten(6)||rejected%d.ten(6)))fail(422,'DISCRETE_QUANTITY','Đơn vị đếm phải nguyên.');}
   const sum=(claimed.get(l.sourceLineId)||0n)+inspected;claimed.set(l.sourceLineId,sum);
   if(sum+d.parse(await repo.inspected(c,kind,original.id,!!origin._rework))>d.parse(original[t.quantity]))fail(409,'QC_SOURCE_QUOTA','Tổng lượng kiểm vượt lượng nguồn chưa kiểm.');
   await repo.insert(c,t.line,{qc_id:id,source_line_id:origin._rework?undefined:original.id,rework_batch_id:origin._rework?origin.id:undefined,[t.lot]:original[t.lot],batch_sequence:l.batchSequence,qty_inspected:l.quantityInspectedBase,qty_accepted:l.acceptedBase,qty_rejected:l.rejectedBase,rejection_reason:l.rejectionReason,condition_note:l.condition});
  }
  const row=await repo.one(c,t.header,{id});await repo.audit(c,req.principal,kind+'.create',t.header,id,null,row,req.correlationId);return result(c,kind,row,req);
 },201);}
 async function confirm(kind,req){return context.write(req,kind+'.confirm',async c=>{
  const t=repo.definitions[kind],initial=requireRow(await repo.one(c,t.header,{id:req.params.id}));
  // Source aggregate is the shared quota mutex for every QC round, not the QC header.
  const origin=await source(c,kind,initial,req,true),row=requireRow(await repo.one(c,t.header,{id:initial.id},{lock:true}));
  expectVersion(row,req.body.expectedVersion);expectState(row,['NHAP']);
  const lines=await repo.find(c,t.line,{qc_id:row.id},{lock:true}),claimed=new Map();if(!lines.length)fail(409,'EMPTY_DOCUMENT','QC chưa có dòng.');
  for(const l of lines){const key=String(l.source_line_id||l.rework_batch_id);claimed.set(key,(claimed.get(key)||0n)+d.parse(l.qty_inspected));}
  for(const[key,qty]of [...claimed].sort((a,b)=>BigInt(a[0])<BigInt(b[0])?-1:1)){
   const original=requireRow(await repo.originalLine(c,t,origin,key,{lock:true}));
   if(qty+d.parse(await repo.inspected(c,kind,key,!!origin._rework))>d.parse(original[t.quantity]))fail(409,'QC_SOURCE_QUOTA','Một đợt QC khác đã sử dụng phần lượng nguồn này.');
  }
  await repo.update(c,t.header,{id:row.id},{status:'DA_XAC_NHAN',version:row.version+1,confirmed_at:now()});
  const originals=origin._rework?[{...origin,[t.quantity]:origin.qty_processed}]:await repo.find(c,t.sourceLine,{[t.sourceKey]:origin.id});let complete=originals.length>0;
  for(const l of originals)if(d.parse(await repo.inspected(c,kind,l.id,!!origin._rework))!==d.parse(l[t.quantity]))complete=false;
  if(complete&&['CHO_QC','QC_HOAN_TAT'].includes(origin.status))await repo.update(c,origin._rework?'DotTaiXuLy':t.source,{id:origin.id},{status:'QC_HOAN_TAT',version:origin.version+1});
  const after=await repo.one(c,t.header,{id:row.id});await repo.audit(c,req.principal,kind+'.confirm',t.header,row.id,row,after,req.correlationId);return result(c,kind,after,req);
 });}
 async function createDelivery(req){return context.write(req,'materialDeliveries.create',async c=>{
  const b=req.body;scope(req.principal,b.warehouseId);const warehouse=requireRow(await repo.one(c,'Kho',{id:b.warehouseId},{lock:true}));expectState(warehouse,['ACTIVE']);
  if(!['MATERIAL','CONTROLLED'].includes(warehouse.type))fail(422,'WAREHOUSE_TYPE','Nguồn nguyên liệu phải thuộc kho phù hợp.');
  const purchase=requireRow(await repo.one(c,'DonMuaNguyenLieu',{id:req.params.id},{lock:true}));expectState(purchase,['DA_DUYET','NHAN_MOT_PHAN']);
  const id=await repo.insert(c,'DotGiaoNguyenLieu',{code:'GN-'+randomUUID(),purchase_id:purchase.id,warehouse_id:warehouse.id,received_at:now(),created_by_id:req.principal.accountId});
  for(const l of [...b.lines].sort((a,b)=>BigInt(a.purchaseLineId)<BigInt(b.purchaseLineId)?-1:1)){
   const line=requireRow(await repo.one(c,'ChiTietDonMuaNguyenLieu',{id:l.purchaseLineId,purchase_id:purchase.id},{lock:true})),lot=requireRow(await repo.one(c,'LoNguyenLieu',{id:l.lotId},{lock:true}));
   expectState(lot,['ACTIVE']);if(String(lot.material_id)!==String(line.material_id))fail(422,'MATERIAL_MISMATCH','Lô không thuộc nguyên liệu trong đơn mua.');
   const qty=d.positive(l.quantityReceivedBase),unit=requireRow(await repo.one(c,'DonViTinh',{id:line.unit_id}));if(unit.discrete&&qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Đơn vị đếm phải nguyên.');
   if(d.parse(await repo.delivered(c,line.id))+qty>d.parse(line.qty_base))fail(409,'PURCHASE_QUOTA','Lượng giao vượt lượng đơn mua còn lại.');
   await repo.insert(c,'ChiTietGiaoNL',{delivery_id:id,purchase_line_id:line.id,material_lot_id:lot.id,unit_id:line.unit_id,qty_received:l.quantityReceivedBase});
  }
   let fullyDelivered=true;for(const l of await repo.find(c,'ChiTietDonMuaNguyenLieu',{purchase_id:purchase.id}))if(d.parse(await repo.delivered(c,l.id))<d.parse(l.qty_base))fullyDelivered=false;
   await repo.update(c,'DonMuaNguyenLieu',{id:purchase.id},{status:fullyDelivered?'HOAN_THANH':'NHAN_MOT_PHAN',version:purchase.version+1,updated_at:now()});
  const row=await repo.one(c,'DotGiaoNguyenLieu',{id});await repo.audit(c,req.principal,'materialDeliveries.create','DotGiaoNguyenLieu',id,null,row,req.correlationId);
  return{id,code:row.code,status:row.status,version:row.version,purchaseId:String(purchase.id),warehouseId:String(warehouse.id),lines:(await repo.find(c,'ChiTietGiaoNL',{delivery_id:id})).map(l=>({id:String(l.id),purchaseLineId:String(l.purchase_line_id),lotId:String(l.material_lot_id),quantityReceivedBase:l.qty_received}))};
 },201);}
 async function deliveryResult(c,row,req){scope(req.principal,row.warehouse_id);return{id:String(row.id),code:row.code,purchaseId:String(row.purchase_id),warehouseId:String(row.warehouse_id),status:row.status,version:row.version,lines:(await repo.find(c,'ChiTietGiaoNL',{delivery_id:row.id})).map(l=>({id:String(l.id),purchaseLineId:String(l.purchase_line_id),lotId:String(l.material_lot_id),quantityReceivedBase:l.qty_received}))};}
 async function deliveries(req){return context.read(async c=>{const rows=await require('../customers/source-repository').materialDeliveries(c,req.principal.accountId),page=req.query.page||1,pageSize=req.query.pageSize||20,filtered=rows.filter(r=>!req.query.status||r.status===req.query.status);return{data:await Promise.all(filtered.slice((page-1)*pageSize,page*pageSize).map(r=>deliveryResult(c,r,req))),meta:{page,pageSize,total:filtered.length}};});}
 async function delivery(req){return context.read(async c=>deliveryResult(c,requireRow(await repo.one(c,'DotGiaoNguyenLieu',{id:req.params.id})),req));}
 return{list,read,create,confirm,createDelivery,deliveries,delivery};
}
module.exports={createQcService};
