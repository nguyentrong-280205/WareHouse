async function recipients(c,planId,permission){
 const scope=permission==='purchases.create'?'1=1':permission==='materialRequests.create'?'EXISTS(SELECT 1 FROM ChiTietKeHoachSanXuat l JOIN TaiKhoan_Xuong s ON s.workshop_id=l.workshop_id AND s.account_id=a.id WHERE l.plan_id=?)':'NOT EXISTS(SELECT 1 FROM ChiTietKeHoachSanXuat l WHERE l.plan_id=? AND NOT EXISTS(SELECT 1 FROM TaiKhoan_Xuong s WHERE s.account_id=a.id AND s.workshop_id=l.workshop_id))';
 const[[row]]=await c.execute("SELECT COUNT(*) AS n FROM TaiKhoan a JOIN VaiTroQuyen r ON r.id=a.role_id WHERE a.status='ACTIVE' AND r.status='ACTIVE' AND a.customer_id IS NULL AND EXISTS(SELECT 1 FROM VaiTro_Quyen v JOIN Quyen q ON q.id=v.permission_id WHERE v.role_id=a.role_id AND q.code=?) AND "+scope,[permission,...(permission==='purchases.create'?[]:[planId])]);
 return Number(row.n);
}
async function handoff(c,row,supply,principal){
 const target=row.status==='TU_CHOI'?'PLANNING':['DA_DUYET','DANG_THUC_HIEN'].includes(row.status)?(await require('./material-release-gate').canRequestMaterials(c,row,principal)?'WORKSHOP':'PURCHASING'):null;
 const count=target?await recipients(c,row.id,{PLANNING:'plans.create',PURCHASING:'purchases.create',WORKSHOP:'materialRequests.create'}[target]):0;
 return{handoffTarget:target,handoffRecipientCount:count,handoffBlocked:!!target&&!count,rejectionReason:row.rejection_reason||null};
}
module.exports={handoff};
