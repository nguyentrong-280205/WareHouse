const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),schemas=api.components.schemas,root=file.endsWith('runtime_api.json')?'/api/v1':'';
 const properties={id:{$ref:'#/components/schemas/Id'}};
 for(const name of ['materialId','unitId'])properties[name]={$ref:'#/components/schemas/Id'};
 for(const name of ['materialCode','materialName','unitName'])properties[name]={type:'string'};
 for(const name of ['shortageBase','openPurchaseBase','purchaseRequiredBase'])properties[name]={$ref:'#/components/schemas/Quantity'};
 schemas.PurchaseRequirementResult={type:'object',additionalProperties:false,required:['id','code','requestType','materialShortages','lines'],properties:{id:{$ref:'#/components/schemas/Id'},code:{type:'string'},requestType:{type:'string',enum:['MATERIAL_SHORTAGE']},materialShortages:structuredClone(schemas.PlanResult.properties.materialShortages),observedAt:{type:'string',format:'date-time'},lines:{type:'array',items:{type:'object',additionalProperties:false,properties:{materialDemands:{type:'array',items:{type:'object',additionalProperties:false,properties}}}}}}};
 const queue=api.paths[root+'/production-plans/receiving-queue'].get;
 queue.description='PURCHASING: tài khoản nội bộ có purchases.create nhận yêu cầu vật tư từ nhu cầu đã duyệt, không kiểm scope xưởng và không trả phân công/xưởng/công thức. Quyền và scope của PLANNING/WORKSHOP giữ nguyên. Chỉ đọc, không tự tạo PO.';
 queue.responses['200'].content['application/json'].schema.properties.data.items={oneOf:[{$ref:'#/components/schemas/PlanResult'},{$ref:'#/components/schemas/PurchaseRequirementResult'}]};
 api.paths[root+'/lookups/approved-plans'].get.description='Nguồn yêu cầu nguyên vật liệu thiếu đã được duyệt cho người có purchases.create; không phụ thuộc scope xưởng. Chỉ trả mã nguồn và nhu cầu vật tư, không phân công sản xuất.';
 for(const[path,item]of Object.entries(api.paths))if(path.startsWith(root+'/purchases'))for(const operation of Object.values(item))if(operation&&typeof operation==='object'&&operation.operationId)operation.description=(operation.description||'')+' Mua hàng độc lập phạm vi xưởng; giữ quyền hành động, nguồn nhu cầu, quota, scope kho, version/CSRF/idempotency và maker-checker.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Procurement requirements decoupled from workshop access; API labels synchronized.');
