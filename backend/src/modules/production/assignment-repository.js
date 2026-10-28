const base=require('../../shared/business-repository');
const manager=p=>p.permissions.includes('issues.allocate');
async function requests(c,p,{page=1,pageSize=20,pending}={}){
 const filter=manager(p)?"EXISTS(SELECT 1 FROM TaiKhoan_Kho s JOIN Kho k ON k.id=s.warehouse_id WHERE s.account_id=? AND k.status='ACTIVE' AND k.type IN ('MATERIAL','CONTROLLED') AND (NOT EXISTS(SELECT 1 FROM PhanCongCapNguyenLieu a WHERE a.request_id=h.id) OR EXISTS(SELECT 1 FROM PhanCongCapNguyenLieu a WHERE a.request_id=h.id AND a.warehouse_id=s.warehouse_id)))":'EXISTS(SELECT 1 FROM PhanCongCapNguyenLieu a JOIN TaiKhoan_Kho s ON s.warehouse_id=a.warehouse_id AND s.account_id=a.staff_id WHERE a.request_id=h.id AND a.staff_id=?)';
 const pendingFilter=pending==='true'?(manager(p)?" AND h.status='DA_GUI' AND NOT EXISTS(SELECT 1 FROM PhieuXuatKho x WHERE x.material_request_id=h.id AND x.status NOT IN ('HUY','HET_HAN'))":" AND h.status IN ('DA_GUI','DANG_CAP')"):'';
 const from=" FROM PhieuXuatKhoNguyenLieu h WHERE h.status IN ('DA_GUI','DANG_CAP','HOAN_THANH') AND "+filter+pendingFilter;
 const[[count]]=await c.execute('SELECT COUNT(*) AS n'+from,[p.accountId]);
 return{rows:(await c.execute('SELECT h.*'+from+' ORDER BY h.id DESC OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+pageSize+' ROWS ONLY',[p.accountId]))[0],total:Number(count.n)};
}
async function assignments(c,id){return(await c.execute('SELECT p.*,a.display_name AS staff_name FROM PhanCongCapNguyenLieu p JOIN TaiKhoan a ON a.id=p.staff_id WHERE p.request_id=? ORDER BY p.staff_id',[id]))[0];}
async function employees(c,actor){return(await c.execute("SELECT a.id,a.display_name,s.warehouse_id FROM TaiKhoan a JOIN VaiTroQuyen r ON r.id=a.role_id JOIN TaiKhoan_Kho s ON s.account_id=a.id JOIN TaiKhoan_Kho own ON own.warehouse_id=s.warehouse_id AND own.account_id=? WHERE a.status='ACTIVE' AND r.status='ACTIVE' AND a.customer_id IS NULL AND EXISTS(SELECT 1 FROM VaiTro_Quyen v JOIN Quyen q ON q.id=v.permission_id WHERE v.role_id=a.role_id AND q.code='issues.postMaterial') ORDER BY a.id,s.warehouse_id",[actor]))[0];}
async function assertAssignment(c,requestId,warehouseId,staffId){
 const params=[requestId,warehouseId,...(staffId?[staffId]:[])];
 const [rows]=await c.execute("SELECT p.staff_id FROM PhanCongCapNguyenLieu p WITH(HOLDLOCK) JOIN TaiKhoan a ON a.id=p.staff_id JOIN VaiTroQuyen r ON r.id=a.role_id JOIN TaiKhoan_Kho s ON s.account_id=a.id AND s.warehouse_id=p.warehouse_id WHERE p.request_id=? AND p.warehouse_id=?"+(staffId?' AND p.staff_id=?':'')+" AND a.status='ACTIVE' AND r.status='ACTIVE' AND a.customer_id IS NULL AND EXISTS(SELECT 1 FROM VaiTro_Quyen v JOIN Quyen q ON q.id=v.permission_id WHERE v.role_id=a.role_id AND q.code='issues.postMaterial')",params);
 if(!rows.length)require('../../shared/business-context').fail(403,'MATERIAL_STAFF_ASSIGNMENT_REQUIRED','Phiếu chưa được phân công cho nhân viên đang hoạt động tại kho này, hoặc bạn không phải nhân viên được giao.');
}
module.exports={...base,manager,requests,assignments,employees,assertAssignment};
