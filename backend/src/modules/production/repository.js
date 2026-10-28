const base=require('../../shared/business-repository');
async function planned(c,orderLineId,excludePlanId='0'){return(await c.execute("SELECT COALESCE(SUM(l.qty_base),0) AS n FROM ChiTietKeHoachSanXuat l JOIN KeHoachSanXuat p ON p.id=l.plan_id WHERE l.order_line_id=? AND p.id<>? AND p.status NOT IN ('TU_CHOI','HUY')",[orderLineId,excludePlanId]))[0][0].n;}
async function calendar(c,workshop,product,start,end){return(await c.execute('SELECT * FROM LichNangLucXuong WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE workshop_id=? AND product_id=? AND business_date BETWEEN ? AND ? ORDER BY business_date,id',[workshop,product,start,end]))[0];}
async function scheduled(c,calendarId){return(await c.execute("SELECT COALESCE(SUM(s.qty_base),0) AS n FROM PhanBoLichSanXuat s JOIN ChiTietKeHoachSanXuat l ON l.id=s.plan_line_id JOIN KeHoachSanXuat p ON p.id=l.plan_id WHERE s.calendar_id=? AND p.status NOT IN ('TU_CHOI','HUY')",[calendarId]))[0][0].n;}
async function plans(c,principal,{page=1,pageSize=20,status}={}){
  const criteria=status?' AND p.status=?':'',params=[principal.accountId,...(status?[status]:[])];
  const filter=require('./workshop-access').workshopReader(principal)?'EXISTS(SELECT 1 FROM ChiTietKeHoachSanXuat l JOIN TaiKhoan_Xuong s ON s.workshop_id=l.workshop_id WHERE l.plan_id=p.id AND s.account_id=?)':'EXISTS (SELECT 1 AS present FROM ChiTietKeHoachSanXuat l WHERE l.plan_id=p.id) AND NOT EXISTS (SELECT 1 AS present FROM ChiTietKeHoachSanXuat l WHERE l.plan_id=p.id AND NOT EXISTS (SELECT 1 AS present FROM TaiKhoan_Xuong s WHERE s.workshop_id=l.workshop_id AND s.account_id=?))';
  const[[count]]=await c.execute('SELECT COUNT(*) AS n FROM KeHoachSanXuat p WHERE '+filter+criteria,params);
  const[rows]=await c.execute('SELECT p.* FROM KeHoachSanXuat p WHERE '+filter+criteria+' ORDER BY p.id DESC OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY',params);
  return{rows,total:Number(count.n)};
}
async function available(c,materialId,actor){
  // A planning snapshot is an estimate, never a reservation/stock mutation.
  const[[exists]]=await c.execute("SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_CATALOG=DB_NAME() AND TABLE_SCHEMA='dbo' AND TABLE_NAME='TonKho'");
  if(!Number(exists.n))return '0.000000';
  return(await c.execute("SELECT COALESCE(SUM(t.qty_on_hand-t.qty_reserved),0) AS n FROM TonKho t JOIN LoNguyenLieu l ON l.id=t.material_lot_id JOIN ViTriLuuKho v ON v.id=t.location_id JOIN Kho k ON k.id=v.warehouse_id JOIN TaiKhoan_Kho s ON s.warehouse_id=k.id AND s.account_id=? WHERE l.material_id=? AND l.status='ACTIVE' AND (l.expires_on IS NULL OR l.expires_on>=CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME()))) AND t.quality_bucket='DAT' AND v.status='ACTIVE' AND k.status='ACTIVE' AND NOT EXISTS(SELECT 1 AS present FROM KhoaViTriKiemKe x WHERE x.location_id=v.id AND x.expires_at>SYSUTCDATETIME())",[actor,materialId]))[0][0].n;
}
async function demandUsage(c,demandId){
  const[[schema]]=await c.execute("SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_CATALOG=DB_NAME() AND TABLE_SCHEMA='dbo' AND TABLE_NAME IN ('PhieuXuatKho','ChiTietPhieuXuat','DatGiuTon')");
  if(Number(schema.n)===0)return{issued:'0.000000',held:'0.000000'}; // No stock documents can exist before inventory migration.
  if(Number(schema.n)!==3)throw new (require('../../shared/http').AppError)(503,'MIGRATION_REQUIRED','Schema inventory chưa được triển khai đầy đủ.');
  const[[issued]]=await c.execute("SELECT COALESCE(SUM(l.qty_base),0) AS n FROM ChiTietPhieuXuat l JOIN PhieuXuatKho h ON h.id=l.issue_id JOIN ChiTietYeuCauXuatNL r ON r.id=l.material_request_line_id WHERE r.demand_id=? AND h.status='HOAN_THANH' AND l.generation=h.allocation_generation",[demandId]);
  const[[held]]=await c.execute("SELECT COALESCE(SUM(qty_initial-qty_consumed-qty_released),0) AS n FROM DatGiuTon WHERE demand_id=? AND status='ACTIVE' AND expires_at>SYSUTCDATETIME()",[demandId]);
  return{issued:issued.n,held:held.n};
}
async function clearPendingLines(c,planId){
 const[[dependencies]]=await c.execute(`SELECT
 (SELECT COUNT(*) FROM NhuCauNguyenLieuKHSX n JOIN ChiTietKeHoachSanXuat l ON l.id=n.plan_line_id WHERE l.plan_id=?) +
 (SELECT COUNT(*) FROM DonMuaNguyenLieu WHERE plan_id=?) +
 (SELECT COUNT(*) FROM PhieuXuatKhoNguyenLieu r JOIN ChiTietKeHoachSanXuat l ON l.id=r.plan_line_id WHERE l.plan_id=?) +
 (SELECT COUNT(*) FROM PhieuNhapKhoThanhPham r JOIN ChiTietKeHoachSanXuat l ON l.id=r.plan_line_id WHERE l.plan_id=?) +
 (SELECT COUNT(*) FROM ChiTietYeuCauNhapTP r JOIN ChiTietKeHoachSanXuat l ON l.id=r.plan_line_id WHERE l.plan_id=?) AS n`,Array(5).fill(planId));
 if(Number(dependencies.n))require('../../shared/business-context').fail(409,'PLAN_HAS_DEPENDENCIES','Kế hoạch đã có dữ liệu phụ thuộc, không thể sửa.');
 await c.execute('DELETE a FROM PhanBoLichSanXuat a JOIN ChiTietKeHoachSanXuat l ON l.id=a.plan_line_id WHERE l.plan_id=?',[planId]);
 await c.execute('DELETE FROM ChiTietKeHoachSanXuat WHERE plan_id=?',[planId]);
}
async function lastEditor(c,planId){return(await c.execute("SELECT TOP(1) actor_id FROM AuditLog WHERE target_type='KeHoachSanXuat' AND target_id=? AND action='plans.update' ORDER BY id DESC",[planId]))[0][0]?.actor_id;}
async function queueCandidates(c,principal,audience){
 if(audience==='PURCHASING')return(await c.execute("SELECT p.* FROM KeHoachSanXuat p WHERE p.status IN ('DA_DUYET','DANG_THUC_HIEN') AND EXISTS(SELECT 1 FROM ChiTietKeHoachSanXuat l JOIN NhuCauNguyenLieuKHSX n ON n.plan_line_id=l.id WHERE l.plan_id=p.id) ORDER BY p.id DESC"))[0];
 if(audience==='WORKSHOP')return(await c.execute("SELECT p.* FROM KeHoachSanXuat p WHERE p.status IN ('DA_DUYET','DANG_THUC_HIEN') AND EXISTS(SELECT 1 FROM ChiTietKeHoachSanXuat l JOIN TaiKhoan_Xuong s ON s.workshop_id=l.workshop_id WHERE l.plan_id=p.id AND s.account_id=?) ORDER BY p.id DESC",[principal.accountId]))[0];
 const states=audience==='PLANNING'?"('TU_CHOI')":"('DA_DUYET','DANG_THUC_HIEN')";
 return(await c.execute(`SELECT p.* FROM KeHoachSanXuat p WHERE p.status IN ${states}
 AND EXISTS(SELECT 1 FROM ChiTietKeHoachSanXuat l WHERE l.plan_id=p.id)
 AND NOT EXISTS(SELECT 1 FROM ChiTietKeHoachSanXuat l WHERE l.plan_id=p.id AND NOT EXISTS(SELECT 1 FROM TaiKhoan_Xuong s WHERE s.workshop_id=l.workshop_id AND s.account_id=?)) ORDER BY p.id DESC`,[principal.accountId]))[0];
}
async function pendingPurchase(c,demandId){return(await c.execute("SELECT COALESCE(SUM(a.qty_base),0) AS n FROM PhanBoMuaChoNhuCau a JOIN ChiTietDonMuaNguyenLieu l ON l.id=a.purchase_line_id JOIN DonMuaNguyenLieu p ON p.id=l.purchase_id WHERE a.demand_id=? AND p.status IN ('NHAP','CHO_DUYET')",[demandId]))[0][0].n;}
module.exports={...base,planned,calendar,scheduled,plans,available,demandUsage,clearPendingLines,lastEditor,queueCandidates,pendingPurchase};
