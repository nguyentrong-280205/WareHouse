require('dotenv/config');
const { mkdirSync, existsSync, writeFileSync, readFileSync } = require('node:fs');
const { loadConfig } = require('../src/config/environment');
const { createDatabase, withTransaction } = require('../src/config/database');
const { credentials, preparePasswords, createData } = require('./uc01-data');
const { verifyPassword } = require('../src/modules/auth/password');
const file = '.artifacts/uc01-demo-credentials.json';
const guide = '.artifacts/UC01-demo-login.local.md';
function writePrivateGuide(accounts) {
  if (existsSync(guide)) return;
  const lines = ['# UC01 — Hướng dẫn đăng nhập demo cục bộ (RIÊNG TƯ)', '',
    'Mở http://localhost:8080/login. Đăng nhập thành công về trang chủ /. Menu tùy quyền; các trang nghiệp vụ còn mock/placeholder.', '',
    'File này chứa mật khẩu demo ngẫu nhiên: chỉ dùng cục bộ, đã được Git/Docker ignore; không chia sẻ/GitHub/log.', '',
    '| Tên đăng nhập | Vai trò | Mật khẩu cục bộ |', '|---|---|---|'];
  for (const a of accounts) lines.push('| ' + a.username + ' | ' + a.role + ' | ' + a.password + ' |');
  lines.push('', 'Hai tài khoản customer/customer2 cùng một khách hàng giả. Tài khoản khác customer_id NULL.',
    'Đăng xuất từ menu tên người dùng ở góc trên phải. Sai 5 lần/15 phút khóa tạm 15 phút; không tự reset dữ liệu.',
    'Không chạy test tự động trên database demo: npm test, npm run test:integration, npm run test:browser dùng warehouse_test.', '');
  writeFileSync(guide, lines.join('\n'), { flag: 'wx', mode: 0o600 });
}
async function main() {
  const config = loadConfig();
  if (config.NODE_ENV !== 'development' || config.db.database !== 'warehouse_db' || config.db.user !== 'warehouse_app' || !(config.db.instance === 'HTTT02' || config.db.machine === 'warehouse-sqlserver')) throw new Error('UNSAFE_DEMO_TARGET');
  const pool = createDatabase(config.DATABASE_URL);
  try {
    mkdirSync('.artifacts', { recursive: true });
    const accounts = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).accounts : credentials('uc01.');
    const hashes = await preparePasswords(accounts, config);
    await withTransaction(pool, async c => {
      await require('./sqlserver-demo-guard').guardDemo(c,config);
      const [existing] = await c.execute('SELECT login,password_hash FROM TaiKhoan WHERE code LIKE ?', ['UC01_DEMO_%']);
      if (existing.length) {
        if (!existsSync(file) || existing.length !== accounts.length) throw new Error('DEMO_CONFLICT_NO_OVERWRITE');
        for (const a of accounts) {
          const row = existing.find(r => r.login === a.username);
          if (!row || !await verifyPassword(row.password_hash, a.password)) throw new Error('DEMO_CONFLICT_NO_OVERWRITE');
        }
        writePrivateGuide(accounts);
        return;
      }
      await createData(c, 'UC01_DEMO_', accounts, hashes);
      // Exclusive local credential file. If writing fails, the database transaction rolls back.
      if (!existsSync(file)) writeFileSync(file, JSON.stringify({ purpose: 'Private UC01 local demo; never publish', accounts }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      writePrivateGuide(accounts);
    });
    console.log('UC01 demo ready: 9 SRS roles, 1 fake customer, 10 accounts. Private local guide: backend/.artifacts/UC01-demo-login.local.md (passwords not logged).');
  } finally { await pool.end(); }
}
main().catch(() => { console.error('UC01_DEMO_SEED_FAILED: no overwrite; check target/conflicts locally without logging secrets.'); process.exitCode = 1; });
