const { randomBytes } = require('node:crypto');
const { hashPassword } = require('../src/modules/auth/password');
// SRS section 14 + permissions.md; no support/admin or CHUA_DUYET actions.
const roles = [
  { code: 'customer', name: 'Khách hàng', permissions: ['orders.create', 'orders.read', 'orders.submit'] },
  { code: 'planner', name: 'Bộ phận lập kế hoạch', permissions: ['plans.create', 'plans.read'] },
  { code: 'purchasing', name: 'Bộ phận mua hàng', permissions: ['purchases.create', 'purchases.read', 'purchases.submit'] },
  { code: 'board', name: 'Ban giám đốc', permissions: ['plans.decide', 'reports.read', 'adjustments.decide', 'purchases.decide'] },
  { code: 'warehouse', name: 'Quản lý kho / Bộ phận quản lý kho', permissions: ['reports.read', 'inventory.search', 'variances.verify',
    'materials.read', 'materials.write', 'dispositions.create', 'dispositions.execute', 'warehouses.read', 'warehouses.write',
    'productLots.read', 'productLots.write', 'products.read', 'products.write', 'materialLots.read', 'materialLots.write',
    'receipts.read', 'receipts.allocate', 'receipts.confirmAllocation', 'issues.read', 'issues.allocate', 'issues.confirmAllocation'] },
  { code: 'staff', name: 'Nhân viên kho', permissions: ['inventory.search', 'issues.postSale', 'issues.postMaterial', 'receipts.postProduct', 'receipts.postReturn', 'receipts.postMaterial'] },
  { code: 'qc', name: 'Bộ phận QC', permissions: ['productQc.read', 'productQc.write', 'returnQc.read', 'returnQc.write', 'materialQc.read', 'materialQc.write'] },
  { code: 'workshop', name: 'Xưởng sản xuất', permissions: ['materialRequests.create', 'materialRequests.read', 'materialRequests.submit', 'productRequests.create', 'productRequests.read', 'productRequests.submit'] },
  { code: 'council', name: 'Hội đồng kiểm kê', permissions: ['stocktakes.count', 'stocktakes.confirm'] },
];
function credentials(loginPrefix) {
  return [...roles.map(r => ({ username: loginPrefix + r.code, role: r.code, password: randomBytes(24).toString('base64url') })),
    { username: loginPrefix + 'customer2', role: 'customer', password: randomBytes(24).toString('base64url') }];
}
async function preparePasswords(accounts, config) {
  const hashes = new Map();
  for (const a of accounts) hashes.set(a.username, await hashPassword(a.password, config));
  return hashes;
}
async function createData(c, prefix, accounts, hashes) {
  const fixture = { prefix, accounts: [], roles: [], permissions: [], customerId: null };
  const inserted = async (text, values) => String((await c.execute(text,values))[0][0].id);
  fixture.customerId = await inserted('INSERT INTO KhachHang(code,name,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?,SYSUTCDATETIME())', [prefix + 'customer', 'Khách hàng giả UC01']);
  for (const r of roles) {
    const roleId = await inserted('INSERT INTO VaiTroQuyen(code,name,description) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?,?)', [prefix + r.code, r.name, 'UC01 demo/test only; no warehouse/workshop scope assigned']);
    fixture.roles.push(roleId);
    for (const permission of r.permissions) {
      const [existing] = await c.execute('SELECT id FROM Quyen WHERE code=?', [permission]);
      let permissionId = existing[0]?.id;
      if (!permissionId) {
        permissionId = await inserted('INSERT INTO Quyen(code,description) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?)', [permission, 'Action from SRS/permissions.md']);
        fixture.permissions.push(permissionId);
      }
      await c.execute('INSERT INTO VaiTro_Quyen(role_id,permission_id) VALUES (?,?)', [roleId, permissionId]);
    }
    for (const a of accounts.filter(a => a.role === r.code)) {
      const accountId = await inserted('INSERT INTO TaiKhoan(code,login,password_hash,display_name,role_id,customer_id,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?,?,?,?,?,SYSUTCDATETIME())',
        [prefix + a.username.split('.').at(-1), a.username, hashes.get(a.username), 'Demo ' + r.name, roleId, r.code === 'customer' ? fixture.customerId : null]);
      fixture.accounts.push({ id: accountId, roleId, username: a.username, role: a.role });
    }
  }
  return fixture;
}
async function cleanupData(c, fixture) {
  // Only IDs created by this guarded test invocation; never reset/truncate databases.
  for (const a of fixture.accounts) {
    const [owned] = await c.execute('SELECT id FROM TaiKhoan WHERE id=? AND code=? AND login=?', [a.id, fixture.prefix + a.username.split('.').at(-1), a.username]);
    if (owned.length !== 1) throw new Error('TEST_FIXTURE_OWNERSHIP_MISMATCH');
    await c.execute('DELETE FROM AuditLog WHERE actor_id=?', [a.id]);
    await c.execute('DELETE FROM IdempotencyRequest WHERE account_id=?', [a.id]);
    await c.execute('DELETE FROM PhienDangNhap WHERE account_id=?', [a.id]);
    await c.execute('DELETE FROM TaiKhoan WHERE id=?', [a.id]);
  }
  for (const roleId of fixture.roles) {
    await c.execute('DELETE FROM VaiTro_Quyen WHERE role_id=?', [roleId]);
    await c.execute('DELETE FROM VaiTroQuyen WHERE id=?', [roleId]);
  }
  for (const permissionId of fixture.permissions)
    await c.execute('DELETE FROM Quyen WHERE id=? AND NOT EXISTS (SELECT 1 FROM VaiTro_Quyen WHERE permission_id=?)', [permissionId, permissionId]);
  await c.execute('DELETE FROM KhachHang WHERE id=? AND code=?', [fixture.customerId, fixture.prefix + 'customer']);
}
module.exports = { roles, credentials, preparePasswords, createData, cleanupData };
