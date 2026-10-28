const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),schemas=api.components.schemas,root=file.endsWith('runtime_api.json')?'/api/v1':'';
 Object.assign(schemas.PlanResult.properties,{handoffTarget:{type:'string',nullable:true,enum:['PLANNING','PURCHASING','WORKSHOP']},handoffRecipientCount:{type:'integer',minimum:0},handoffBlocked:{type:'boolean'},rejectionReason:{type:'string',nullable:true,maxLength:1000}});
 for(const key of ['openPurchaseBase','purchaseRequiredBase'])schemas.PlanResult.properties.lines.items.properties.materialDemands.items.properties[key]={$ref:'#/components/schemas/Quantity'};
 const path=root+'/production-plans/receiving-queue';delete api.paths[path];
 const response={type:'object',properties:{data:{type:'array',items:{$ref:'#/components/schemas/PlanResult'}},meta:{type:'object',properties:{page:{type:'integer'},pageSize:{type:'integer'},total:{type:'integer'}}}}};
 const operation={operationId:'plans.queue',tags:['UC02','UC03','UC26'],summary:'Danh sách kế hoạch chuyển xử lý theo vai trò và phạm vi',description:'Nhu cầu phát sinh cùng transaction duyệt là nguồn yêu cầu mua; không tự tạo PO. Queue chỉ đọc theo scope hiện hành. Thiếu vật tư sang mua hàng, đủ chuyển xưởng, từ chối về lập kế hoạch. Không tăng scope; không có người nhận thì báo blocked.',
  'x-permissions':['plans.create','purchases.create','materialRequests.create'],
  parameters:[{name:'audience',in:'query',required:true,schema:{type:'string',enum:['PLANNING','PURCHASING','WORKSHOP']}},...['page','pageSize'].map(name=>({name,in:'query',schema:{type:'integer',minimum:1,maximum:name==='pageSize'?100:100000}}))],
  responses:{'200':{description:'Phiếu trong phạm vi của người nhận',content:{'application/json':{schema:response}}},'403':{description:'Không có quyền cho audience yêu cầu'}}
 };
 api.paths={[path]:{get:operation},...api.paths};
 api.paths[root+'/production-plans/{id}/decision'].post.description='Ban giám đốc có plans.decide, khác người lập/sửa cuối. APPROVE tạo nhu cầu và phân bổ tồn dự kiến, audit chuyển xử lý cùng transaction. Thiếu chuyển mua hàng, đủ chuyển xưởng. REJECT bắt buộc lý do 1–1000 ký tự sau trim, lưu và trả lại cho lập kế hoạch. Không thay tồn hoặc tự tạo PO; không có người nhận đủ scope thì báo blocked.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Plan handoff queues and rejection contract synchronized; no schema migration.');
