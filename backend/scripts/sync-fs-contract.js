const {readFileSync,writeFileSync}=require('node:fs');
const file='../docs/api_contract.yaml';
const api=JSON.parse(readFileSync(file,'utf8'));
api.components.schemas.LoginInput.properties.password.minLength=6;
api.components.schemas.LoginInput.properties.password.description='Thông thường 12–128 ký tự. Ngoại lệ demo local đã duyệt: 6–128 chỉ cho chín username trong auth/simple-demo.js khi AUTH_ALLOW_SIMPLE_DEMO=true, code tài khoản phải khớp LOCAL_SIMPLE_*. Các tài khoản khác vẫn tối thiểu12.';
const ref=name=>({$ref:'#/components/schemas/'+name});
const id=ref('Id'), quantity=ref('Quantity');
const price={type:'object',additionalProperties:false,required:['unitId','unitPrice'],properties:{unitId:id,unitPrice:ref('UnitPrice')}};
for(const name of ['ProductInput','ProductInputUpdate','ProductResult'])api.components.schemas[name].properties.salesPrices={type:'array',minItems:1,items:price};
if(!api.components.schemas.ProductInput.required.includes('salesPrices'))api.components.schemas.ProductInput.required.push('salesPrices');
for(const name of ['ProductInputUpdate','ProductResult'])api.components.schemas[name].properties.packaging.items.properties.unitsPerPack=ref('ConversionFactor');
api.components.schemas.ProductResult.properties.packaging.items.properties.id={...id,readOnly:true};
api.components.schemas.ProductResult.properties.packaging.items.properties.unitId={...id,readOnly:true};
api.components.schemas.ProductResult.properties.salesPrices.items={...price,properties:{...price.properties,id,revision:{type:'integer',minimum:1},effectiveAt:{type:'string',format:'date-time'}}};
api.components.schemas.MoneyVND.description='VND DECIMAL(20,0). FS01 DA_XAC_NHAN: HALF_UP mỗi dòng khi xác nhận, tổng bằng tổng dòng đã chốt, không round trung gian.';
api.components.schemas.CapacityAmount={type:'string',pattern:'^[0-9]+(\\.[0-9]{1,15})?$',description:'Giá trị chiếm chỗ tính chính xác qty6 × factor9; read-only, không round trung gian.'};
api.components.schemas.PlanResult.properties.startDate={type:'string',format:'date'};
api.components.schemas.PlanResult.properties.endDate={type:'string',format:'date'};
for(const path of ['/production-plans','/production-plans/{id}'])api.paths[path].get['x-permissions']=['plans.read','plans.decide'];
for(const path of ['/purchases','/purchases/{id}'])api.paths[path].get['x-permissions']=['purchases.read','purchases.decide'];
for(const f of ['occupiedCapacity','heldCapacity','remainingCapacity'])api.components.schemas.LocationResult.properties[f]=ref('CapacityAmount');
for(const item of Object.values(api.paths))for(const op of Object.values(item))if(op.operationId){
  if(op['x-approval-status']==='CHUA_DUYET')op['x-approval-status']='DA_XAC_NHAN_FS_20261015';
  op['x-fs-policy-revision']='FS-20261015';
}
const methods=[['/deliveries/{id}/confirm',['deliveries.confirm']],['/return-requests',['returnRequests.create']],['/return-receptions',['returnReceptions.post']],['/dispositions/{id}/decision',['dispositions.decide']],['/stocktakes',['stocktakes.create']],['/stocktakes/{id}/cutoff',['stocktakes.create']],['/stocktakes/{id}/cancel',['stocktakes.cancel']],['/stocktakes/{id}/renew-locks',['stocktakes.renew']],['/issues/{id}/renew-reservations',['reservations.renew']]];
for(const[path,permissions]of methods)api.paths[path].post['x-permissions']=permissions;
const schemaObject=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,required,properties});
const parameters=[{name:'X-CSRF-Token',in:'header',required:true,schema:{type:'string',minLength:1}},{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:1,maxLength:128}}];
function add(path,method,operationId,uc,permissions,input,result='LookupListResult'){
  api.paths[path]??={};
  api.paths[path][method]={operationId,summary:operationId,'x-uc':uc,'x-permissions':permissions,'x-approval-status':'DA_XAC_NHAN_FS_20261015',security:[{sessionCookie:[]}],parameters:[...Array.from(path.matchAll(/\{(\w+)\}/g),m=>({name:m[1],in:'path',required:true,schema:id})),...(method==='get'?[]:parameters)],responses:{[method==='post'&&/\.create$/.test(operationId)?'201':'200']:{description:'Kết quả thực tế từ MySQL',content:{'application/json':{schema:ref(result)}}},'401':{description:'Chưa đăng nhập'},'403':{description:'Sai quyền/phạm vi'},'409':{description:'Xung đột trạng thái/quota/version'},'422':{description:'Dữ liệu không hợp lệ'}}};
  if(input)api.paths[path][method].requestBody={required:true,content:{'application/json':{schema:ref(input)}}};
}
api.components.schemas.LookupRow={type:'object',properties:{id,code:{type:'string'},name:{type:'string'}}};
api.components.schemas.LookupListResult={type:'object',required:['data'],properties:{data:{type:'array',items:ref('LookupRow')}}};
add('/lookups/units','get','lookups.units','UC10',['materials.read','products.write','warehouses.write','materialLots.write','productLots.write','orders.create','purchases.create','stocktakes.count']);
add('/lookups/products','get','lookups.products','UC11',['orders.create','plans.create','productRequests.create']);
add('/lookups/materials','get','lookups.materials','UC26',['purchases.create','materialRequests.create','plans.create']);
add('/lookups/workshops','get','lookups.workshops','UC02',['plans.create']);
add('/lookups/suppliers','get','lookups.suppliers','UC26',['purchases.create']);
add('/lookups/orders','get','lookups.orders','UC02',['plans.create']);
add('/lookups/plan-lines','get','lookups.planLines','UC22',['materialRequests.create','productRequests.create']);
for(const[kind,uc,input,output]of [['materials','UC10','MaterialInput','MaterialResult'],['products','UC25','ProductInput','ProductResult'],['warehouses','UC19','WarehouseInput','WarehouseResult'],['material-lots','UC30','LotInput','MaterialLotResult'],['product-lots','UC20','LotInput','ProductLotResult']]){
  const family=kind==='material-lots'?'materialLots':kind==='product-lots'?'productLots':kind;
  add('/'+kind+'/{id}','get',family+'.read',uc,[family+'.read'],null,output);
}
api.components.schemas.SourceDeliveryInput=schemaObject({warehouseId:id,lines:{type:'array',minItems:1,items:schemaObject({purchaseLineId:id,lotId:id,quantityReceivedBase:quantity})}});
add('/purchases/{id}/deliveries','post','materialDeliveries.create','UC29',['receipts.postMaterial'],'SourceDeliveryInput');
api.components.schemas.WarningRuleInput=schemaObject({warehouseId:id,itemKind:{type:'string',enum:['MATERIAL','PRODUCT']},itemId:id,lowStockBase:{type:'string',pattern:'^[0-9]+(\\.[0-9]{1,6})?$'},nearExpiryDays:{type:'integer',minimum:0},slowMovingDays:{type:'integer',minimum:1},expectedVersion:{type:'integer',minimum:0}});
add('/reports/alert-rules','get','reports.alertRules','UC05',['reports.read']);
add('/reports/alert-rules','post','reports.configureAlert','UC05',['reports.configureAlerts'],'WarningRuleInput');
for(const[path,family,uc,permissions]of [['deliveries','deliveries','UC12',['deliveries.confirm']],['return-requests','returnRequests','UC14',['returnRequests.create','returnQc.read','returnReceptions.post']],['return-receptions','returnReceptions','UC14',['returnReceptions.post','returnQc.read']],['dispositions','dispositions','UC18',['dispositions.create','dispositions.decide','dispositions.execute']],['stocktakes','stocktakes','UC07',['stocktakes.create','stocktakes.count','stocktakes.confirm','variances.verify','adjustments.decide']]]){
 add('/'+path,'get',family+'.list',uc,permissions);
 add('/'+path+'/{id}','get',family+'.read',uc,permissions);
}
api['x-approved-policies']={date:'2026-10-15',ids:Array.from({length:12},(_,i)=>'FS'+String(i+1).padStart(2,'0')),source:'full_system_policy_approval.md'};
// FS09/FS10/FS12 source operations are part of the existing UCs, not new use cases.
const schemas=api.components.schemas;
schemas.QcInput.required=['lines'];
schemas.QcInput.properties.reworkBatchId=id;
schemas.QcInput.description='FS10: chọn đúng một sourceId hoặc reworkBatchId. Mỗi đợt tái xử lý có quota mới, không sửa hoặc tái dùng quota QC gốc. Confirm khóa aggregate nguồn và kiểm tổng inspected.';
api.paths['/qc/returns'].post.requestBody.content['application/json'].schema=ref('QcInput');
for(const name of ['ReceiptAllocationInput','ReceiptAllocationInputUpdate']){
 schemas[name].properties.kind.enum=['MATERIAL','FINISHED','RETURN','REJECTED'];
 schemas[name].properties.sourceQcType={type:'string',enum:['MATERIAL','PRODUCT','RETURN'],description:'Bắt buộc khi kind=REJECTED; các loại còn lại không truyền.'};
}
for(const name of ['IssueAllocationInput','IssueAllocationInputUpdate']){
 schemas[name].properties.lines.items.properties.packagingVersionId=id;
 delete schemas[name].properties.fefoExceptionApprovalId;
}
schemas.DispositionInput.properties.balanceId={...id,description:'Tồn FAILED vật lý đúng lô; nếu chưa tiếp nhận phải nhập hàng lỗi bằng chứng từ trước execute.'};
schemas.DispositionExecuteInput=schemaObject({expectedVersion:ref('ExpectedVersion'),balanceId:id},['expectedVersion']);
api.paths['/dispositions/{id}/execute'].post.requestBody.content['application/json'].schema=ref('DispositionExecuteInput');
schemas.StocktakeInput.description='FS07: FROZEN_SCOPE; lease 60 phút, gia hạn thủ công mỗi lần tối đa 60 phút, hard limit 240 phút từ cutoff. Hết hạn/hủy vô hiệu đề nghị trước unlock.';
schemas.CountInput.properties.lines.minItems=0;
schemas.ReturnReceptionInput.description='FS08/FS09: tiếp nhận lô đã xác minh vào QUARANTINE, quota theo giao thành công/yêu cầu trả. Hàng chưa rõ lô dùng unknown-returns và xác minh riêng; không cộng vật lý hai lần.';
schemas.EvidenceInput=schemaObject({warehouseId:id,stocktakeId:id,issueId:id,fileName:{type:'string',minLength:1,maxLength:255},mediaType:{type:'string',enum:['image/png','image/jpeg','application/pdf']},contentBase64:{type:'string',minLength:4,maxLength:87384}},['warehouseId','fileName','mediaType','contentBase64']);
schemas.EvidenceResult=schemaObject({id,fileName:{type:'string'},checksum:{type:'string'},mediaType:{type:'string'},byteSize:{type:'string'}});
add('/evidence','post','evidence.create','UC07',['stocktakes.count','variances.verify','deliveries.confirm','unknownReturns.resolve'],'EvidenceInput','EvidenceResult');
add('/evidence/{id}','get','evidence.read','UC07',['stocktakes.count','variances.verify','deliveries.confirm','unknownReturns.resolve']);
api.paths['/evidence/{id}'].get.responses['200']={description:'Bằng chứng tải xuống, kiểm checksum và phạm vi kho',content:{'application/octet-stream':{schema:{type:'string',format:'binary'}}}};
api.paths['/evidence/{id}'].get['x-permissions'].push('adjustments.decide');
schemas.UnknownReturnInput=schemaObject({warehouseId:id,locationId:id,productId:id,reportedLotCode:{type:'string',minLength:1,maxLength:100},quantity,unitId:id,occupiedCapacity:ref('CapacityAmount'),reason:{type:'string',minLength:1,maxLength:1000}},['warehouseId','locationId','reportedLotCode','quantity','unitId','occupiedCapacity','reason']);
schemas.UnknownReturnResolveInput=schemaObject({expectedVersion:ref('ExpectedVersion'),expectedReturnRequestVersion:ref('ExpectedVersion'),returnLineId:id,productLotId:id,packagingVersionId:id,evidenceIds:{type:'array',minItems:1,items:id}},['expectedVersion','expectedReturnRequestVersion','returnLineId','productLotId','evidenceIds']);
add('/unknown-returns','get','unknownReturns.list','UC14',['returnReceptions.post','unknownReturns.resolve']);
add('/unknown-returns/{id}','get','unknownReturns.read','UC14',['returnReceptions.post','unknownReturns.resolve']);
add('/unknown-returns','post','unknownReturns.create','UC14',['returnReceptions.post'],'UnknownReturnInput');
add('/unknown-returns/{id}/resolve','post','unknownReturns.resolve','UC14',['unknownReturns.resolve'],'UnknownReturnResolveInput');
add('/receipts/{id}/post-rejected','post','receipts.postRejected','UC18',['dispositions.execute'],'PostInput','DocumentResult');
// Read helpers expose only source data in the actor's existing warehouse/workshop/customer scope.
for(const[name,uc,grants]of [
 ['material-deliveries','UC29',['materialQc.read','materialQc.write','receipts.allocate']],
 ['qc-sources','UC04',['materialQc.write','productQc.write','returnQc.write']],
 ['allocation-sources','UC13',['receipts.allocate','issues.allocate']],
 ['rework-batches','UC18',['materialQc.read','productQc.read','returnQc.read','materialQc.write','productQc.write','returnQc.write','dispositions.create']],
 ['count-members','UC07',['stocktakes.create']],
 ['approved-plans','UC26',['purchases.create']],
 ['warehouses','UC19',['receipts.allocate','receipts.postMaterial','receipts.postProduct','receipts.postReturn','issues.allocate','issues.postMaterial','issues.postSale','stocktakes.create','returnReceptions.post','unknownReturns.resolve','reports.read','reports.configureAlerts','inventory.search']],
 ['product-lots','UC24',['productRequests.create','productLots.write']],
 ['count-lots','UC07',['stocktakes.count']],
 ['material-lots','UC29',['receipts.postMaterial']],
 ['alert-items','UC05',['reports.configureAlerts']],
 ['approved-purchases','UC29',['receipts.postMaterial']],
])add('/lookups/'+name,'get','lookups.'+name,uc,grants);
schemas.MaterialDeliveryRegisterInput={...schemas.SourceDeliveryInput,required:['purchaseId',...schemas.SourceDeliveryInput.required],properties:{purchaseId:id,...schemas.SourceDeliveryInput.properties}};
schemas.LocationUpdate=schemaObject({...schemas.LocationInput.properties,status:{type:'string',enum:['ACTIVE','LOCKED']},expectedVersion:ref('ExpectedVersion')},['expectedVersion']);
for(const name of ['MaterialInputUpdate','ProductInputUpdate','WarehouseInputUpdate','LotInputUpdate'])if(schemas[name])schemas[name].properties.status={type:'string',enum:['ACTIVE','LOCKED']};
add('/warehouses/{id}/locations/{locationId}','put','warehouses.updateLocation','UC19',['warehouses.write'],'LocationUpdate','LocationResult');
add('/material-deliveries','get','materialDeliveries.list','UC29',['receipts.postMaterial','materialQc.read','receipts.allocate']);
add('/material-deliveries/{id}','get','materialDeliveries.read','UC29',['receipts.postMaterial','materialQc.read','receipts.allocate']);
add('/material-deliveries','post','materialDeliveries.register','UC29',['receipts.postMaterial'],'MaterialDeliveryRegisterInput');
api.paths['/return-requests'].get['x-permissions'].push('unknownReturns.resolve');
api.paths['/return-requests/{id}'].get['x-permissions'].push('unknownReturns.resolve');
api.paths['/lookups/products'].get['x-permissions'].push('returnReceptions.post');
for(const p of ['/deliveries','/deliveries/{id}'])api.paths[p].get['x-permissions']=['deliveries.confirm','returnRequests.create'];
for(const p of ['/lookups/units'])api.paths[p].get['x-permissions']=[...new Set([...api.paths[p].get['x-permissions'],'materialQc.write','productQc.write','returnQc.write','receipts.allocate','issues.allocate','returnReceptions.post','unknownReturns.resolve'])];
api.paths['/lookups/units'].get['x-permissions'].push('reports.read');
for(const p of ['/inventory','/inventory/ledger']){
 const op=api.paths[p].get;op.parameters=op.parameters.filter(p=>!['from','to'].includes(p.name)||p.in!=='query');
 if(p==='/inventory'){
  for(const[name,schema]of [['locationId',id],['lotKind',{type:'string',enum:['MATERIAL','PRODUCT']}],['qualityBucket',{type:'string',enum:['DAT','QUARANTINE','FAILED','EXPIRED']}]])if(!op.parameters.some(p=>p.name===name))op.parameters.push({name,in:'query',schema});
 }else for(const name of ['from','to'])op.parameters.push({name,in:'query',schema:{type:'string',format:'date'}});
}
const pagination=[{name:'page',in:'query',schema:{type:'integer',minimum:1}},{name:'pageSize',in:'query',schema:{type:'integer',minimum:1,maximum:100}},{name:'status',in:'query',schema:{type:'string',minLength:1}}];
// Response DTOs reflect source handlers; input schemas are kept independent.
const text={type:'string'},version=ref('ExpectedVersion'),nullableId={...id,nullable:true},array=items=>({type:'array',items});
schemas.SignedQuantity={type:'string',pattern:'^-?[0-9]{1,14}(\\.[0-9]{1,6})?$'};
Object.assign(schemas.QcResult.properties.lines.items.properties,{quantityInspectedBase:quantity,rejectionReason:text,condition:text});
schemas.DocumentResult.properties={...schemas.DocumentResult.properties,kind:{type:'string',enum:['MATERIAL','FINISHED','RETURN','REJECTED','SALE']},warehouseId:id,sourceQcType:{type:'string',enum:['MATERIAL','PRODUCT','RETURN'],nullable:true},expiresAt:{type:'string',format:'date-time',nullable:true},capacitySnapshot:{type:'object',nullable:true},postedAt:{type:'string',format:'date-time',nullable:true}};
Object.assign(schemas.DocumentResult.properties.lines.items.properties,{sourceLineId:id,qcLineId:id,unitId:id,packagingVersionId:id,quantity});
schemas.QcResult.required=schemas.QcResult.required.filter(k=>k!=='sourceId');schemas.QcResult.properties.reworkBatchId=id;
for(const k of ['rejectionReason','condition'])if(schemas.QcResult.properties.lines.items.properties[k])schemas.QcResult.properties.lines.items.properties[k].nullable=true;
schemas.ReturnQcResult=JSON.parse(JSON.stringify(schemas.QcResult));
for(const name of ['PurchaseResult','MaterialRequestResult','ProductRequestResult']){
 schemas[name].properties.code=text;
 if(name!=='PurchaseResult')schemas[name].properties.workshopId=id;
 schemas[name].properties.lines.items.properties.id=id;
 if(name==='MaterialRequestResult')schemas[name].properties.lines.items.properties.unitId=id;
}
const snapshot=schemaObject({id,stocktakeId:id,scopeGeneration:version,balanceId:id,locationId:id,qtySystem:quantity,qtyReserved:quantity,materialLotId:nullableId,productLotId:nullableId,qualityBucket:text});
const count=schemaObject({id,stocktakeId:id,scopeGeneration:version,sequence:{type:'integer'},counterId:id,status:text,version,submittedAt:{type:'string',format:'date-time',nullable:true},createdAt:{type:'string',format:'date-time'}});
count.properties.emptyLocationIds=array(id);count.properties.lines=array({type:'object'});
const variance={type:'object',properties:{id,stocktakeId:id,scopeGeneration:version,acceptedCountId:id,locationId:id,materialLotId:nullableId,productLotId:nullableId,qualityBucket:text,qtySystem:quantity,qtyCounted:quantity,delta:ref('SignedQuantity'),version,status:text}};
Object.assign(schemas.StocktakeResult.properties,{mode:text,cutoffAt:{type:'string',format:'date-time',nullable:true},locations:array(schemaObject({id,stocktakeId:id,locationId:id})),members:array(id),snapshots:array(snapshot),counts:array(count),variances:array(variance),adjustments:array({type:'object'})});
schemas.StocktakeResult.properties.verifications=array({type:'object'});
schemas.CountSaveResult=schemaObject({id,version,status:text,round:{type:'integer'},stocktakeVersion:version});
schemas.VerificationSaveResult=schemaObject({id,verificationId:id,proposalId:id,status:text,version},['id','verificationId','status','version']);
schemas.AdjustmentSaveResult=schemaObject({id,status:text,version});
for(const[path,name]of [['/stocktakes/{id}/counts','CountSaveResult'],['/stocktake-variances/{id}/verify','VerificationSaveResult'],['/adjustments/{id}/decision','AdjustmentSaveResult']]){
 const op=api.paths[path].post;op.responses[path.endsWith('/counts')?'201':'200']={description:'Kết quả đã commit',content:{'application/json':{schema:ref(name)}}};
 if(path.endsWith('/counts'))delete op.responses['200'];
}
schemas.DispositionResult.properties.balanceId=id;schemas.DispositionResult.properties.reworkBatches=array(schemaObject({id,quantityProcessedBase:quantity,status:text,lotId:id}));
schemas.MaterialDeliveryResult=schemaObject({id,code:text,purchaseId:id,warehouseId:id,status:text,version,lines:array(schemaObject({id,purchaseLineId:id,lotId:id,quantityReceivedBase:quantity}))});
schemas.DeliveryResult=schemaObject({id,orderId:id,issueId:id,warehouseId:id,version,lines:array(schemaObject({id,issueLineId:id,productLotId:id,quantityDispatchedBase:quantity,quantityDeliveredBase:quantity,lastDeliveredAt:{type:'string',nullable:true}}))});
schemas.ReturnRequestResult=schemaObject({id,code:text,orderId:id,version,status:text,reason:text,lines:array(schemaObject({id,originalDeliveryLineId:id,originalIssueLineId:id,originalIssueId:id,originalWarehouseId:id,productLotId:id,quantityBase:quantity}))});
schemas.ReturnReceptionResult=schemaObject({id,returnRequestId:id,warehouseId:id,status:text,version,lines:array(schemaObject({id,returnLineId:id,locationId:id,productLotId:id,quantityBase:quantity,unitId:id}))});
schemas.UnknownReturnResult=schemaObject({id,warehouseId:id,locationId:id,reportedLotCode:text,productId:id,quantity,unitId:id,occupiedCapacity:ref('CapacityAmount'),reason:text,status:text,version,resolvedReceptionLineId:id},['id','warehouseId','locationId','reportedLotCode','quantity','unitId','occupiedCapacity','reason','status','version']);
schemas.AlertRuleResult={type:'object',properties:{id,warehouseId:id,materialId:nullableId,productId:nullableId,revision:{type:'integer'},lowStockBase:quantity,nearExpiryDays:{type:'integer'},slowMovingDays:{type:'integer'}}};
const familyResult={materialDeliveries:'MaterialDeliveryResult',deliveries:'DeliveryResult',returnRequests:'ReturnRequestResult',returnReceptions:'ReturnReceptionResult',unknownReturns:'UnknownReturnResult',dispositions:'DispositionResult'};
for(const item of Object.values(api.paths))for(const op of Object.values(item))if(op.operationId){
 const[family,action]=op.operationId.split('.');if(familyResult[family]){const response=action==='list'?schemaObject({data:array(ref(familyResult[family])),meta:{type:'object'}}):ref(familyResult[family]);for(const[status,r]of Object.entries(op.responses))if(Number(status)>=200&&Number(status)<300)r.content={'application/json':{schema:response}};}
 if(op.operationId==='reports.configureAlert')op.responses={'201':{description:'Phiên bản cấu hình đã tạo',content:{'application/json':{schema:ref('AlertRuleResult')}}},'409':{description:'Phiên bản cũ'}};
}
for(const path of ['/receipts','/issues'])if(!api.paths[path].get.parameters.some(p=>p.name==='kind'))api.paths[path].get.parameters.push({name:'kind',in:'query',schema:{type:'string',enum:path==='/receipts'?['MATERIAL','FINISHED','RETURN','REJECTED']:['MATERIAL','SALE']}});
for(const item of Object.values(api.paths))for(const op of Object.values(item))if(op.operationId&&(/\.list$/.test(op.operationId)||op.operationId==='reports.alertRules')){
 for(const param of pagination)if(!op.parameters.some(p=>p.name===param.name))op.parameters.push(param);
}
// Do not advertise generic filters that a repository silently ignores.
const supportedQueries={
 'materials.list':['page','pageSize','q','status'],'products.list':['page','pageSize','q','status'],'warehouses.list':['page','pageSize','q','status'],
 'materialLots.list':['page','pageSize','q','status','itemId'],'productLots.list':['page','pageSize','q','status','itemId'],
 'orders.list':['page','pageSize','q','status'],'plans.list':['page','pageSize','status'],'purchases.list':['page','pageSize','status'],
 'materialRequests.list':['page','pageSize','status'],'productRequests.list':['page','pageSize','status'],
 'materialQc.list':['page','pageSize','status'],'productQc.list':['page','pageSize','status'],'returnQc.list':['page','pageSize','status'],
 'receipts.list':['page','pageSize','status','kind','warehouseId'],'issues.list':['page','pageSize','status','kind','warehouseId'],
 'inventory.ledger':['page','pageSize','warehouseId','lotId','itemId','status','from','to'],
 'reports.inventory':['page','pageSize','warehouseId','lotId','itemId','status','from','to'],
 'reports.movements':['page','pageSize','warehouseId','lotId','itemId','status','from','to'],
 'reports.expiry':['page','pageSize','warehouseId','itemId','from','to'],
 'reports.stocktake-variances':['page','pageSize','warehouseId','locationId','itemId','lotId','status','from','to'],
 'reports.alerts':['page','pageSize','warehouseId'],'reports.alertRules':['warehouseId'],
 'deliveries.list':['page','pageSize'],'locations.list':[],'bomVersions.list':[],
};
for(const item of Object.values(api.paths))for(const op of Object.values(item))if(supportedQueries[op.operationId]){
 const names=supportedQueries[op.operationId];op.parameters=op.parameters.filter(p=>p.in!=='query'||names.includes(p.name));
 for(const name of names)if(!op.parameters.some(p=>p.in==='query'&&p.name===name))op.parameters.push({name,in:'query',schema:name.endsWith('Id')?id:['from','to'].includes(name)?{type:'string',format:'date'}:{type:'string'}});
}
schemas.ReservationResult=schemaObject({id,issueId:id,issueLineId:id,balanceId:id,demandId:nullableId,allocationVersion:version,quantityInitialBase:quantity,quantityConsumedBase:quantity,quantityReleasedBase:quantity,quantityRemainingBase:quantity,status:text,expiresAt:{type:'string',format:'date-time'}});
schemas.InventoryResult.properties.data.items=schemaObject({id,lotKind:text,lotId:id,lotCode:text,itemId:id,itemCode:text,itemName:text,warehouseId:id,locationId:id,qualityBucket:text,onHand:quantity,reserved:quantity,available:quantity,unitId:id,expiresOn:{type:'string',format:'date',nullable:true},version:text});
schemas.InventoryPeriodResult=schemaObject({data:array(schemaObject({warehouseId:id,lotKind:text,itemKind:text,itemId:id,unitId:id,qualityBucket:text,from:{type:'string',format:'date'},to:{type:'string',format:'date'},openingBase:ref('SignedQuantity'),increasesBase:quantity,decreasesBase:quantity,closingBase:ref('SignedQuantity')})),meta:{type:'object'}});
schemas.InventorySummaryResult=schemaObject({data:array(schemaObject({warehouseId:id,itemKind:text,itemId:id,unitId:id,qualityBucket:text,onHand:quantity,reserved:quantity,available:quantity})),meta:{type:'object'}});
api.paths['/reports/inventory'].get.description='Không có from/to: tồn hiện tại và reservation còn hiệu lực. Có kỳ: bắt buộc đủ from/to, tổng hợp sổ theo ngày Asia/Ho_Chi_Minh, tồn đầu + tăng - giảm = tồn cuối; không suy diễn reservation lịch sử.';
api.paths['/reports/inventory'].get.responses['200'].content['application/json'].schema={anyOf:[ref('InventorySummaryResult'),ref('InventoryPeriodResult')]};
const register=api.paths['/material-deliveries'].post;if(register.responses['200'])register.responses['201']=register.responses['200'];delete register.responses['200'];
for(const item of Object.values(api.paths))for(const op of Object.values(item))if(op.operationId&&!op.operationId.startsWith('auth.'))for(const response of Object.values(op.responses||{}))if(!response.$ref){response.headers??={};response.headers['X-Session-Idle-Expires-At']={description:'Thời hạn idle UTC hiện hành nếu request đã được xác thực; không gia hạn hard timeout.',schema:{type:'string',format:'date-time'}};}
for(const key of ['InventoryResult','InventorySummaryResult','InventoryPeriodResult','LedgerRow','ExpiryRow','VarianceResult','AlertResult']){
 const s=schemas[key],row=s?.properties?.data?.items||s;
 if(row?.properties)for(const name of ['warehouseName','locationName','itemName','unitName','lotCode'])row.properties[name]={type:'string',nullable:true};
}
for(const key of ['MaterialLotResult','ProductLotResult'])if(schemas[key]?.properties)schemas[key].properties.itemName={type:'string',nullable:true};
if(schemas.LedgerRow?.properties)schemas.LedgerRow.properties.actorName={type:'string',nullable:true};
writeFileSync(file,JSON.stringify(api,null,2)+'\n');
console.log('FS01–FS12 recorded in OpenAPI. Implementation status is tracked separately; no endpoint execution/test.');
