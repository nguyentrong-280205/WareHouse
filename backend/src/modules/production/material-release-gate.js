const repo=require('./repository'),d=require('../../shared/decimal');
// Approval of a PO permits requesting materials, never stock posting without stock/QC.
async function canRequestMaterials(c,plan,principal,{lock=false}={}){
 if(!['DA_DUYET','DANG_THUC_HIEN'].includes(plan.status))return false;
 const source=await require('../purchasing/request-source').requestSource(c,plan,principal);
 const missing=new Map(source.lines[0].materialDemands.map(n=>[String(n.id),d.parse(n.shortageBase)]));
 for(const line of await repo.find(c,'ChiTietKeHoachSanXuat',{plan_id:plan.id})){
  for(const n of await repo.find(c,'NhuCauNguyenLieuKHSX',{plan_line_id:line.id})){
   const snapshot=d.parse(n.shortage),current=missing.get(String(n.id))||0n;
   if(snapshot===0n&&current===0n)continue;
   const [allocations]=await c.execute("SELECT a.qty_base,p.status FROM PhanBoMuaChoNhuCau a"+(lock?' WITH(HOLDLOCK)':'')+" JOIN ChiTietDonMuaNguyenLieu l"+(lock?' WITH(HOLDLOCK)':'')+" ON l.id=a.purchase_line_id JOIN DonMuaNguyenLieu p"+(lock?' WITH(HOLDLOCK)':'')+" ON p.id=l.purchase_id WHERE a.demand_id=? AND p.plan_id=? AND l.material_id=? AND l.unit_id=? AND p.approver_id IS NOT NULL AND p.status IN ('DA_DUYET','NHAN_MOT_PHAN','HOAN_THANH')",[n.id,plan.id,n.material_id,n.unit_id]);
   const approved=allocations.reduce((sum,a)=>sum+d.parse(a.qty_base),0n);
   if(approved<snapshot)return false;
   if(current>0n&&d.parse(await require('../purchasing/repository').openApproved(c,n.id))<current)return false;
  }
 }
 return true;
}
async function assertCanRequestMaterials(c,plan,principal){
 if(!await canRequestMaterials(c,plan,principal,{lock:true}))require('../../shared/business-context').fail(409,'MATERIAL_PURCHASE_APPROVAL_REQUIRED','Chưa được lập hoặc gửi phiếu cấp nguyên liệu: kế hoạch phải được duyệt và phần nguyên liệu thiếu phải có đơn mua tương ứng đã duyệt đủ số lượng.');
}
module.exports={canRequestMaterials,assertCanRequestMaterials};
