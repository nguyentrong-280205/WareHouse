// SQL execution is confined to repositories. Identifiers come from source-owned registries,
// never HTTP input; all values are bound by mssql request parameters.
const tables = new Set(['BaoGiaNguyenLieu','KhachHang','DonViTinh','NguyenLieu','ThanhPham','QuyCachDongGoi','GiaBanThanhPham','Kho','ViTriLuuKho',
  'TaiKhoan_Kho','TaiKhoan_Xuong','XuongSanXuat','NhaCungCap','LoNguyenLieu','LoThanhPham','HeSoChiemCho','PhieuChuyenViTri','ChiTietChuyenViTri',
  'DonHang','ChiTietDonHang','DinhMuc','ChiTietDinhMuc','LichNangLucXuong','KeHoachSanXuat','ChiTietKeHoachSanXuat',
  'PhanBoLichSanXuat','NhuCauNguyenLieuKHSX','DonMuaNguyenLieu','ChiTietDonMuaNguyenLieu','PhanBoMuaChoNhuCau',
  'PhieuXuatKhoNguyenLieu','ChiTietYeuCauXuatNL','PhieuNhapKhoThanhPham','ChiTietYeuCauNhapTP',
  'TonKho','StockPosting','LichSuBienDongTon','DatGiuTon','PhieuNhapKho','ChiTietPhieuNhap','PhieuXuatKho','ChiTietPhieuXuat',
  'DotGiaoNguyenLieu','ChiTietGiaoNL','BienBanQCNguyenLieu','ChiTietQCNguyenLieu','BienBanQCThanhPham','ChiTietQCThanhPham',
  'DotGiaoHang','ChiTietGiaoHang','YeuCauTraHang','ChiTietTraHang','TiepNhanTra','ChiTietTiepNhanTra','TiepNhanChuaDinhDanh',
  'KetQuaKiemTraHangTra','ChiTietQCHangTra','XuLyHangLoiTraVe','BienBanKiemKe','PhamViKiemKe','SnapshotKiemKe',
  'KhoaViTriKiemKe','LanDemKiemKe','ChiTietLanDem','ChiTietKiemKe','XuLyChenhLech','DeNghiDieuChinhTon','BangChung',
  'CauHinhNghiepVu','CanhBaoKho','ThanhVienKiemKe','DotTaiXuLy','PhanBoTonDuKien']);
function table(name) { if (!tables.has(name)) throw new Error('UNREGISTERED_SQL_TABLE'); return 'dbo.[' + name + ']'; }
function field(name) { if (!/^[a-z_]+$/.test(name)) throw new Error('INVALID_SQL_IDENTIFIER'); return '[' + name + ']'; }
function where(values) {
  const keys = Object.keys(values);
  return { sql: keys.length ? keys.map(k => values[k] === null ? field(k) + ' IS NULL' : field(k) + '=?').join(' AND ') : '1=1',
    params: keys.filter(k => values[k] !== null).map(k => values[k]) };
}
async function find(c, name, criteria = {}, { lock = false, limit, order = 'id' } = {}) {
  const w = where(criteria);
  if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) throw new Error('INVALID_SQL_LIMIT');
  const sql = 'SELECT * FROM ' + table(name) + (lock ? ' WITH (UPDLOCK,HOLDLOCK,ROWLOCK)' : '') + ' WHERE ' + w.sql + ' ORDER BY ' + field(order)
    + (limit ? ' OFFSET 0 ROWS FETCH NEXT ' + limit + ' ROWS ONLY' : '');
  return (await c.execute(sql, w.params))[0];
}
async function one(c, name, criteria, options) { return (await find(c, name, criteria, { ...options, limit: 1 }))[0]; }
async function insert(c, name, values) {
  const entries = Object.entries(values).filter(([,v]) => v !== undefined);
  const [[row]] = await c.execute('INSERT INTO ' + table(name) + '(' + entries.map(([k]) => field(k)).join(',') + ') OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (' + entries.map(() => '?').join(',') + ')', entries.map(([,v]) => v));
  return String(row.id);
}
async function update(c, name, criteria, values) {
  const entries = Object.entries(values).filter(([,v]) => v !== undefined), w = where(criteria);
  const [result] = await c.execute('UPDATE ' + table(name) + ' SET ' + entries.map(([k]) => field(k) + '=?').join(',') + ' WHERE ' + w.sql, [...entries.map(([,v]) => v), ...w.params]);
  return result.affectedRows;
}
async function page(c, name, { page = 1, pageSize = 20, q = '', status, itemId } = {}, { scopeIds, itemColumn, search = ['code','name'] } = {}) {
  const clauses = [], params = [];
  if (scopeIds) { if (!scopeIds.length) return { rows: [], total: 0 }; clauses.push('id IN (' + scopeIds.map(() => '?').join(',') + ')'); params.push(...scopeIds); }
  if (q) { clauses.push('(' + search.map(k => field(k) + " LIKE ? ESCAPE N'~'").join(' OR ') + ')'); params.push(...search.map(() => require('./sql-pattern').contains(q))); }
  if (status) { clauses.push('status=?'); params.push(status); }
  if (itemId && itemColumn) { clauses.push(field(itemColumn) + '=?'); params.push(itemId); }
  const predicate = clauses.length ? clauses.join(' AND ') : '1=1';
  const [[count]] = await c.execute('SELECT COUNT(*) AS n FROM ' + table(name) + ' WHERE ' + predicate, params);
  const [rows] = await c.execute('SELECT * FROM ' + table(name) + ' WHERE ' + predicate + ' ORDER BY id DESC OFFSET ' + ((page - 1) * pageSize) + ' ROWS FETCH NEXT ' + Number(pageSize) + ' ROWS ONLY', params);
  return { rows, total: Number(count.n) };
}
async function audit(c, principal, action, targetType, targetId, before, after, correlationId) {
  await c.execute('INSERT INTO AuditLog(actor_id,actor_kind,action,target_type,target_id,[before],[after],correlation_id) VALUES (?,?,?,?,?,?,?,?)',
    [principal.accountId, principal.system===true?'SYSTEM':'ACCOUNT', action, targetType, targetId, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, correlationId]);
}
async function lockActor(c, id) {
  const actor=(await c.execute('SELECT id,status,role_id,customer_id FROM TaiKhoan WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE id=?',[id]))[0][0];
  if(!actor)return undefined;
  const role=(await c.execute('SELECT status FROM VaiTroQuyen WITH (HOLDLOCK,ROWLOCK) WHERE id=?',[actor.role_id]))[0][0];
  return {...actor,role_status:role?.status};
}
async function idempotency(c, actor, operation, key) { return (await c.execute('SELECT request_hash,response,response_code FROM IdempotencyRequest WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE account_id=? AND operation=? AND [key]=?', [actor,operation,key]))[0][0]; }
async function saveIdempotency(c, actor, operation, key, hash, result, status) {
  // Keys are not automatically recycled or purged. Retention remains a separate operational decision.
  await c.execute("INSERT INTO IdempotencyRequest(account_id,operation,[key],request_hash,response,response_code,expires_at) VALUES (?,?,?,?,?,?, '9999-12-31 23:59:59.999')", [actor,operation,key,hash,JSON.stringify(result),status]);
}
async function rolePermissions(c,roleId){return(await c.execute('SELECT q.code FROM Quyen q JOIN VaiTro_Quyen v ON v.permission_id=q.id WHERE v.role_id=?',[roleId]))[0].map(r=>r.code);}
async function configureTransaction(c){await c.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');}
module.exports = { find, one, insert, update, page, audit, lockActor, rolePermissions, idempotency, saveIdempotency, configureTransaction };
