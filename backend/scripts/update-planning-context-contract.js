const fs=require('node:fs');
const string={type:'string'},id={$ref:'#/components/schemas/Id'},quantity={$ref:'#/components/schemas/Quantity'},date={type:'string',format:'date'};
const object=properties=>({type:'object',additionalProperties:false,properties});
const array=items=>({type:'array',items});
const material=object({materialId:id,code:string,name:string,status:string,unitId:id,unitName:string,discrete:{type:'boolean'},quantityPerOutputBase:quantity,unitValid:{type:'boolean'},availableBase:quantity,onHandBase:quantity,reservedBase:quantity,byWarehouse:array(object({warehouseId:id,availableBase:quantity}))});
const bom=object({id,revision:{type:'integer'},effectiveFrom:date,effectiveTo:{...date,nullable:true},outputQuantityBase:quantity,materials:array(material)});
const line=object({id,productId:id,productCode:string,productName:string,productStatus:string,baseUnitName:string,quantity,unitName:string,factorSnapshot:{$ref:'#/components/schemas/ConversionFactor'},quantityBase:quantity,plannedBase:quantity,remainingBase:quantity,unitPrice:{$ref:'#/components/schemas/UnitPrice'},amount:{$ref:'#/components/schemas/MoneyVND'},boms:array(bom),workshops:array(object({id,code:string,name:string,freeCapacityBase:quantity}))});
const response=object({order:object({id,code:string,status:string,customerName:string,dueDate:date,deliveryAddress:string,recipient:string,recipientPhone:string,totalAmount:{$ref:'#/components/schemas/MoneyVND'},lines:array(line)}),startDate:date,endDate:date,observedAt:{type:'string',format:'date-time'},warehouseScopeIds:array(id)});
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8'));
 api.components.schemas.ProductionPlanningContext=response;
 const path=(file.endsWith('runtime_api.json')?'/api/v1':'')+'/production-plans/order-context/{id}';
 api.paths[path]={get:{operationId:'plans.planningContext',tags:['UC02'],summary:'Thông tin đơn, BOM, tồn khả dụng và năng lực xưởng phục vụ lập kế hoạch',description:'Chỉ đọc, plans.create. Chỉ đơn đã xác nhận/đang giao; thông tin nguyên liệu theo phạm vi kho và xưởng theo account scope. Không giữ/trừ tồn. Readiness là ACTIVE và năng lực còn lại đúng SKU/ngày; tạo kế hoạch khóa và kiểm lại quota/BOM/lịch như cũ. Không tạo enum READY hoặc lớp mới.','x-permissions':['plans.create'],parameters:[{name:'id',in:'path',required:true,schema:id},...['startDate','endDate'].map(name=>({name,in:'query',required:true,schema:date}))],responses:{'200':{description:'Snapshot tham khảo, không giữ tài nguyên',content:{'application/json':{schema:{$ref:'#/components/schemas/ProductionPlanningContext'}}}},'403':{description:'Không có quyền'},'404':{description:'Không tìm thấy đơn'},'409':{description:'Trạng thái đơn không hợp lệ'},'422':{description:'Lịch không hợp lệ'}}}};
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Production planning context GET documented; no schema or mutation change.');
