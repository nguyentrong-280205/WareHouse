const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),schemas=api.components.schemas;
 const root=file.endsWith('runtime_api.json')?'/api/v1':'';
 const update=structuredClone(schemas.PlanInput);
 update.required.push('expectedVersion');update.properties.expectedVersion={$ref:'#/components/schemas/ExpectedVersion'};
 schemas.PlanUpdateInput=update;
 const operation=structuredClone(api.paths[root+'/production-plans'].post);
 operation.operationId='plans.update';operation.summary='Sửa kế hoạch sản xuất chờ duyệt — UC02';
 operation.description='Chỉ CHO_DUYET, quyền plans.create, kiểm lại scope cũ/mới, version, quota đơn và lịch xưởng trong transaction. Không đổi đơn nguồn; có phụ thuộc thì chặn. Snapshot BOM mới bất biến, audit đầy đủ trước/sau. Không sửa phiếu đã duyệt; không thay tồn kho.';
 operation.parameters.unshift({name:'id',in:'path',required:true,schema:{$ref:'#/components/schemas/Id'}});
 operation.requestBody.content['application/json'].schema={$ref:'#/components/schemas/PlanUpdateInput'};
 operation.responses['200']=operation.responses['201'];delete operation.responses['201'];
 api.paths[root+'/production-plans/{id}'].put=operation;
 const result=schemas.PlanResult;
 result.properties.materialStatus={type:'string',enum:['THIEU_NGUYEN_VAT_LIEU','DU_NGUYEN_VAT_LIEU'],description:'Tình trạng cung ứng quan sát trong phạm vi kho tài khoản, tách khỏi trạng thái duyệt; không giữ hoặc trừ tồn.'};
 result.properties.materialObservedAt={type:'string',format:'date-time'};
 result.properties.materialShortages={type:'array',items:{type:'object',additionalProperties:false,required:['materialId','unitId','shortageBase'],properties:{materialId:{$ref:'#/components/schemas/Id'},materialName:{type:'string'},unitId:{$ref:'#/components/schemas/Id'},unitName:{type:'string'},shortageBase:{$ref:'#/components/schemas/Quantity'}}}};
 result.properties.lines.items.properties.sourceBomVersionId={$ref:'#/components/schemas/Id'};
 const context=api.paths[root+'/production-plans/order-context/{id}'].get;
 if(!context.parameters.some(p=>p.name==='editPlanId'))context.parameters.push({name:'editPlanId',in:'query',required:false,schema:{$ref:'#/components/schemas/Id'},description:'Kế hoạch CHO_DUYET cùng đơn, đầy đủ scope; loại chính kế hoạch này khỏi quota/năng lực khi mở form sửa.'});
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Pending plan update and material supply status contracts synchronized.');
