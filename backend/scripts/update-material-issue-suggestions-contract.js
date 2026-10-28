const fs=require('node:fs'),path=require('node:path');
const id={$ref:'#/components/schemas/Id'},quantity={$ref:'#/components/schemas/Quantity'},str={type:'string'};
const object=properties=>({type:'object',additionalProperties:false,properties}),array=items=>({type:'array',items});
for(const name of ['api_contract.yaml','runtime_api.json']){
 const file=path.resolve(__dirname,'../../docs',name),api=JSON.parse(fs.readFileSync(file,'utf8')),root=name==='runtime_api.json'?'/api/v1':'';
 const line=object({sourceLineId:id,lotKind:{type:'string',enum:['MATERIAL']},balanceId:id,lotId:id,locationId:id,unitId:id,quantity});
 const balance=object({id,warehouseId:id,locationId:id,lotKind:str,qualityBucket:str,lotId:id,itemId:id,itemCode:str,itemName:str,lotCode:str,unitId:id,available:quantity,expiresOn:{type:'string',format:'date',nullable:true}});
 const shortage=object({sourceLineId:id,materialCode:str,materialName:str,unitName:str,remainingBase:quantity,hasPartial:{type:'boolean'}});
 api.paths[root+'/material-requests/{id}/issue-suggestions']={get:{operationId:'issues.materialSuggestions',summary:'Gợi ý phân bổ nguyên liệu theo FEFO',description:'Chỉ đọc, theo yêu cầu và kho trong phạm vi; dùng thứ tự FEFO thực tế, trừ lượng nguồn đã xuất/giữ và chia nhiều lô, không tạo phiếu hay giữ tồn. Xác nhận vẫn kiểm lại tồn, quota và FEFO trong transaction.','x-uc':'UC15','x-permissions':['issues.allocate'],parameters:[{name:'id',in:'path',required:true,schema:id},{name:'warehouseId',in:'query',required:true,schema:id}],responses:{'200':{description:'Gợi ý tại thời điểm đọc',content:{'application/json':{schema:object({data:object({requestId:id,warehouseId:id,lines:array(line),balances:array(balance),shortages:array(shortage)})})}}}}}};
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Material FEFO issue suggestions contract synchronized.');
