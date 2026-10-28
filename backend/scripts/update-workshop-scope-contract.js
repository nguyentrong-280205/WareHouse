const fs=require('node:fs');
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),root=file.endsWith('runtime_api.json')?'/api/v1':'';
 api.components.schemas.PlanResult.properties.workshopScoped={type:'boolean',description:'Vai trò xưởng chỉ nhận lines/materialDemands thuộc phạm vi xưởng của tài khoản, kể cả kế hoạch phân công nhiều xưởng. Trạng thái đủ vật tư vẫn xét toàn kế hoạch; không trả chi tiết vật tư xưởng khác.'};
 const queue=api.paths[root+'/production-plans/receiving-queue'].get;
 queue.description+=' WORKSHOP nhận khi có ít nhất một phân công đúng scope; DTO chỉ chứa phần đó. Không cần quyền tất cả xưởng của kế hoạch. Lập/duyệt và mua hàng giữ quy tắc quyền hiện hành.';
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Workshop-scoped production plan projection synchronized.');
