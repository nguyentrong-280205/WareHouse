const fs=require('node:fs');
const{definitions}=require('../src/modules/orders/draft-deletion');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const[kind,config]of Object.entries(definitions)){
  const path=(file.endsWith('runtime_api.json')?'/api/v1':'')+config.path+'/{id}';
  const existing=api.paths[path]||api.paths[config.path+'/{id}'];
  if(!existing)throw new Error('DOCUMENT_PATH_REQUIRED');
  const source=existing.put||api.paths[(file.endsWith('runtime_api.json')?'/api/v1':'')+config.path]?.post||api.paths[config.path]?.post;
  if(!source)throw new Error('DOCUMENT_OPERATION_REQUIRED');
  const op=JSON.parse(JSON.stringify(source));
  op.operationId=kind+'.deleteDraft';op.summary='Xóa bản nháp chưa có dữ liệu phụ thuộc';
  op.description='Chỉ NHAP; kiểm customer/workshop scope, expectedVersion, CSRF, RBAC, idempotency. Transaction xóa dòng sở hữu và header, giữ audit. Đã xác nhận hoặc có FK phụ thuộc trả409, không thay tồn.';
  op['x-permissions']=[config.permission];
  op.parameters=(existing.get?.parameters||source.parameters||[]).filter(p=>p.in!=='query');
  for(const p of source.parameters||[])if(p.in==='header'&&!op.parameters.some(x=>x.name===p.name))op.parameters.push(p);
  if(!op.parameters.some(p=>p.in==='path'&&p.name==='id'))op.parameters.push({name:'id',in:'path',required:true,schema:{$ref:'#/components/schemas/Id'}});
  op.requestBody={required:true,content:{'application/json':{schema:{type:'object',additionalProperties:false,required:['expectedVersion'],properties:{expectedVersion:{type:'integer',minimum:0}}}}}};
  op.responses={'200':{description:'Đã xóa bản nháp; audit được giữ lại',content:{'application/json':{schema:{type:'object',required:['id','deleted'],properties:{id:{$ref:'#/components/schemas/Id'},deleted:{type:'boolean'}}}}}},'409':{description:'Không phải bản nháp, phiên bản cũ hoặc đã có dữ liệu phụ thuộc'}};
  api.paths[path]??={};api.paths[path].delete=op;
 }
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Draft deletion contracts added for customer orders, purchases and workshop requests.');
