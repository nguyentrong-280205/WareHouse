async function loadScopes(connection, accountId) {
  // Until the additive migration is deployed, UC01 remains usable with deny-all business scopes.
  const [[exists]] = await connection.execute("SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_CATALOG=DB_NAME() AND TABLE_SCHEMA='dbo' AND TABLE_NAME IN ('TaiKhoan_Kho','TaiKhoan_Xuong')");
  if (Number(exists.n) !== 2) return { warehouseIds: [], workshopIds: [] };
  const [warehouses] = await connection.execute('SELECT warehouse_id FROM TaiKhoan_Kho WHERE account_id=? ORDER BY warehouse_id', [accountId]);
  const [workshops] = await connection.execute('SELECT workshop_id FROM TaiKhoan_Xuong WHERE account_id=? ORDER BY workshop_id', [accountId]);
  return { warehouseIds: warehouses.map(r=>String(r.warehouse_id)), workshopIds: workshops.map(r=>String(r.workshop_id)) };
}
module.exports = { loadScopes };
