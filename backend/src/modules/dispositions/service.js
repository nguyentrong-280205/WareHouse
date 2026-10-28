const repo=require('./repository'),qc=require('../qc/repository'),d=require('../../shared/decimal'),stock=require('../inventory/stock-service');
const{fail,requireRow,expectState,expectVersion,scope,now}=require('../../shared/business-context');
function createDispositionService(context){
 async function source(c,type,lineId,req,lock=false){const config=repo.types[type];if(!config)fail(422,'QC_TYPE_INVALID','Loại QC không hợp lệ.');const t=qc.definitions[config.kind],initial=requireRow(await repo.one(c,t.line,{id:lineId})),headerInitial=requireRow(await repo.one(c,t.header,{id:initial.qc_id})),origin=requireRow(await qc.origin(c,config.kind,headerInitial,{lock}));
  if(origin.warehouse_id)scope(req.principal,origin.warehouse_id);else if(!req.principal.workshopIds.includes(String(origin.workshop_id)))fail(403,'WORKSHOP_SCOPE','Không được cấp phạm vi xưởng nguồn.');
  expectState(requireRow(await repo.one(c,t.header,{id:initial.qc_id},{lock})),['DA_XAC_NHAN']);const line=requireRow(await repo.one(c,t.line,{id:lineId},{lock}));return{config,t,line,origin};
 }
 async function result(c,row,req){await source(c,row.source_qc_type,row[repo.types[row.source_qc_type].field],req);return{id:String(row.id),sourceQcType:row.source_qc_type,sourceQcLineId:String(row[repo.types[row.source_qc_type].field]),method:row.method,quantityBase:row.qty_base,reason:row.reason,proposerId:String(row.proposed_by_id),approverId:row.approved_by_id?String(row.approved_by_id):undefined,status:row.status,version:row.version,balanceId:row.balance_id?String(row.balance_id):undefined,reworkBatches:(await repo.find(c,'DotTaiXuLy',{disposition_id:row.id})).map(r=>({id:String(r.id),quantityProcessedBase:r.qty_processed,status:r.status,lotId:String(r.material_lot_id||r.product_lot_id)}))};}
 async function list(req){return context.read(async c=>{const visible=[];for(const row of await repo.all(c,req.query)){try{visible.push(await result(c,row,req));}catch(e){if(e.status!==403&&e.statusCode!==403)throw e;}}const page=req.query.page||1,pageSize=req.query.pageSize||20;return{data:visible.slice((page-1)*pageSize,page*pageSize),meta:{page,pageSize,total:visible.length}};});}
 async function read(req){return context.read(async c=>result(c,requireRow(await repo.one(c,'XuLyHangLoiTraVe',{id:req.params.id})),req));}
 async function create(req){return context.write(req,'dispositions.create',async c=>{
  const b=req.body,{config,t,line}=await source(c,b.sourceQcType,b.sourceQcLineId,req,true),qty=d.positive(b.quantityBase);if(!b.reason.trim())fail(422,'REASON_REQUIRED','Phải ghi lý do xử lý.');
  if(b.sourceQcType!=='MATERIAL'&&qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Chai/lon phải nguyên.');
  if(b.sourceQcType==='MATERIAL'){const lot=requireRow(await repo.one(c,'LoNguyenLieu',{id:line.material_lot_id})),material=requireRow(await repo.one(c,'NguyenLieu',{id:lot.material_id})),unit=requireRow(await repo.one(c,'DonViTinh',{id:material.base_unit_id}));if(unit.discrete&&qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Nguyên liệu theo đơn vị đếm phải nguyên.');}
  if(b.method==='SUPPLIER_RETURN'&&b.sourceQcType!=='MATERIAL')fail(422,'SUPPLIER_SOURCE_REQUIRED','Trả nhà cung cấp chỉ áp dụng nguồn mua nguyên liệu.');
  if(qty+d.parse(await repo.claimed(c,config.field,line.id))>d.parse(line.qty_rejected))fail(409,'REJECTED_QUOTA','Tổng lượng xử lý vượt phần QC không đạt.');
  if(b.balanceId){const balance=requireRow(await repo.one(c,'TonKho',{id:b.balanceId,quality_bucket:'FAILED'})),loc=requireRow(await repo.one(c,'ViTriLuuKho',{id:balance.location_id}));scope(req.principal,loc.warehouse_id);if(String(balance[t.lot])!==String(line[t.lot]))fail(422,'FAILED_LOT_MISMATCH','Tồn hàng lỗi không trùng lô QC.');}
  const id=await repo.insert(c,'XuLyHangLoiTraVe',{source_qc_type:b.sourceQcType,[config.field]:line.id,method:b.method,qty_base:b.quantityBase,reason:b.reason,balance_id:b.balanceId,proposed_by_id:req.principal.accountId});const row=await repo.one(c,'XuLyHangLoiTraVe',{id});await repo.audit(c,req.principal,'dispositions.create','XuLyHangLoiTraVe',id,null,row,req.correlationId);return result(c,row,req);
 },201);}
 async function command(action,req){return context.write(req,'dispositions.'+action,async c=>{
  const initial=requireRow(await repo.one(c,'XuLyHangLoiTraVe',{id:req.params.id}));let warehouse,balance;
  if(action==='execute'){const balanceId=req.body.balanceId||initial.balance_id;if(!balanceId)fail(422,'PHYSICAL_INTAKE_REQUIRED','Chọn tồn FAILED đã tiếp nhận bằng chứng từ trước khi xử lý.');balance=requireRow(await repo.one(c,'TonKho',{id:balanceId}));const loc=requireRow(await repo.one(c,'ViTriLuuKho',{id:balance.location_id}));warehouse=await stock.gate(c,req,loc.warehouse_id);await stock.location(c,warehouse,loc.id);}
  const src=await source(c,initial.source_qc_type,initial[repo.types[initial.source_qc_type].field],req,true),row=requireRow(await repo.one(c,'XuLyHangLoiTraVe',{id:initial.id},{lock:true}));expectVersion(row,req.body.expectedVersion);
  if(d.parse(row.qty_base)+d.parse(await repo.claimed(c,src.config.field,src.line.id,row.id))>d.parse(src.line.qty_rejected))fail(409,'REJECTED_QUOTA','Quota hàng lỗi đã thay đổi.');
  let values;
  if(action==='submit'){expectState(row,['NHAP']);values={status:'CHO_DUYET'};}
  else if(action==='decide'){expectState(row,['CHO_DUYET']);if(String(row.proposed_by_id)===req.principal.accountId)fail(403,'MAKER_CHECKER','Người đề nghị không tự duyệt.');const approve=req.body.decision==='APPROVE';if(!approve&&!req.body.reason?.trim())fail(422,'REASON_REQUIRED','Từ chối cần lý do.');values={status:approve?'DA_DUYET':'TU_CHOI',approved_by_id:req.principal.accountId,decided_at:now()};}
  else if(action==='execute'){
   expectState(row,['DA_DUYET']);if(row.balance_id&&String(row.balance_id)!==String(balance.id))fail(422,'PHYSICAL_SOURCE_IMMUTABLE','Không đổi nguồn vật lý đã được duyệt.');balance=requireRow(await repo.one(c,'TonKho',{id:balance.id},{lock:true}));if(balance.quality_bucket!=='FAILED'||String(balance[src.t.lot])!==String(src.line[src.t.lot]))fail(422,'FAILED_SOURCE_REQUIRED','Chỉ xử lý tồn FAILED đúng lô nguồn.');
   const qty=d.parse(row.qty_base);if(qty>d.parse(balance.qty_on_hand)-d.parse(balance.qty_reserved))fail(409,'FAILED_STOCK_UNAVAILABLE','Không đủ hàng lỗi vật lý còn lại.');
   const postingId=await repo.insert(c,'StockPosting',{disposition_id:row.id,created_by_id:req.principal.accountId});await stock.move(c,{postingId,balance,delta:-qty,reason:'Xử lý hàng lỗi '+row.method+': '+row.reason});
   if(row.method==='REWORK'){
    const kind=balance.material_lot_id?'MATERIAL':'PRODUCT',lot=requireRow(await repo.one(c,kind==='MATERIAL'?'LoNguyenLieu':'LoThanhPham',{id:balance.material_lot_id||balance.product_lot_id})),loc=await stock.location(c,warehouse,balance.location_id),quarantine=await stock.balance(c,warehouse,loc,kind,lot,'QUARANTINE',balance);
    await stock.move(c,{postingId,balance:quarantine,delta:qty,reason:'Chuyển đợt tái xử lý mới sang cách ly chờ QC'});
    await repo.insert(c,'DotTaiXuLy',{disposition_id:row.id,source_qc_type:row.source_qc_type,warehouse_id:warehouse.id,location_id:loc.id,material_lot_id:balance.material_lot_id,product_lot_id:balance.product_lot_id,qty_processed:row.qty_base,created_by_id:req.principal.accountId});await stock.capacity(c,warehouse,[String(loc.id)]);
   }
   values={status:'DA_THUC_HIEN',balance_id:balance.id,executed_at:now()};
  }else fail(422,'INVALID_OPERATION','Thao tác không hợp lệ.');
  await repo.update(c,'XuLyHangLoiTraVe',{id:row.id},{...values,version:row.version+1});const after=await repo.one(c,'XuLyHangLoiTraVe',{id:row.id});await repo.audit(c,req.principal,'dispositions.'+action,'XuLyHangLoiTraVe',row.id,row,{...after,decisionReason:req.body.reason},req.correlationId);return result(c,after,req);
 });}
 return{list,read,create,command};
}
module.exports={createDispositionService};
