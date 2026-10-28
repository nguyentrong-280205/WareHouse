const {randomUUID} = require('node:crypto');
const repo = require('./request-repository'), d = require('../../shared/decimal');
const {fail,requireRow,expectState,expectVersion,now} = require('../../shared/business-context');
const definitions = {
  materialRequests:{table:'PhieuXuatKhoNguyenLieu',lines:'ChiTietYeuCauXuatNL',next:'DA_GUI'},
  productRequests:{table:'PhieuNhapKhoThanhPham',lines:'ChiTietYeuCauNhapTP',next:'CHO_QC'},
};
function createRequestService(context) {
  async function exactMaterials(c,lineId,inputs){
    const demands=await repo.find(c,'NhuCauNguyenLieuKHSX',{plan_line_id:lineId},{lock:true});
    const seen=new Set();
    if(!demands.length||inputs.length!==demands.length)fail(422,'PLAN_MATERIALS_REQUIRED','Phiếu phải có đủ nguyên vật liệu và đúng số lượng trong kế hoạch đã duyệt.');
    for(const input of inputs){
      const id=String(input.demandId??input.demand_id),material=String(input.materialId??input.material_id);
      const demand=demands.find(r=>String(r.id)===id);
      if(seen.has(id)||!demand||String(demand.material_id)!==material||d.positive(input.quantityBase??input.qty_base)!==d.parse(demand.qty_required))fail(422,'PLAN_QUANTITY_MISMATCH','Không được thêm, bớt nguyên vật liệu hoặc thay đổi số lượng đã ghi trong kế hoạch.');
      seen.add(id);
    }
  }
  function checkScope(req, workshop) {
    if(!req.principal.workshopIds.includes(String(workshop))) fail(403,'WORKSHOP_SCOPE','Không được cấp phạm vi xưởng.');
  }
  async function result(c,kind,row,req) {
    checkScope(req,row.workshop_id);
    const lines=await repo.find(c,definitions[kind].lines,{request_id:row.id});
    return {id:String(row.id),code:row.code,status:row.status,version:row.version,planLineId:String(row.plan_line_id),workshopId:String(row.workshop_id),...(kind==='materialRequests'?{notes:row.notes??null}:{}),lines:lines.map(l=>kind==='materialRequests'
      ? {id:String(l.id),demandId:String(l.demand_id),materialId:String(l.material_id),unitId:String(l.unit_id),quantityBase:l.qty_base}
      : {id:String(l.id),productLotId:String(l.product_lot_id),quantityCompletedBase:l.qty_completed})};
  }
  async function list(kind,req) {return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.list(c,definitions[kind].table,req.principal,{...req.query,page,pageSize});return {data:await Promise.all(rows.map(r=>result(c,kind,r,req))),meta:{page,pageSize,total}};});}
  async function read(kind,req) {return context.read(async c=>result(c,kind,requireRow(await repo.one(c,definitions[kind].table,{id:req.params.id})),req));}
  async function create(kind,req) {return context.write(req,kind+'.create',async c=>{
    const b=req.body,config=definitions[kind];
    const line=requireRow(await repo.one(c,'ChiTietKeHoachSanXuat',{id:b.planLineId},{lock:true}));checkScope(req,line.workshop_id);
    const plan=requireRow(await repo.one(c,'KeHoachSanXuat',{id:line.plan_id},{lock:true}));expectState(plan,['DA_DUYET','DANG_THUC_HIEN']);
    if(kind==='materialRequests')await require('./material-release-gate').assertCanRequestMaterials(c,plan,req.principal);
    if(kind==='materialRequests')await exactMaterials(c,line.id,b.lines);
    const notes=kind==='materialRequests'?(b.notes??'').trim():null;
    if(notes&&notes.length>2000)fail(422,'NOTES_TOO_LONG','Ghi chú tối đa 2000 ký tự.');
    const id=await repo.insert(c,config.table,{code:(kind==='materialRequests'?'YCX-':'YCN-')+randomUUID(),plan_line_id:line.id,workshop_id:line.workshop_id,created_by_id:req.principal.accountId,...(kind==='materialRequests'?{notes:notes||null}:{})});
    // Lock source rows in numeric order. Repeated source IDs are rejected rather than silently merged.
    const inputs=[...b.lines].sort((a,b)=>BigInt(a.demandId||a.productLotId)<BigInt(b.demandId||b.productLotId)?-1:1),seen=new Set();
    for(const input of inputs){
      const key=input.demandId||input.productLotId;if(seen.has(key))fail(422,'DUPLICATE_SOURCE','Dòng nguồn bị lặp.');seen.add(key);
      if(kind==='materialRequests'){
        const demand=requireRow(await repo.one(c,'NhuCauNguyenLieuKHSX',{id:input.demandId,plan_line_id:line.id},{lock:true}));
        if(String(demand.material_id)!==input.materialId)fail(422,'MATERIAL_MISMATCH','Nguyên liệu không trùng nhu cầu.');
        const qty=d.positive(input.quantityBase),unit=requireRow(await repo.one(c,'DonViTinh',{id:demand.unit_id}));
        if(unit.discrete&&qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Đơn vị đếm phải là số nguyên.');
        if(d.parse(await repo.requested(c,kind,demand.id))+qty>d.parse(demand.qty_required))fail(409,'DEMAND_QUOTA_EXCEEDED','Tổng yêu cầu vượt nhu cầu định mức.');
        await repo.insert(c,config.lines,{request_id:id,demand_id:demand.id,material_id:demand.material_id,unit_id:demand.unit_id,qty_base:input.quantityBase});
      }else{
        const lot=requireRow(await repo.one(c,'LoThanhPham',{id:input.productLotId},{lock:true}));expectState(lot,['ACTIVE']);
        if(String(lot.product_id)!==String(line.product_id))fail(422,'PRODUCT_MISMATCH','Lô không thuộc SKU của kế hoạch.');
        const qty=d.positive(input.quantityCompletedBase);if(qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Sản lượng chai/lon phải nguyên.');
        if(d.parse(await repo.requested(c,kind,line.id))+qty>d.parse(line.qty_base))fail(409,'PRODUCTION_QUOTA_EXCEEDED','Lượng hoàn thành vượt sản lượng được duyệt.');
        await repo.insert(c,config.lines,{request_id:id,plan_line_id:line.id,product_lot_id:lot.id,qty_completed:input.quantityCompletedBase});
      }
    }
    const row=await repo.one(c,config.table,{id});await repo.audit(c,req.principal,kind+'.create',config.table,id,null,row,req.correlationId);return result(c,kind,row,req);
  },201);}
  async function submit(kind,req) {return context.write(req,kind+'.submit',async c=>{
    const config=definitions[kind],row=requireRow(await repo.one(c,config.table,{id:req.params.id},{lock:true}));checkScope(req,row.workshop_id);expectVersion(row,req.body.expectedVersion);expectState(row,['NHAP']);
    const line=requireRow(await repo.one(c,'ChiTietKeHoachSanXuat',{id:row.plan_line_id})),plan=requireRow(await repo.one(c,'KeHoachSanXuat',{id:line.plan_id},{lock:true}));expectState(plan,['DA_DUYET','DANG_THUC_HIEN']);
    if(kind==='materialRequests')await require('./material-release-gate').assertCanRequestMaterials(c,plan,req.principal);
    const lines=await repo.find(c,config.lines,{request_id:row.id});if(!lines.length)fail(409,'EMPTY_DOCUMENT','Chứng từ chưa có dòng.');
    if(kind==='materialRequests')await exactMaterials(c,line.id,lines);
    await repo.update(c,config.table,{id:row.id},{status:config.next,version:row.version+1,updated_at:now()});const after=await repo.one(c,config.table,{id:row.id});
    await repo.audit(c,req.principal,kind+'.submit',config.table,row.id,row,after,req.correlationId);return result(c,kind,after,req);
  });}
  return {list,read,create,submit};
}
module.exports={createRequestService};
