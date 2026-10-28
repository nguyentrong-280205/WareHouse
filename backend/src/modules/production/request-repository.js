const base = require('../../shared/business-repository');
async function requested(c, kind, sourceId) {
  const sql = kind === 'materialRequests'
    ? "SELECT COALESCE(SUM(l.qty_base),0) AS qty FROM ChiTietYeuCauXuatNL l JOIN PhieuXuatKhoNguyenLieu h ON h.id=l.request_id WHERE l.demand_id=? AND h.status<>'HUY'"
    : 'SELECT COALESCE(SUM(qty_completed),0) AS qty FROM ChiTietYeuCauNhapTP WHERE plan_line_id=?';
  return (await c.execute(sql, [sourceId]))[0][0].qty;
}
async function list(c, table, principal, {page=1,pageSize=20,status}={}) {
  // Table is selected by the service registry; account scope is never inferred from creator.
  if (!['PhieuXuatKhoNguyenLieu','PhieuNhapKhoThanhPham'].includes(table)) throw new Error('INVALID_REQUEST_TABLE');
  const predicate = 'EXISTS(SELECT 1 AS present FROM TaiKhoan_Xuong s WHERE s.workshop_id=h.workshop_id AND s.account_id=?)' + (status ? ' AND h.status=?' : '');
  const params = [principal.accountId,...(status?[status]:[])];
  const [[count]] = await c.execute('SELECT COUNT(*) AS n FROM '+table+' h WHERE '+predicate,params);
  const [rows] = await c.execute('SELECT h.* FROM '+table+' h WHERE '+predicate+' ORDER BY h.id DESC OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY',params);
  return {rows,total:Number(count.n)};
}
module.exports = {...base,requested,list};
