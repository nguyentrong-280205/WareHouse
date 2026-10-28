const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const name of ['ProductInput','ProductInputUpdate','ProductResult']){
  const schema=api.components.schemas[name];
  schema.properties.description={type:'string',maxLength:2000,nullable:true,description:'Mô tả thành phẩm; không chứa công thức bí mật.'};
  schema.properties.salesPrices.minItems=0;
  schema.properties.salesPrices.description='Có thể chưa cấu hình giá khi lập danh mục. Mảng trống không xóa giá lịch sử; xác nhận đơn vẫn bắt buộc có giá hiệu lực.';
  if(name==='ProductInput')schema.required=schema.required.filter(field=>field!=='salesPrices');
  schema.properties.packaging.items.properties.cartonsPerPallet={type:'integer',minimum:1,maximum:4166666666,description:'Số thùng/pallet cấu hình riêng cho phiên bản mới; hệ số phải khớp quy cách thùng hiệu lực.'};
  if(name==='ProductResult')schema.properties.packaging.items.properties.cartonFactorSnapshot={allOf:[{$ref:'#/components/schemas/ConversionFactor'}],readOnly:true,description:'Snapshot số đơn vị cơ sở/thùng tại lúc tạo phiên bản pallet.'};
 }
 for(const name of ['LotInput','LotInputUpdate'])api.components.schemas[name].properties.expiresOn.description='HSD thực tế được phép nhập. Với lô thành phẩm mới, bỏ trống thì tính ngày sản xuất + HSD mặc định của thành phẩm; không thay HSD lô cũ khi sửa danh mục.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Product catalog contract extended additively; existing endpoints and snapshots preserved.');
