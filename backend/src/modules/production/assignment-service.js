const repo=require('./assignment-repository');
const{fail,requireRow,expectState,expectVersion,scope,now}=require('../../shared/business-context');
function createAssignmentService(context){
 async function dto(c,row){
  const line=requireRow(await repo.one(c,'ChiTietKeHoachSanXuat',{id:row.plan_line_id})),plan=requireRow(await repo.one(c,'KeHoachSanXuat',{id:line.plan_id})),product=requireRow(await repo.one(c,'ThanhPham',{id:line.product_id})),workshop=requireRow(await repo.one(c,'XuongSanXuat',{id:row.workshop_id}));
  const staff=await repo.assignments(c,row.id),materials=[];
  for(const l of await repo.find(c,'ChiTietYeuCauXuatNL',{request_id:row.id})){const m=requireRow(await repo.one(c,'NguyenLieu',{id:l.material_id})),u=requireRow(await repo.one(c,'DonViTinh',{id:l.unit_id}));materials.push({id:String(l.id),materialId:String(l.material_id),unitId:String(l.unit_id),name:m.name,code:m.code,quantityBase:l.qty_base,unitName:u.name});}
  const[[used]]=await c.execute("SELECT COUNT(*) AS n FROM PhieuXuatKho WHERE material_request_id=? AND status<>'HUY'",[row.id]);
  return{id:String(row.id),code:row.code,version:Number(row.version),status:row.status,notes:row.notes||null,planCode:plan.code,productName:product.name,workshopName:workshop.name,warehouseId:staff.length?String(staff[0].warehouse_id):null,staff:staff.map(a=>({id:String(a.staff_id),name:a.staff_name})),materials,canAssign:row.status==='DA_GUI'&&!Number(used.n)};
 }
 return{
  async list(req){return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,found=await repo.requests(c,req.principal,{page,pageSize,pending:req.query.pending});const data=[];for(const row of found.rows)data.push(await dto(c,row));return{data,meta:{page,pageSize,total:found.total}};});},
  async options(req){return context.read(async c=>{if(!repo.manager(req.principal))fail(403,'FORBIDDEN','Chỉ quản lý kho được phân công.');const data=[];for(const id of req.principal.warehouseIds){const w=await repo.one(c,'Kho',{id,status:'ACTIVE'});if(w&&['MATERIAL','CONTROLLED'].includes(w.type))data.push({id:String(w.id),name:w.name,code:w.code});}const rows=await repo.employees(c,req.principal.accountId);return{data:{warehouses:data,staff:rows.map(a=>({id:String(a.id),name:a.display_name,warehouseId:String(a.warehouse_id)}))}};});},
  async assignWithin(c,req){
   const b=req.body;scope(req.principal,b.warehouseId);
   const warehouse=requireRow(await repo.one(c,'Kho',{id:b.warehouseId},{lock:true}));expectState(warehouse,['ACTIVE']);if(!['MATERIAL','CONTROLLED'].includes(warehouse.type))fail(422,'WAREHOUSE_TYPE','Chọn kho nguyên liệu.');
   const row=requireRow(await repo.one(c,'PhieuXuatKhoNguyenLieu',{id:req.params.id},{lock:true}));expectVersion(row,b.expectedVersion);expectState(row,['DA_GUI']);
   const previous=await repo.assignments(c,row.id);for(const a of previous)scope(req.principal,String(a.warehouse_id));
   const line=requireRow(await repo.one(c,'ChiTietKeHoachSanXuat',{id:row.plan_line_id})),plan=requireRow(await repo.one(c,'KeHoachSanXuat',{id:line.plan_id},{lock:true}));
   await require('./material-release-gate').assertCanRequestMaterials(c,plan,req.principal);
   const[[used]]=await c.execute("SELECT COUNT(*) AS n FROM PhieuXuatKho WITH(UPDLOCK,HOLDLOCK) WHERE material_request_id=? AND status<>'HUY'",[row.id]);if(Number(used.n))fail(409,'ASSIGNMENT_ALREADY_STARTED','Đã điều phối xuất; không được đổi người hoặc kho.');
   const selected=[...new Set(b.staffIds)];if(!selected.length||selected.length!==b.staffIds.length)fail(422,'STAFF_REQUIRED','Chọn nhân viên không trùng nhau.');
   for(const id of selected.sort((a,b)=>BigInt(a)<BigInt(b)?-1:1)){
    const[[a]]=await c.execute("SELECT a.id FROM TaiKhoan a WITH(UPDLOCK,HOLDLOCK) JOIN VaiTroQuyen r ON r.id=a.role_id JOIN TaiKhoan_Kho s ON s.account_id=a.id WHERE a.id=? AND s.warehouse_id=? AND a.status='ACTIVE' AND r.status='ACTIVE' AND a.customer_id IS NULL AND EXISTS(SELECT 1 FROM VaiTro_Quyen v JOIN Quyen q ON q.id=v.permission_id WHERE v.role_id=a.role_id AND q.code='issues.postMaterial')",[id,b.warehouseId]);if(!a)fail(422,'STAFF_SCOPE','Nhân viên không còn quyền cấp nguyên liệu tại kho đã chọn.');
   }
   const before=await repo.assignments(c,row.id);
   await c.execute('DELETE FROM PhanCongCapNguyenLieu WHERE request_id=?',[row.id]);
   for(const id of selected)await c.execute('INSERT INTO PhanCongCapNguyenLieu(request_id,staff_id,warehouse_id,assigned_by_id) VALUES(?,?,?,?)',[row.id,id,b.warehouseId,req.principal.accountId]);
   await repo.update(c,'PhieuXuatKhoNguyenLieu',{id:row.id},{version:Number(row.version)+1,updated_at:now()});
   const after=await dto(c,{...row,version:Number(row.version)+1});await repo.audit(c,req.principal,'materialAssignments.assign','PhieuXuatKhoNguyenLieu',row.id,before,after,req.correlationId);return{data:after};
  },
  async assign(req){return context.write(req,'materialAssignments.assign',c=>this.assignWithin(c,req));}
 };
}
module.exports={createAssignmentService};
