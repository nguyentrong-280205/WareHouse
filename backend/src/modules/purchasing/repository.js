const base=require('../../shared/business-repository');
async function list(c,actor,{page=1,pageSize=20,status}={}){
  const predicate="EXISTS(SELECT 1 FROM ChiTietKeHoachSanXuat l WHERE l.plan_id=p.plan_id)"+(status?' AND p.status=?':'');
  const params=status?[status]:[];
  const[[count]]=await c.execute('SELECT COUNT(*) AS n FROM DonMuaNguyenLieu p WHERE '+predicate,params);
  const[rows]=await c.execute('SELECT p.* FROM DonMuaNguyenLieu p WHERE '+predicate+' ORDER BY p.id DESC OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY',params);
  return{rows,total:Number(count.n)};
}
async function lines(c,purchaseId){return(await c.execute('SELECT l.*,a.demand_id FROM ChiTietDonMuaNguyenLieu l JOIN PhanBoMuaChoNhuCau a ON a.purchase_line_id=l.id WHERE l.purchase_id=? ORDER BY l.id',[purchaseId]))[0];}
async function openApproved(c,demandId){
  const[[exists]]=await c.execute("SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_CATALOG=DB_NAME() AND TABLE_SCHEMA='dbo' AND TABLE_NAME='ChiTietGiaoNL'");
  // SQL Server forbids a scalar subquery inside SUM. Aggregate deliveries first.
  // SUM widens DECIMAL to (38,6); restore (20,6) before subtraction so SQL Server
  // cannot reduce the intermediate scale to five. Overflow fails, never rounds.
  const join=Number(exists.n)?' LEFT JOIN (SELECT purchase_line_id,CONVERT(decimal(20,6),SUM(qty_received)) AS received FROM ChiTietGiaoNL GROUP BY purchase_line_id) g ON g.purchase_line_id=l.id':'',received=Number(exists.n)?'COALESCE(g.received,CONVERT(decimal(20,6),0))':'CONVERT(decimal(20,6),0)';
  return(await c.execute("SELECT COALESCE(SUM(GREATEST(0,a.qty_base-"+received+")),0) AS n FROM PhanBoMuaChoNhuCau a JOIN ChiTietDonMuaNguyenLieu l ON l.id=a.purchase_line_id JOIN DonMuaNguyenLieu p ON p.id=l.purchase_id"+join+" WHERE a.demand_id=? AND p.status IN ('DA_DUYET','NHAN_MOT_PHAN')",[demandId]))[0][0].n;
}
module.exports={...base,list,lines,openApproved};
