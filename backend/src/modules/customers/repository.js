async function units(c){return(await c.execute('SELECT id,code,name,dimension,discrete,scale FROM DonViTinh ORDER BY id'))[0];}
async function catalog(c,kind){
  const sql={products:'SELECT id,code,name,base_unit_id,container_type,volume_ml,shelf_life_days,description FROM ThanhPham WHERE status=? ORDER BY code',materials:'SELECT id,code,name,base_unit_id FROM NguyenLieu WHERE status=? ORDER BY code',suppliers:'SELECT id,code,name FROM NhaCungCap WHERE status=? ORDER BY code'}[kind];
  if(!sql)throw new Error('INVALID_LOOKUP');return(await c.execute(sql,['ACTIVE']))[0];
}
async function workshops(c,actor){return(await c.execute("SELECT x.id,x.code,x.name FROM XuongSanXuat x JOIN TaiKhoan_Xuong s ON s.workshop_id=x.id WHERE s.account_id=? AND x.status='ACTIVE' ORDER BY x.id",[actor]))[0];}
async function orders(c){
  const[rows]=await c.execute("SELECT id,code,due_date FROM DonHang WHERE status IN ('XAC_NHAN','DANG_GIAO') ORDER BY id DESC");
  for(const r of rows)r.lines=(await c.execute('SELECT id,product_id,qty_base FROM ChiTietDonHang WHERE order_id=?',[r.id]))[0];
  return rows;
}
async function planLines(c,actor){return(await c.execute("SELECT l.id,l.plan_id,l.product_id,l.workshop_id,l.qty_base,l.start_date,l.end_date,p.code AS plan_code,t.code AS product_code,t.name AS product_name,x.name AS workshop_name,u.name AS unit_name FROM ChiTietKeHoachSanXuat l JOIN KeHoachSanXuat p ON p.id=l.plan_id JOIN ThanhPham t ON t.id=l.product_id JOIN XuongSanXuat x ON x.id=l.workshop_id JOIN DonViTinh u ON u.id=t.base_unit_id JOIN TaiKhoan_Xuong s ON s.workshop_id=l.workshop_id AND s.account_id=? WHERE p.status IN ('DA_DUYET','DANG_THUC_HIEN') ORDER BY l.id DESC",[actor]))[0];}
module.exports={units,catalog,workshops,orders,planLines};
