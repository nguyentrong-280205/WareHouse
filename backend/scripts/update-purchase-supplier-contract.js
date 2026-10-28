const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),s=api.components.schemas,root=file.endsWith('runtime_api.json')?'/api/v1':'';
 s.PurchaseInput.properties.notes={type:'string',maxLength:2000,description:'Ghi chú tùy chọn, trim khi lưu; không chứa HTML thực thi.'};
 Object.assign(s.PurchaseResult.properties,{notes:{type:'string',maxLength:2000,nullable:true},supplierName:{type:'string'},supplierCode:{type:'string'},planCode:{type:'string'}});
 api.paths[root+'/lookups/suppliers'].get.description='NCC ACTIVE và báo giá hiện hành theo materialId/unitId: quotes[{id,materialId,unitId,unitPrice,revision,effectiveAt}]. Giá DECIMAL dạng chuỗi. Form gợi ý NCC bao phủ đủ vật tư, so tổng giá theo lượng bằng BigInt, người mua được đổi giá trước lưu. Dữ liệu mẫu không phải báo giá thương mại.';
 api.paths[root+'/purchases'].post.description='Tạo đơn mua từ nhu cầu hợp lệ, độc lập xưởng. NCC phải ACTIVE và có báo giá hiện hành cho từng vật tư/đơn vị; unitPrice người mua nhập được lưu snapshot, không ghi đè bằng giá tham khảo. notes tùy chọn tối đa2000. Giữ quota/RBAC/CSRF/idempotency/transaction.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Supplier quotations and optional purchase notes synchronized.');
