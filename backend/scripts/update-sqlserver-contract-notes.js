const fs=require('node:fs'),crypto=require('node:crypto');
function structure(value){
 if(Array.isArray(value))return value.map(structure);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['description','summary'].includes(k)).map(([k,v])=>[k,structure(v)]));
 return value;
}
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),before=JSON.stringify(structure(api));
 api.info.description='29 UC DA_CODE_CHUA_TEST; Express JavaScript CommonJS + mssql + SQL Server Windows, migration T-SQL có version. Không đổi endpoint/response schema. KhachHang1:N TaiKhoan, customer_id không UNIQUE; VND amount20,0, quantity/price20,6, factor20,9. Session HttpOnly+CSRF/RBAC, idle30 phút/hard8 giờ; Argon2id65536/3/1. FS01–FS12 đã xác nhận, ngoại lệ ngoài phạm vi vẫn chưa duyệt. Chưa chạy test hoặc nghiệm thu SQL Server/29UC.';
 if(JSON.stringify(structure(api))!==before)throw new Error('UNEXPECTED_API_STRUCTURAL_CHANGE');
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
 console.log(JSON.stringify({file,structuralContract:'UNCHANGED',fingerprint:crypto.createHash('sha256').update(before).digest('hex')}));
}
