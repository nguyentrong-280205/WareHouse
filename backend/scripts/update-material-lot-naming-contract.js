const fs=require('node:fs'),path=require('node:path');
for(const name of ['api_contract.yaml','runtime_api.json']){
 const file=path.resolve(__dirname,'../../docs',name),api=JSON.parse(fs.readFileSync(file,'utf8')),root=name==='runtime_api.json'?'/api/v1':'';
 api.paths[root+'/material-lots'].post.description='Lô thuộc đúng một nguyên liệu. Mã code gửi ở LotInput là placeholder để tương thích contract chung; server tự cấp mã LO-<nguyên liệu>-<số thứ tự> duy nhất trong nguyên liệu và trả mã thực. Không tạo tồn khi đăng ký lô.';
 api.paths[root+'/material-lots/{id}'].put.description='Không cho thay nguyên liệu hoặc mã của lô nguyên liệu sau khi tạo. Các điều kiện bất biến lịch sử, ngày và HSD hiện hành tiếp tục áp dụng.';
 api.components.schemas.MaterialLotResult.description='Mỗi lô thuộc một nguyên liệu; code do server cấp theo nguyên liệu. HSD bắt buộc nếu nguyên liệu quản lý HSD. Không nhận qty/status QC từ catalog.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Material lot naming contract synchronized.');
