const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),order=api.components.schemas.OrderResult;
 order.properties.pricingStatus={type:'string',enum:['ESTIMATED','CONFIRMED','UNAVAILABLE'],readOnly:true};
 order.properties.estimatedTotalAmount={$ref:'#/components/schemas/MoneyVND',description:'Chỉ đơn NHAP và khi tất cả dòng có giá hợp lệ; tạm tính, không ghi database.'};
 Object.assign(order.properties.lines.items.properties,{
  productCode:{type:'string',readOnly:true},productName:{type:'string',readOnly:true},unitName:{type:'string',readOnly:true},
  estimatedUnitPrice:{$ref:'#/components/schemas/UnitPrice',description:'Giá hiện hành để xem trước, không thay unitPrice đã chốt.'},
  estimatedAmount:{$ref:'#/components/schemas/MoneyVND',description:'Thành tiền xem trước theo FS01; không thay amount đã chốt.'},
  estimateUnavailableReason:{type:'string',enum:['PRICE_NOT_CONFIGURED','AMOUNT_OUT_OF_RANGE'],readOnly:true},
 });
 order.description='VND chính xác dạng chuỗi. Đơn NHAP hiển thị estimatedUnitPrice/estimatedAmount/estimatedTotalAmount từ giá hiệu lực, không ghi snapshot. Xác nhận chốt unitPrice/amount/totalAmount theo giá hiệu lực lúc submit, HALF_UP từng dòng theo FS01; không làm tròn trung gian. Đơn đã xác nhận chỉ trả giá đã lưu, không định giá lại. customerId quyết định phạm vi truy cập.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Order estimates added as separate read-only response fields; confirmed prices unchanged.');
