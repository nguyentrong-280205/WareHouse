const {randomUUID}=require('node:crypto');
const repo=require('./repository'),d=require('../../shared/decimal'),policy=require('../../shared/business-policy');
const {fail,requireRow,expectVersion,expectState,now}=require('../../shared/business-context');
function createProductionService(context){
  function workshop(principal,id){if(!principal.workshopIds.includes(String(id)))fail(403,'WORKSHOP_SCOPE','Không được cấp phạm vi xưởng.');}
  async function result(c,row,principal){
    const allLines=await repo.find(c,'ChiTietKeHoachSanXuat',{plan_id:row.id}),scoped=require('./workshop-access').workshopReader(principal);
    const lines=scoped?allLines.filter(l=>principal.workshopIds.includes(String(l.workshop_id))):allLines;
    if(scoped&&!lines.length)fail(404,'NOT_FOUND','Kế hoạch không có phân công thuộc xưởng được cấp.');
    for(const l of lines)workshop(principal,l.workshop_id);
    const order=requireRow(await repo.one(c,'DonHang',{id:row.order_id}));
    const output=[];
    for(const l of lines){const demands=await repo.find(c,'NhuCauNguyenLieuKHSX',{plan_line_id:l.id}),metrics=[];for(const r of demands){
      const usage=await repo.demandUsage(c,r.id),gross=d.parse(r.qty_required)-d.parse(usage.issued)-d.parse(usage.held),remaining=gross>0n?gross:0n,free=await require('./forecast-repository').availableForDemand(c,r.id,r.material_id,principal),assigned=remaining<free?remaining:free;
      const material=requireRow(await repo.one(c,'NguyenLieu',{id:r.material_id})),unit=requireRow(await repo.one(c,'DonViTinh',{id:r.unit_id}));
      metrics.push({id:String(r.id),materialId:String(r.material_id),materialCode:material.code,materialName:material.name,unitId:String(r.unit_id),unitName:unit.name,requiredBase:r.qty_required,issuedBase:usage.issued,heldForDemandBase:usage.held,assignedFreeBase:d.format(assigned),shortageBase:d.format(remaining-assigned),assignedFreeSnapshotBase:r.snapshot_available,shortageSnapshotBase:r.shortage});
    }
    const bom=requireRow(await repo.one(c,'DinhMuc',{id:l.bom_version_id})),materials=[];
    for(const m of await repo.find(c,'ChiTietDinhMuc',{bom_id:bom.id})){const item=requireRow(await repo.one(c,'NguyenLieu',{id:m.material_id})),unit=requireRow(await repo.one(c,'DonViTinh',{id:m.unit_id}));materials.push({materialId:m.material_id,materialName:item.name,unitId:m.unit_id,unitName:unit.name,quantityBase:d.demand(l.qty_base,m.qty_per_output,bom.output_qty_base,!!unit.discrete)});}
    const source=requireRow(await repo.one(c,'ChiTietDonHang',{id:l.order_line_id,order_id:row.order_id})),product=requireRow(await repo.one(c,'ThanhPham',{id:l.product_id})),baseUnit=requireRow(await repo.one(c,'DonViTinh',{id:product.base_unit_id})),plant=requireRow(await repo.one(c,'XuongSanXuat',{id:l.workshop_id}));
    const sourceBom=bom.source_bom_id?requireRow(await repo.one(c,'DinhMuc',{id:bom.source_bom_id})):bom;
    output.push({id:String(l.id),orderLineId:String(l.order_line_id),orderLineNumber:String(source.line_no),productId:String(l.product_id),productCode:product.code,productName:product.name,baseUnitName:baseUnit.name,workshopId:String(l.workshop_id),workshopCode:plant.code,workshopName:plant.name,bomVersionId:String(l.bom_version_id),bomRevision:String(bom.revision),bomIsPlanOverride:!!bom.is_plan_override,sourceBomRevision:String(sourceBom.revision),sourceBomVersionId:String(bom.source_bom_id||bom.id),quantityBase:l.qty_base,startDate:l.start_date,endDate:l.end_date,materialDemands:metrics,materials});}
    const supplyLines=[];
    for(const source of allLines){
      const visible=output.find(l=>l.id===String(source.id));if(visible){supplyLines.push(visible);continue;}
      const materialDemands=[];
      for(const n of await repo.find(c,'NhuCauNguyenLieuKHSX',{plan_line_id:source.id})){const usage=await repo.demandUsage(c,n.id);materialDemands.push({materialId:String(n.material_id),unitId:String(n.unit_id),requiredBase:n.qty_required,issuedBase:usage.issued,heldForDemandBase:usage.held});}
      const materials=[];
      if(!materialDemands.length){const bom=requireRow(await repo.one(c,'DinhMuc',{id:source.bom_version_id}));for(const m of await repo.find(c,'ChiTietDinhMuc',{bom_id:bom.id})){const unit=requireRow(await repo.one(c,'DonViTinh',{id:m.unit_id}));materials.push({materialId:String(m.material_id),unitId:String(m.unit_id),quantityBase:d.demand(source.qty_base,m.qty_per_output,bom.output_qty_base,!!unit.discrete)});}}
      supplyLines.push({materialDemands,materials});
    }
    const observed=new Map();
    for(const line of supplyLines)for(const demand of line.materialDemands){
      if(!observed.has(demand.materialId))observed.set(demand.materialId,d.parse((await require('./forecast-repository').planningAvailability(c,demand.materialId,principal,row.id)).availableBase));
      const gross=d.parse(demand.requiredBase)-d.parse(demand.issuedBase)-d.parse(demand.heldForDemandBase),required=gross>0n?gross:0n,free=observed.get(demand.materialId),assigned=required<free?required:free;
      observed.set(demand.materialId,free-assigned);demand.assignedFreeBase=d.format(assigned);demand.shortageBase=d.format(required-assigned);
    }
    const supply=await require('./material-status').materialStatus(c,supplyLines,principal,row.id);
    const routing=await require('./handoff').handoff(c,row,supply,principal);
    if(scoped){const own=new Set(output.flatMap(l=>l.materials.map(m=>String(m.materialId))));supply.materialShortages=supply.materialShortages.filter(m=>own.has(String(m.materialId)));}
    return{...supply,...routing,workshopScoped:!!scoped,id:String(row.id),code:row.code,status:row.status,version:row.version,orderId:String(row.order_id),orderCode:order.code,startDate:row.start_date,endDate:row.end_date,lines:output};
  }
  async function list(req){return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.plans(c,req.principal,{...req.query,page,pageSize});const data=[];for(const row of rows)data.push(await result(c,row,req.principal));return{data,meta:{page,pageSize,total}};});}
  async function read(req){return context.read(async c=>result(c,requireRow(await repo.one(c,'KeHoachSanXuat',{id:req.params.id})),req.principal));}
  async function saveLines(c,req,b,id,orderId,ownedBoms=new Set()){
    const input=[...b.lines].sort((a,b)=>BigInt(a.orderLineId)<BigInt(b.orderLineId)?-1:BigInt(a.orderLineId)>BigInt(b.orderLineId)?1:0);
    for(const l of input){
      workshop(req.principal,l.workshopId);
      const source=requireRow(await repo.one(c,'ChiTietDonHang',{id:l.orderLineId,order_id:orderId},{lock:true}));
      if(String(source.product_id)!==l.productId)fail(422,'SOURCE_PRODUCT_MISMATCH','SKU không trùng dòng đơn hàng.');
      const qty=d.positive(l.quantityBase);if(qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Sản lượng chai/lon phải nguyên.');
      if(d.parse(await repo.planned(c,source.id))+qty>d.parse(source.qty_base))fail(409,'ORDER_QUOTA_EXCEEDED','Tổng KHSX vượt lượng đơn hàng còn hiệu lực.');
      if(l.startDate>l.endDate||l.startDate<b.startDate||l.endDate>b.endDate)fail(422,'LINE_SCHEDULE_INVALID','Lịch dòng phải nằm trong lịch KHSX.');
      const x=requireRow(await repo.one(c,'XuongSanXuat',{id:l.workshopId},{lock:true}));expectState(x,['ACTIVE']);
      let bom=requireRow(await repo.one(c,'DinhMuc',{id:l.bomVersionId,product_id:l.productId}));
      if(bom.is_plan_override){
        if(!ownedBoms.has(String(bom.id)))fail(422,'BOM_PRIVATE','Định mức riêng không thuộc kế hoạch chờ duyệt này.');
        if(!l.materials)fail(422,'PLAN_MATERIALS_REQUIRED','Cần gửi đầy đủ vật tư khi sửa định mức riêng của kế hoạch.');
        bom=requireRow(await repo.one(c,'DinhMuc',{id:bom.source_bom_id,product_id:l.productId}));
      }
      if(bom.effective_from>l.startDate||(bom.effective_to&&bom.effective_to<l.endDate))fail(409,'BOM_NOT_EFFECTIVE','Phiên bản định mức không hiệu lực trong lịch sản xuất.');
      bom=await require('./material-snapshot').snapshot(c,bom,l.productId,l.quantityBase,l.materials,req.principal.accountId);
      const lineId=await repo.insert(c,'ChiTietKeHoachSanXuat',{plan_id:id,order_line_id:source.id,product_id:l.productId,workshop_id:x.id,bom_version_id:bom.id,qty_base:l.quantityBase,start_date:l.startDate,end_date:l.endDate});
      let remaining=qty;
      for(const day of await repo.calendar(c,x.id,l.productId,l.startDate,l.endDate)){
        const free=d.parse(day.capacity_base)-d.parse(await repo.scheduled(c,day.id));
        const take=remaining<free?remaining:free;if(take<=0n)continue;
        if(take%d.ten(6))fail(409,'CAPACITY_CONFIGURATION_INVALID','Quota chai/lon của lịch xưởng phải nguyên.');
        await repo.insert(c,'PhanBoLichSanXuat',{plan_line_id:lineId,calendar_id:day.id,qty_base:d.format(take)});remaining-=take;if(!remaining)break;
      }
      if(remaining)fail(409,'WORKSHOP_CAPACITY_EXCEEDED','Lịch xưởng chưa cấu hình hoặc không đủ năng lực còn lại.');
    }
  }
  async function create(req){return context.write(req,'plans.create',async c=>{
    const b=req.body,order=requireRow(await repo.one(c,'DonHang',{id:b.orderId},{lock:true}));expectState(order,['XAC_NHAN','DANG_GIAO']);
    if(b.startDate>b.endDate)fail(422,'SCHEDULE_INVALID','Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
    const id=await repo.insert(c,'KeHoachSanXuat',{code:'KH-'+randomUUID(),order_id:order.id,start_date:b.startDate,end_date:b.endDate,created_by_id:req.principal.accountId});
    await saveLines(c,req,b,id,order.id);
    const after=await repo.one(c,'KeHoachSanXuat',{id});await repo.audit(c,req.principal,'plans.create','KeHoachSanXuat',id,null,after,req.correlationId);return result(c,after,req.principal);
  },201);}
  async function update(req){return context.write(req,'plans.update',async c=>{
    const b=req.body,initial=requireRow(await repo.one(c,'KeHoachSanXuat',{id:req.params.id}));
    const order=requireRow(await repo.one(c,'DonHang',{id:initial.order_id},{lock:true}));
    const row=requireRow(await repo.one(c,'KeHoachSanXuat',{id:req.params.id},{lock:true}));
    expectVersion(row,b.expectedVersion);expectState(row,['CHO_DUYET']);
    if(String(b.orderId)!==String(row.order_id))fail(422,'PLAN_ORDER_IMMUTABLE','Không được đổi đơn hàng nguồn của kế hoạch đã lưu.');
    expectState(order,['XAC_NHAN','DANG_GIAO']);
    if(b.startDate>b.endDate)fail(422,'SCHEDULE_INVALID','Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
    const oldLines=await repo.find(c,'ChiTietKeHoachSanXuat',{plan_id:row.id},{lock:true});
    for(const line of oldLines)workshop(req.principal,line.workshop_id);
    const before=await result(c,row,req.principal);
    await repo.clearPendingLines(c,row.id);
    await saveLines(c,req,b,row.id,order.id,new Set(oldLines.map(l=>String(l.bom_version_id))));
    await repo.update(c,'KeHoachSanXuat',{id:row.id},{start_date:b.startDate,end_date:b.endDate,version:Number(row.version)+1,updated_at:now()});
    const after=await result(c,requireRow(await repo.one(c,'KeHoachSanXuat',{id:row.id})),req.principal);
    await repo.audit(c,req.principal,'plans.update','KeHoachSanXuat',row.id,before,after,req.correlationId);
    return after;
  });}
  async function decide(req){return context.write(req,'plans.decide',async c=>{
    if(req.body.decision==='APPROVE')await require('./forecast-repository').warehouses(c,req);
    const row=requireRow(await repo.one(c,'KeHoachSanXuat',{id:req.params.id},{lock:true}));expectVersion(row,req.body.expectedVersion);expectState(row,['CHO_DUYET']);
    if(String(row.created_by_id)===req.principal.accountId)fail(403,'MAKER_CHECKER','Người lập không được tự duyệt.');
    if(String(await repo.lastEditor(c,row.id))===req.principal.accountId)fail(403,'MAKER_CHECKER','Người sửa cuối không được tự duyệt hoặc từ chối kế hoạch.');
    const approve=req.body.decision==='APPROVE';if(!approve&&!req.body.reason?.trim())fail(422,'REASON_REQUIRED','Từ chối phải có lý do.');
    if(!approve&&req.body.reason.trim().length>1000)fail(422,'REASON_TOO_LONG','Lý do từ chối không được vượt 1000 ký tự.');
    const lines=await repo.find(c,'ChiTietKeHoachSanXuat',{plan_id:row.id},{lock:true});
    for(const line of lines){workshop(req.principal,line.workshop_id);if(!approve)continue;
      const bom=requireRow(await repo.one(c,'DinhMuc',{id:line.bom_version_id}));
      const bomLines=await repo.find(c,'ChiTietDinhMuc',{bom_id:bom.id});if(!bomLines.length)fail(409,'BOM_EMPTY','Định mức chưa có nguyên liệu.');
      for(const material of bomLines){
        const item=requireRow(await repo.one(c,'NguyenLieu',{id:material.material_id}));expectState(item,['ACTIVE']);
        if(String(item.base_unit_id)!==String(material.unit_id))fail(409,'BOM_UNIT_INVALID','Định mức phải dùng đơn vị cơ sở của nguyên liệu.');
        const unit=requireRow(await repo.one(c,'DonViTinh',{id:item.base_unit_id}));
        const need=d.demand(line.qty_base,material.qty_per_output,bom.output_qty_base,!!unit.discrete);
        const required=d.parse(need),demandId=await repo.insert(c,'NhuCauNguyenLieuKHSX',{plan_line_id:line.id,bom_line_id:material.id,material_id:item.id,unit_id:unit.id,qty_required:need,snapshot_available:'0.000000',shortage:need,policy_revision:policy.revision});
        const use=await require('./forecast-repository').allocate(c,demandId,item.id,required,req.principal);
        await repo.update(c,'NhuCauNguyenLieuKHSX',{id:demandId},{snapshot_available:d.format(use),shortage:d.format(required-use)});
      }
    }
    await repo.update(c,'KeHoachSanXuat',{id:row.id},{status:approve?'DA_DUYET':'TU_CHOI',approver_id:req.principal.accountId,decided_at:now(),rejection_reason:approve?null:req.body.reason.trim(),version:row.version+1,updated_at:now()});
    const after=await repo.one(c,'KeHoachSanXuat',{id:row.id}),response=await result(c,after,req.principal);await repo.audit(c,req.principal,'plans.decide','KeHoachSanXuat',row.id,row,after,req.correlationId);await repo.audit(c,req.principal,'plans.handoff.'+response.handoffTarget.toLowerCase(),'KeHoachSanXuat',row.id,null,response,req.correlationId);return response;
  });}
  async function bomVersions(req){return context.read(async c=>{const rows=await repo.find(c,'DinhMuc',{product_id:req.params.id,is_plan_override:false});const data=[];for(const r of rows){const ls=await repo.find(c,'ChiTietDinhMuc',{bom_id:r.id});data.push({id:String(r.id),productId:String(r.product_id),revision:r.revision,effectiveFrom:r.effective_from+'T00:00:00+07:00',effectiveTo:r.effective_to?r.effective_to+'T23:59:59+07:00':null,outputQuantityBase:r.output_qty_base,lines:ls.map(l=>({id:String(l.id),materialId:String(l.material_id),unitId:String(l.unit_id),quantityPerOutputBase:l.qty_per_output}))});}return{data,meta:{page:1,pageSize:data.length||1,total:data.length}};});}
  async function queue(req){return context.read(async c=>{
    const audience=req.query.audience,permission={PLANNING:'plans.create',PURCHASING:'purchases.create',WORKSHOP:'materialRequests.create'}[audience];
    if(!permission||!req.principal.permissions.includes(permission))fail(403,'FORBIDDEN','Không có quyền nhận danh sách xử lý này.');
    const data=[];
    for(const row of await repo.queueCandidates(c,req.principal,audience)){
      if(audience==='PURCHASING'){
        if(req.principal.customerId)fail(403,'FORBIDDEN','Chỉ tài khoản nội bộ có quyền mua hàng được nhận yêu cầu.');
        const request=await require('../purchasing/request-source').requestSource(c,row,req.principal);
        if(request.materialShortages.length)data.push(request);continue;
      }
      const plan=await result(c,row,req.principal);if(plan.handoffTarget!==audience)continue;
      data.push(plan);
    }
    const page=req.query.page||1,pageSize=req.query.pageSize||20;return{data:data.slice((page-1)*pageSize,page*pageSize),meta:{page,pageSize,total:data.length}};
  });}
  async function materialDemands(req){const r=await read(req);return{data:r.lines.flatMap(l=>l.materialDemands)};}
  return{list,read,create,update,decide,queue,bomVersions,materialDemands,planningContext:req=>context.read(c=>require('./planning-context').planningContext(c,req))};
}
module.exports={createProductionService};
