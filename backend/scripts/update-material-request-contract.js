const fs=require('node:fs'),path=require('node:path');
for(const name of ['api_contract.yaml','runtime_api.json']){
 const file=path.resolve(__dirname,'../../docs',name),api=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const schema of ['MaterialRequestInput','MaterialRequestResult'])api.components.schemas[schema].properties.lines.items.properties.quantityBase.pattern=String.raw`^[0-9]{1,14}(\.[0-9]{1,6})?$`;
 const root=name==='runtime_api.json'?'/api/v1':'';
 for(const schema of ['MaterialRequestInput','MaterialRequestResult'])api.components.schemas[schema].properties.notes={type:'string',maxLength:2000,...(schema.endsWith('Result')?{nullable:true}:{}),description:'Ghi chú tùy chọn của xưởng.'};
 api.components.schemas.MaterialRequestInput.description='Đủ các dòng nhu cầu và đúng nguyên liệu, số lượng qtyRequired của phân công được duyệt. Không thêm, bớt hoặc sửa lượng. Kiểm lại quota trong transaction; ghi chú tùy chọn.';
 api.paths[root+'/lookups/plan-lines'].get.description='Phân công đã duyệt trong phạm vi xưởng: tên kế hoạch/thành phẩm/xưởng, sản lượng và lịch; demands có tên vật tư, đơn vị, requestedBase và remainingBase theo các phiếu chưa hủy (kể cả nháp). Chỉ đọc, không giữ hoặc trừ tồn. Backend kiểm lại quota khi lưu.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Material request lookup description and DECIMAL patterns synchronized.');
