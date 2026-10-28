const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),plan=api.components.schemas.PlanResult;
 plan.properties.orderCode={type:'string',description:'Mã đơn hàng nguồn để hiển thị; orderId giữ nguyên cho thao tác nghiệp vụ.'};
 const line=plan.properties.lines.items.properties;
 for(const key of ['productCode','productName','baseUnitName','workshopCode','workshopName'])line[key]={type:'string'};
 for(const key of ['orderLineNumber','bomRevision','sourceBomRevision'])line[key]={type:'string',pattern:'^[0-9]+$',description:'BIGINT dạng chuỗi, không chuyển qua Number.'};
 line.bomIsPlanOverride={type:'boolean'};
 const demand=line.materialDemands.items.properties;
 for(const key of ['materialCode','materialName','unitName'])demand[key]={type:'string'};
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Production plan display labels added; IDs and mutation inputs unchanged.');
