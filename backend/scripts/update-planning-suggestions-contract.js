const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),schemas=api.components.schemas;
 const item={type:'object',additionalProperties:false,required:['materialId','unitId','quantityBase'],properties:{materialId:{$ref:'#/components/schemas/Id'},unitId:{$ref:'#/components/schemas/Id'},quantityBase:{$ref:'#/components/schemas/Quantity'}}};
 schemas.PlanInput.properties.lines.items.properties.materials={type:'array',minItems:1,maxItems:100,items:item,description:'Lượng tuyệt đối do người lập kế hoạch chọn; lưu snapshot riêng, không sửa BOM gợi ý.'};
 const resultItem=JSON.parse(JSON.stringify(item));Object.assign(resultItem.properties,{materialName:{type:'string'},unitName:{type:'string'}});
 schemas.PlanResult.properties.lines.items.properties.materials={type:'array',items:resultItem};
 const context=schemas.ProductionPlanningContext;
 context.properties.materials={type:'array',items:JSON.parse(JSON.stringify(context.properties.order.properties.lines.items.properties.boms.items.properties.materials.items)),description:'Danh mục vật tư hoạt động kèm tồn trong scope, để thêm vật tư ngoài gợi ý.'};
 context.properties.order.properties.lines.items.properties.workshops.items.properties.preferred={type:'boolean'};
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Editable plan-material snapshots and suggestion catalog added to contracts.');
