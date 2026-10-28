const fs=require('node:fs'),path=require('node:path');
for(const name of ['api_contract.yaml','runtime_api.json']){
 const file=path.resolve(__dirname,'../../docs',name),api=JSON.parse(fs.readFileSync(file,'utf8')),root=name==='runtime_api.json'?'/api/v1':'';
 const schema=api.components.schemas;
 schema.IssueAllocationInput.properties.assignment={type:'object',additionalProperties:false,required:['expectedVersion','staffIds'],properties:{expectedVersion:{$ref:'#/components/schemas/ExpectedVersion'},staffIds:{type:'array',minItems:1,maxItems:50,uniqueItems:true,items:{$ref:'#/components/schemas/Id'}}},description:'Tùy chọn cho yêu cầu MATERIAL mới: lưu phân công cùng transaction điều phối. Kho và phiếu là warehouseId/sourceId của chứng từ.'};
 schema.IssueAllocationInput.properties.lines.items.properties.quantity.pattern=String.raw`^[0-9]{1,14}(\.[0-9]{1,6})?$`;
 schema.MaterialAssignment.properties.materials.items.properties.materialId={$ref:'#/components/schemas/Id'};
 schema.MaterialAssignment.properties.materials.items.properties.unitId={$ref:'#/components/schemas/Id'};
 const operation=api.paths[root+'/material-assignments'].get;operation.parameters=operation.parameters.filter(p=>p.name!=='pending');operation.parameters.push({name:'pending',in:'query',required:false,schema:{type:'string',enum:['true']},description:'Chỉ đếm phiếu còn chờ điều phối/nhân viên xử lý.'});
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Unified material issue contract synchronized.');
