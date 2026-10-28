require('dotenv/config');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const request = require('supertest');
const { createDatabase, withConnection, withTransaction } = require('../../src/config/database');
const { verifyTestDatabase } = require('../../src/shared/test-guard');
const { loadConfig } = require('../../src/config/environment');
const { createApp } = require('../../src/app');
const { createLogger } = require('../../src/shared/logger');
const { createAuthService, digest } = require('../../src/modules/auth/service');
const { requirePermission, assertCustomerScope } = require('../../src/modules/auth/security');
const { createAuthenticate } = require('../../src/modules/auth/middleware');
const { credentials, preparePasswords, createData, cleanupData } = require('../../scripts/uc01-data');
process.env.NODE_ENV = 'test';
const url = process.env.TEST_DATABASE_URL;
const config = loadConfig({ ...process.env, NODE_ENV: 'test', DATABASE_URL: url });
const pool = createDatabase(url);
const guard = c => verifyTestDatabase(c, url, process.env.TEST_ALLOWED_ENDPOINTS, process.env.TEST_INSTANCE_ID);
const prefix = 't_uc01_' + randomUUID().replaceAll('-', '').slice(0, 10) + '_';
const users = credentials(prefix + '.');
let now = Date.now(), fixture;
const service = createAuthService(pool, config, { clock: () => now, beforeBegin: guard });
const app = createApp(config, createLogger('silent'), () => withConnection(pool, c => c.execute('SELECT 1 AS ok')), JSON.parse(readFileSync('../docs/runtime_api.json', 'utf8')), service);
const origin = config.origins[0];
const user = role => users.find(a => a.role === role);
const account = role => fixture.accounts.find(a => a.role === role);
const login = (a = user('board'), password = a.password, cookie) => {
  const r = request(app).post('/api/v1/auth/login').set('Origin', origin).send({ username: a.username, password });
  return cookie ? r.set('Cookie', cookie) : r;
};
const cookie = response => response.headers['set-cookie'][0].split(';')[0];
const change = callback => withTransaction(pool, callback, { beforeBegin: guard });
beforeAll(async () => {
  await withConnection(pool, guard);
  const hashes = await preparePasswords(users, config);
  fixture = await change(c => createData(c, prefix, users, hashes));
}, 30000);
afterAll(async () => { try { if (fixture) await change(c => cleanupData(c, fixture)); } finally { await pool.end(); } });
beforeEach(() => { now = Date.now(); });

