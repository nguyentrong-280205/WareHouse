const fs=require('node:fs'),path=require('node:path');
for(const name of ['api_contract.yaml','runtime_api.json']){
 const file=path.resolve(__dirname,'../../docs',name),api=JSON.parse(fs.readFileSync(file,'utf8')),root=name==='runtime_api.json'?'/api/v1':'';
 const warehouse=api.paths[root+'/lookups/warehouses'].get,source=api.paths[root+'/lookups/allocation-sources'].get;
 warehouse.description=(warehouse.description||'')+' Mỗi kho có materialLocationRulesEnabled; vị trí trả allowedMaterialIds để lọc nơi nhận nguyên liệu theo nhóm. Khi kho chưa cấu hình, giữ quy tắc cũ.';
 source.description=(source.description||'')+' Nguồn QC có itemId để đối chiếu nhóm nguyên liệu phù hợp với vị trí trong kho.';
 const receipt=api.paths[root+'/receipts'].post;receipt.description=(receipt.description||'')+' Nếu kho đã cấu hình vị trí-nguyên liệu, điều phối/nhập nguyên liệu phải chọn vị trí được phép cho nguyên liệu. Xuất tồn tại vị trí cũ vẫn được phép.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Material location rules contract synchronized.');
