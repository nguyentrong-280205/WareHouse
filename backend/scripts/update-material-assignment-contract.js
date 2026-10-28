const fs=require('node:fs'),path=require('node:path');
const id={$ref:'#/components/schemas/Id'},text={type:'string'},array=items=>({type:'array',items}),object=properties=>({type:'object',properties,additionalProperties:false});
for(const name of ['api_contract.yaml','runtime_api.json']){
 const file=path.resolve(__dirname,'../../docs',name),api=JSON.parse(fs.readFileSync(file,'utf8')),root=name==='runtime_api.json'?'/api/v1':'';
 const schema=api.components.schemas;
 schema.MaterialAssignment=object({id,code:text,status:text,version:{type:'integer'},notes:{type:'string',nullable:true},planCode:text,productName:text,workshopName:text,warehouseId:{...id,nullable:true},canAssign:{type:'boolean'},staff:array(object({id,name:text})),materials:array(object({id,name:text,code:text,quantityBase:{$ref:'#/components/schemas/Quantity'},unitName:text}))});
 schema.MaterialAssignmentInput={...object({expectedVersion:{$ref:'#/components/schemas/ExpectedVersion'},warehouseId:id,staffIds:{...array(id),minItems:1,maxItems:50,uniqueItems:true}}),required:['expectedVersion','warehouseId','staffIds']};
 const response=s=>({'200':{description:'Thành công',content:{'application/json':{schema:s}}}});
 const parameters=[{name:'page',in:'query',schema:{type:'integer',minimum:1}},{name:'pageSize',in:'query',schema:{type:'integer',minimum:1,maximum:100}}];
 const get=(operationId,permissions,description,s,params=[])=>({operationId,summary:description,description,'x-uc':'UC15','x-permissions':permissions,parameters:params,responses:response(s)});
 api.paths[root+'/material-assignments']={get:get('materialAssignments.list',['issues.allocate','issues.postMaterial'],'Phiếu xưởng đã gửi: quản lý nhận theo scope, nhân viên chỉ nhận nhiệm vụ được giao.',object({data:array({$ref:'#/components/schemas/MaterialAssignment'}),meta:object({page:{type:'integer'},pageSize:{type:'integer'},total:{type:'integer'}})}),parameters)};
 api.paths[root+'/material-assignment-options']={get:get('materialAssignments.options',['issues.allocate'],'Kho và nhân viên đang hoạt động có quyền cấp nguyên liệu trong scope quản lý.',object({data:object({warehouses:array(object({id,code:text,name:text})),staff:array(object({id,name:text,warehouseId:id}))})}))};
 const headers=api.paths[root+'/material-requests/{id}/submit'].post.parameters.filter(p=>p.in==='header');
 api.paths[root+'/material-requests/{id}/assign']={post:{operationId:'materialAssignments.assign',summary:'Phân công nhân viên cấp nguyên liệu',description:'Chỉ DA_GUI và chưa điều phối xuất; giữ scope, version, gate duyệt mua và audit. Không cập nhật tồn/reservation.','x-uc':'UC15','x-permissions':['issues.allocate'],parameters:[{name:'id',in:'path',required:true,schema:id},...headers],requestBody:{required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/MaterialAssignmentInput'}}}},responses:response(object({data:{$ref:'#/components/schemas/MaterialAssignment'}}))}};
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Material employee assignment contract synchronized.');