test('login and me expose approved contract, HttpOnly cookie, only token hashes and valid audit', async () => {
  const r = await login().expect(200), token = cookie(r).split('=')[1];
  expect(r.headers['set-cookie'][0]).toMatch(/HttpOnly/); expect(r.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
  expect(r.body.accountId).toBe(account('board').id); expect(r.body.customerId).toBeNull();
  expect(r.body.permissions).toContain('reports.read'); expect(r.body.warehouseIds).toEqual([]); expect(r.body.workshopIds).toEqual([]);
  expect(Object.keys(r.body).sort()).toEqual(['accountId', 'displayName', 'role', 'permissions', 'customerId', 'warehouseIds', 'workshopIds', 'csrfToken', 'idleExpiresAt', 'absoluteExpiresAt'].sort());
  await withConnection(pool, async c => {
    const [[s]] = await c.execute('SELECT * FROM PhienDangNhap WHERE token_hash=?', [digest(token)]);
    expect(s.token_hash).not.toBe(token); expect(s.csrf_hash).toBe(digest(r.body.csrfToken));
    const [[a]] = await c.execute('SELECT action,correlation_id FROM AuditLog WHERE actor_id=? ORDER BY id DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY', [account('board').id]);
    expect(a.action).toBe('auth.login'); expect(a.correlation_id).toBe(r.headers['x-request-id']);
  });
  const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie(r)).expect(200);
  expect(me.body.accountId).toBe(r.body.accountId);
  expect(me.headers['cache-control']).toBe('no-store');
});
test('all nine SRS roles log in; two customer accounts share customer boundary, internal accounts have NULL', async () => {
  const sessions = [];
  for (const a of users) sessions.push((await login(a).expect(200)).body);
  const customers = sessions.filter(s => s.customerId !== null);
  expect(customers).toHaveLength(2); expect(customers[0].customerId).toBe(customers[1].customerId);
  expect(customers[0].accountId).not.toBe(customers[1].accountId);
  for (const s of customers) { expect(() => assertCustomerScope(s, fixture.customerId)).not.toThrow(); expect(() => assertCustomerScope(s, '18446744073709551614')).toThrow(); }
  expect(() => assertCustomerScope(sessions.find(s => s.customerId === null), fixture.customerId)).toThrow();
  expect(sessions.some(s => s.permissions.includes('dispositions.decide'))).toBe(false);
});
test('Origin, JSON and strict input validation prevent public login CSRF and forged scope', async () => {
  await request(app).post('/api/v1/auth/login').send(user('board')).expect(403);
  await request(app).post('/api/v1/auth/login').set('Origin', 'https://evil.example').send({}).expect(403);
  await request(app).post('/api/v1/auth/login').set('Origin', origin).type('form').send({ username: 'fake' }).expect(400);
  await request(app).post('/api/v1/auth/login').set('Origin', origin).send({ username: user('board').username, password: user('board').password, customerId: '1' }).expect(422);
  await login(user('board'), 'short').expect(422);
  await login({ ...user('board'), username: "' OR 1=1 --" }).expect(422);
});
test('unknown username and wrong password deny; failed counters commit without sessions or business data', async () => {
  const unknown = await login({ ...user('board'), username: prefix + 'unknown' }).expect(401);
  const wrong = await login(user('purchasing'), 'WrongTestPasswordOnly').expect(401);
  expect(unknown.body.error.message).toBe(wrong.body.error.message);
  await withConnection(pool, async c => {
    const [[a]] = await c.execute('SELECT failed_attempt_count FROM TaiKhoan WHERE id=?', [account('purchasing').id]);
    expect(a.failed_attempt_count).toBe(1);
    const [[s]] = await c.execute('SELECT COUNT(*) AS n FROM PhienDangNhap WHERE account_id=? AND created_at>=?', [account('purchasing').id, new Date(now).toISOString().slice(0, 23).replace('T', ' ')]);
    expect(Number(s.n)).toBe(0);
  });
});
test('five concurrent wrong passwords preserve all attempts and lock for exactly 15 minutes', async () => {
  const responses = await Promise.all(Array.from({ length: 5 }, () => login(user('planner'), 'WrongTestPasswordOnly')));
  expect(responses.map(r => r.status).sort()).toEqual([401, 401, 401, 401, 429]);
  const locked = await login(user('planner')).expect(429); expect(Number(locked.headers['retry-after'])).toBe(900);
  await withConnection(pool, async c => { const [[a]] = await c.execute('SELECT failed_attempt_count,status FROM TaiKhoan WHERE id=?', [account('planner').id]); expect(a.failed_attempt_count).toBe(5); expect(a.status).toBe('ACTIVE'); });
  now += 15 * 60_000;
  await login(user('planner')).expect(200);
  await withConnection(pool, async c => { const [[a]] = await c.execute('SELECT failed_attempt_count,locked_until FROM TaiKhoan WHERE id=?', [account('planner').id]); expect(a.failed_attempt_count).toBe(0); expect(a.locked_until).toBeNull(); });
});
test('attempt window resets after 15 minutes and successful login clears counters', async () => {
  await login(user('workshop'), 'WrongTestPasswordOnly').expect(401);
  now += 15 * 60_000;
  await login(user('workshop'), 'WrongTestPasswordOnly').expect(401);
  await withConnection(pool, async c => { const [[a]] = await c.execute('SELECT failed_attempt_count FROM TaiKhoan WHERE id=?', [account('workshop').id]); expect(a.failed_attempt_count).toBe(1); });
  await login(user('workshop')).expect(200);
});
test('admin-locked account and locked role deny login and immediately invalidate current sessions', async () => {
  const a = account('qc'), r = await login(user('qc')).expect(200);
  try {
    await change(c => c.execute('UPDATE TaiKhoan SET status=? WHERE id=?', ['LOCKED', a.id]));
    await login(user('qc')).expect(401); await request(app).get('/api/v1/auth/me').set('Cookie', cookie(r)).expect(401);
    now += 16 * 60_000; await login(user('qc')).expect(401);
    await change(c => c.execute('UPDATE TaiKhoan SET status=? WHERE id=?', ['ACTIVE', a.id]));
    await change(c => c.execute('UPDATE VaiTroQuyen SET status=? WHERE id=?', ['LOCKED', a.roleId]));
    await login(user('qc')).expect(401); await request(app).get('/api/v1/auth/me').set('Cookie', cookie(r)).expect(401);
  } finally {
    await change(c => c.execute('UPDATE TaiKhoan SET status=? WHERE id=?', ['ACTIVE', a.id]));
    await change(c => c.execute('UPDATE VaiTroQuyen SET status=? WHERE id=?', ['ACTIVE', a.roleId]));
  }
});
test('idle expiry, hard bound, forged cookie and missing session are enforced by SQL Server resolver', async () => {
  await request(app).get('/api/v1/auth/me').expect(401);
  await request(app).get('/api/v1/auth/me').set('Cookie', 'warehouse_session=' + 'a'.repeat(43)).expect(401);
  const r = await login(user('staff')).expect(200);
  now += 29 * 60_000;
  const renewed = await request(app).get('/api/v1/auth/me').set('Cookie', cookie(r)).expect(200);
  expect(renewed.body.absoluteExpiresAt).toBe(r.body.absoluteExpiresAt);
  now += 30 * 60_000;
  await request(app).get('/api/v1/auth/me').set('Cookie', cookie(r)).expect(401);
  now = Date.now(); const hard = await login(user('staff')).expect(200);
  for (let i = 1; i <= 16; i++) {
    now += 29 * 60_000;
    const me = await request(app).get('/api/v1/auth/me').set('Cookie', cookie(hard)).expect(200);
    expect(Date.parse(me.body.idleExpiresAt)).toBeLessThanOrEqual(Date.parse(me.body.absoluteExpiresAt));
  }
  now = Date.parse(hard.body.absoluteExpiresAt);
  await request(app).get('/api/v1/auth/me').set('Cookie', cookie(hard)).expect(401);
});
test('login rotates existing session and stale cookie does not block re-login', async () => {
  const first = await login().expect(200), second = await login(user('board'), user('board').password, cookie(first)).expect(200);
  expect(cookie(first)).not.toBe(cookie(second));
  await request(app).get('/api/v1/auth/me').set('Cookie', cookie(first)).expect(401);
  await login(user('board'), user('board').password, cookie(first)).expect(200);
});
test('audit failure rolls back login session and account counter reset together', async () => {
  const a = account('council');
  await login(user('council'), 'WrongTestPasswordOnly').expect(401);
  let count;
  await withConnection(pool, async c => { const [[s]] = await c.execute('SELECT COUNT(*) AS n FROM PhienDangNhap WHERE account_id=?', [a.id]); count = Number(s.n); });
  await expect(service.login(user('council').username, user('council').password, null, 'x'.repeat(65))).rejects.toMatchObject({ code: 'EREQUEST', number: 2628 });
  await withConnection(pool, async c => {
    const [[s]] = await c.execute('SELECT COUNT(*) AS n FROM PhienDangNhap WHERE account_id=?', [a.id]); expect(Number(s.n)).toBe(count);
    const [[account]] = await c.execute('SELECT failed_attempt_count FROM TaiKhoan WHERE id=?', [a.id]); expect(account.failed_attempt_count).toBe(1);
  });
});
test('logout requires real session, session CSRF and idempotency; revocation/audit commit atomically', async () => {
  const a = await login(user('warehouse')).expect(200), b = await login(user('warehouse')).expect(200);
  const logout = (r, csrf, key) => { const req = request(app).post('/api/v1/auth/logout').set('Cookie', cookie(r)); if (csrf) req.set('X-CSRF-Token', csrf); if (key) req.set('Idempotency-Key', key); return req.send({}); };
  await logout(a, null, 'test').expect(403);
  await logout(a, b.body.csrfToken, 'test').expect(403);
  await logout(a, a.body.csrfToken, null).expect(422);
  await request(app).get('/api/v1/auth/me').set('Cookie', cookie(a)).expect(200);
  const key = randomUUID(), response = await logout(a, a.body.csrfToken, key).expect(204);
  expect(response.headers['set-cookie'][0]).toMatch(/warehouse_session=;/);
  await logout(a, a.body.csrfToken, key).expect(401);
  await logout(b, b.body.csrfToken, key).expect(409);
  await request(app).get('/api/v1/auth/me').set('Cookie', cookie(b)).expect(200);
  await withConnection(pool, async c => { const [[count]] = await c.execute('SELECT COUNT(*) AS n FROM IdempotencyRequest WHERE account_id=? AND [key]=?', [account('warehouse').id, key]); expect(Number(count.n)).toBe(1); });
});
test('current role permissions reload; real principals enforce RBAC and cannot trust forged headers', async () => {
  const r = await login(user('customer')).expect(200), s = r.body;
  function check(principal, permission) { let error; requirePermission(permission)({}, { locals: { principal } }, e => { error = e; }); return error; }
  expect(check(undefined, 'orders.read').status).toBe(401);
  expect(check(s, 'reports.read').status).toBe(403); expect(check(s, 'orders.read')).toBeUndefined();
  const forged = await request(app).get('/api/v1/auth/me').set('Cookie', cookie(r)).set('X-Role', 'admin').set('X-Customer-ID', '999').expect(200);
  expect(forged.body.customerId).toBe(fixture.customerId); expect(forged.body.permissions).not.toContain('reports.read');
  const board = account('board'); const logged = await login().expect(200);
  try {
    await change(c => c.execute('DELETE v FROM VaiTro_Quyen v JOIN Quyen q ON q.id=v.permission_id WHERE v.role_id=? AND q.code=?', [board.roleId, 'reports.read']));
    const current = await request(app).get('/api/v1/auth/me').set('Cookie', cookie(logged)).expect(200);
    expect(current.body.permissions).not.toContain('reports.read');
  } finally {
    await change(c => c.execute('INSERT INTO VaiTro_Quyen(role_id,permission_id) SELECT ?,id FROM Quyen WHERE code=?', [board.roleId, 'reports.read']));
  }
  await request(app).post('/api/v1/orders').set('Cookie', cookie(r)).send({}).expect(403); // No CSRF; no business implementation.
  await request(app).get('/api/v1/orders').set('Cookie', cookie(r)).expect(404);
});
test('authentication middleware + RBAC + customer scope enforce HTTP 401/403/204 using real SQL Server sessions', async () => {
  // Test-only routes; do not expose or implement reports/orders APIs in UC01 runtime.
  const secured = require('express')();
  secured.use(require('cookie-parser')());
  secured.use(require('../../src/shared/http').requestId);
  secured.use(createAuthenticate(service));
  secured.get('/permission', requirePermission('reports.read'), (_req, res) => res.sendStatus(204));
  secured.get('/customer/:id', requirePermission('orders.read'), (req, res) => { assertCustomerScope(res.locals.principal, req.params.id); res.sendStatus(204); });
  secured.use(require('../../src/shared/http').errorHandler(createLogger('silent')));
  const internal = await login().expect(200), customers = users.filter(a => a.role === 'customer');
  await request(secured).get('/permission').set('X-Role', 'admin').expect(401);
  await request(secured).get('/permission').set('Cookie', cookie(internal)).expect(204);
  for (const a of customers) {
    const r = await login(a).expect(200);
    await request(secured).get('/permission').set('Cookie', cookie(r)).set('X-Role', 'board').expect(403);
    await request(secured).get('/customer/' + fixture.customerId).set('Cookie', cookie(r)).expect(204);
    await request(secured).get('/customer/18446744073709551614').set('Cookie', cookie(r)).set('X-Customer-ID', fixture.customerId).expect(403);
  }
  await request(secured).get('/customer/' + fixture.customerId).set('Cookie', cookie(internal)).expect(403);
});
