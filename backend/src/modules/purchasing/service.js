const {randomUUID}=require('node:crypto');
const repo=require('./repository'),productionRepo=require('../production/repository'),d=require('../../shared/decimal'),policy=require('../../shared/business-policy');
const {fail,requireRow,expectVersion,expectState,now}=require('../../shared/business-context');
function createPurchasingService(context){
  async function planSource(c,planId,principal){if(principal.customerId)fail(403,'FORBIDDEN','Chỉ tài khoản nội bộ có quyền mua hàng được xử lý yêu cầu.');return requireRow(await repo.one(c,'KeHoachSanXuat',{id:planId}));}
  async function result(c,row,principal){const plan=await planSource(c,row.plan_id,principal),supplier=requireRow(await repo.one(c,'NhaCungCap',{id:row.supplier_id}));return{notes:row.notes||null,planCode:plan.code,supplierName:supplier.name,supplierCode:supplier.code,id:String(row.id),code:row.code,version:row.version,status:row.status,planId:String(row.plan_id),supplierId:String(row.supplier_id),currency:'VND',...(row.total_amount===null?{}:{totalAmount:row.total_amount}),lines:(await repo.lines(c,row.id)).map(l=>({id:String(l.id),materialId:String(l.material_id),demandId:String(l.demand_id),quantity:l.qty_base,unitId:String(l.unit_id),unitPrice:l.unit_price,...(l.amount===null?{}:{amount:l.amount})}))};}
  async function list(req){return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.list(c,req.principal.accountId,{...req.query,page,pageSize});return{data:await Promise.all(rows.map(r=>result(c,r,req.principal))),meta:{page,pageSize,total}};});}
  async function read(req){return context.read(async c=>result(c,requireRow(await repo.one(c,'DonMuaNguyenLieu',{id:req.params.id})),req.principal));}
  async function validateDemand(c,line,planId,principal,claimed,req){
    const demand=requireRow(await repo.one(c,'NhuCauNguyenLieuKHSX',{id:line.demandId},{lock:true}));
    const planLine=requireRow(await repo.one(c,'ChiTietKeHoachSanXuat',{id:demand.plan_line_id,plan_id:planId}));
    if(String(demand.material_id)!==String(line.materialId)||String(demand.unit_id)!==String(line.unitId))fail(422,'DEMAND_MISMATCH','Vật tư/đơn vị không đúng nhu cầu nguồn.');
    const item=requireRow(await repo.one(c,'NguyenLieu',{id:line.materialId}));expectState(item,['ACTIVE']);
    if(String(item.base_unit_id)!==String(line.unitId))fail(422,'MATERIAL_BASE_UNIT_REQUIRED','Đơn mua phải sử dụng đúng đơn vị cơ sở đã cấu hình cho nguyên liệu.');
    const unit=requireRow(await repo.one(c,'DonViTinh',{id:line.unitId})),quantity=d.positive(line.quantity);d.parse(line.unitPrice);
    if(unit.discrete&&quantity%d.ten(6))fail(422,'DISCRETE_QUANTITY','Vật tư rời phải là số nguyên.');
    const usage=await productionRepo.demandUsage(c,demand.id);
    const gross=d.parse(demand.qty_required)-d.parse(usage.issued)-d.parse(usage.held);
    const required=gross>0n?gross:0n,free=await require('../production/forecast-repository').refresh(c,demand,principal,required,req),future=d.parse(await repo.openApproved(c,demand.id));
    const used=claimed.get(String(demand.id))||0n;
    if(quantity+used> (required>free+future?required-free-future:0n))fail(409,'PURCHASE_QUOTA_EXCEEDED','Lượng mua vượt nhu cầu còn thiếu sau tồn/PO được duyệt.');
    claimed.set(String(demand.id),used+quantity);
    return demand;
  }
  async function create(req){return context.write(req,'purchases.create',async c=>{
    await require('../production/forecast-repository').warehouses(c,req);
    const b=req.body,notes=b.notes?.trim()||null,plan=await planSource(c,b.planId,req.principal);if(notes&&notes.length>2000)fail(422,'NOTES_TOO_LONG','Ghi chú không được vượt 2000 ký tự.');expectState(plan,['DA_DUYET','DANG_THUC_HIEN']);
    const supplier=requireRow(await repo.one(c,'NhaCungCap',{id:b.supplierId},{lock:true}));expectState(supplier,['ACTIVE']);
    const id=await repo.insert(c,'DonMuaNguyenLieu',{code:'PO-'+randomUUID(),plan_id:plan.id,supplier_id:supplier.id,notes,created_by_id:req.principal.accountId}),claims=new Map();
    for(const line of [...b.lines].sort((a,b)=>BigInt(a.demandId)<BigInt(b.demandId)?-1:BigInt(a.demandId)>BigInt(b.demandId)?1:0)){
      if(!await require('./supplier-repository').supports(c,supplier.id,line.materialId,line.unitId))fail(422,'SUPPLIER_MATERIAL_UNSUPPORTED','Nhà cung cấp chưa có báo giá hiệu lực cho nguyên liệu và đơn vị này.');
      const demand=await validateDemand(c,line,plan.id,req.principal,claims,req);
      const lineId=await repo.insert(c,'ChiTietDonMuaNguyenLieu',{purchase_id:id,material_id:line.materialId,unit_id:line.unitId,qty_base:line.quantity,unit_price:line.unitPrice});
      await repo.insert(c,'PhanBoMuaChoNhuCau',{demand_id:demand.id,purchase_line_id:lineId,qty_base:line.quantity});
    }
    const after=await repo.one(c,'DonMuaNguyenLieu',{id});await repo.audit(c,req.principal,'purchases.create','DonMuaNguyenLieu',id,null,after,req.correlationId);return result(c,after,req.principal);
  },201);}
  async function submit(req){return context.write(req,'purchases.submit',async c=>{
    const row=requireRow(await repo.one(c,'DonMuaNguyenLieu',{id:req.params.id},{lock:true}));await planSource(c,row.plan_id,req.principal);expectVersion(row,req.body.expectedVersion);expectState(row,['NHAP']);
    const lines=await repo.lines(c,row.id);if(!lines.length)fail(422,'LINES_REQUIRED','Đơn mua chưa có chi tiết.');let total=0n;
    for(const line of lines){const amount=d.money(line.qty_base,line.unit_price);total+=BigInt(amount);await repo.update(c,'ChiTietDonMuaNguyenLieu',{id:line.id},{amount});}
    d.parse(total.toString(),0);await repo.update(c,'DonMuaNguyenLieu',{id:row.id},{total_amount:total.toString(),rounding_revision:policy.revision,status:'CHO_DUYET',version:row.version+1,updated_at:now()});
    const after=await repo.one(c,'DonMuaNguyenLieu',{id:row.id});await repo.audit(c,req.principal,'purchases.submit','DonMuaNguyenLieu',row.id,row,after,req.correlationId);return result(c,after,req.principal);
  });}
  async function decide(req){return context.write(req,'purchases.decide',async c=>{
    await require('../production/forecast-repository').warehouses(c,req);
    const row=requireRow(await repo.one(c,'DonMuaNguyenLieu',{id:req.params.id},{lock:true}));const plan=await planSource(c,row.plan_id,req.principal);expectState(plan,['DA_DUYET','DANG_THUC_HIEN']);expectVersion(row,req.body.expectedVersion);expectState(row,['CHO_DUYET']);
    if(String(row.created_by_id)===req.principal.accountId)fail(403,'MAKER_CHECKER','Không tự duyệt đơn do mình lập.');
    const approve=req.body.decision==='APPROVE';if(!approve&&!req.body.reason?.trim())fail(422,'REASON_REQUIRED','Từ chối phải có lý do.');
    if(approve){const claims=new Map();for(const line of (await repo.lines(c,row.id)).sort((a,b)=>BigInt(a.demand_id)<BigInt(b.demand_id)?-1:BigInt(a.demand_id)>BigInt(b.demand_id)?1:0))await validateDemand(c,{demandId:String(line.demand_id),materialId:String(line.material_id),unitId:String(line.unit_id),quantity:line.qty_base,unitPrice:line.unit_price},row.plan_id,req.principal,claims,req);}
    await repo.update(c,'DonMuaNguyenLieu',{id:row.id},{status:approve?'DA_DUYET':'TU_CHOI',approver_id:req.principal.accountId,decided_at:now(),rejection_reason:approve?null:req.body.reason,version:row.version+1,updated_at:now()});
    const after=await repo.one(c,'DonMuaNguyenLieu',{id:row.id});await repo.audit(c,req.principal,'purchases.decide','DonMuaNguyenLieu',row.id,row,after,req.correlationId);return result(c,after,req.principal);
  });}
  return{list,read,create,submit,decide};
}
module.exports={createPurchasingService};
