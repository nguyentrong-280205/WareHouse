require('dotenv/config');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFileSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright-core');
const { loadConfig } = require('../src/config/environment');
const { createDatabase, withConnection, withTransaction } = require('../src/config/database');
const { verifyTestDatabase } = require('../src/shared/test-guard');
const { createApp } = require('../src/app');
const { createLogger } = require('../src/shared/logger');
const { createAuthService } = require('../src/modules/auth/service');
const { checkConnection } = require('../src/modules/health/repository');
const { credentials, preparePasswords, createData, cleanupData } = require('../scripts/uc01-data');
let step = 'configuration';
async function main() {
  process.env.NODE_ENV = 'test';
  const url = process.env.TEST_DATABASE_URL;
  const base = 'http://127.0.0.1:5174'; // Never target default development app for tests that write.
  const config = loadConfig({ ...process.env, NODE_ENV: 'test', DATABASE_URL: url, CORS_ORIGINS: base });
  const pool = createDatabase(url);
  const guard = c => verifyTestDatabase(c, url, process.env.TEST_ALLOWED_ENDPOINTS, process.env.TEST_INSTANCE_ID);
  const transaction = cb => withTransaction(pool, cb, { beforeBegin: guard });
  const prefix = 't_browser_' + randomUUID().replaceAll('-', '').slice(0, 10) + '_';
  const accounts = credentials(prefix + '.');
  let fixture, server, vite, browser;
  const checks = [];
  try {
    await withConnection(pool, guard);
    const hashes = await preparePasswords(accounts, config);
    fixture = await transaction(c => createData(c, prefix, accounts, hashes));
    const service = createAuthService(pool, config, { beforeBegin: guard });
    const app = createApp(config, createLogger('silent'), () => withConnection(pool, checkConnection), JSON.parse(readFileSync('../docs/runtime_api.json', 'utf8')), service);
    step = 'test server';
    server = await new Promise((yes, no) => { const s = app.listen(3001, '127.0.0.1', () => yes(s)); s.once('error', no); });
    vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', '--port=5174', '--strictPort'], {
      cwd: resolve('../frontend'), env: { ...process.env, NODE_ENV: 'development', VITE_API_PROXY_TARGET: 'http://127.0.0.1:3001', VITE_API_URL: '/api' },
      windowsHide: true, stdio: 'ignore',
    });
    vite.on('error', () => {});
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (vite.exitCode !== null) throw new Error('TEST_VITE_EXITED');
      try { ready = (await fetch(base + '/api/v1/health', { signal: AbortSignal.timeout(1000) })).ok; } catch {}
      if (ready) break;
      await delay(200);
    }
    if (!ready) throw new Error('TEST_VITE_NOT_READY');
    browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(), pageErrors = [];
    page.on('pageerror', () => pageErrors.push('PAGE_ERROR'));
    mkdirSync('.artifacts', { recursive: true });
    const byRole = role => accounts.find(a => a.role === role);
    async function fill(a, password = a.password) {
      await page.getByLabel('Tên đăng nhập', { exact: true }).fill(a.username);
      await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    }
    async function logout() {
      await page.locator('header button').filter({ hasText: 'Demo ' }).click();
      await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
      await page.waitForURL(base + '/login');
    }
    step = 'public route guard';
    await page.goto(base + '/dashboard');
    await page.waitForURL(base + '/login');
    await page.getByRole('heading', { name: 'Đăng nhập hệ thống' }).waitFor();
    await page.screenshot({ path: '.artifacts/uc01-login.png', fullPage: true });
    checks.push('unauthenticated direct route -> login');
    step = 'wrong password';
    await fill(byRole('board'), 'WrongBrowserTestPassword');
    await page.getByRole('alert').filter({ hasText: 'không hợp lệ' }).waitFor();
    assert.equal(await page.getByLabel('Mật khẩu', { exact: true }).inputValue(), '');
    checks.push('wrong password denied and password field cleared');
    step = 'locked account';
    const qc = fixture.accounts.find(a => a.role === 'qc');
    await transaction(c => c.execute('UPDATE TaiKhoan SET status=? WHERE id=?', ['LOCKED', qc.id]));
    await fill(byRole('qc'));
    await page.getByRole('alert').filter({ hasText: 'không hợp lệ' }).waitFor();
    checks.push('locked account denied');
    step = 'board login';
    await fill(byRole('board'));
    await page.waitForURL(base + '/');
    await page.locator('aside a[href="/dashboard"]').waitFor();
    await page.getByRole('heading').filter({ hasText: 'Hệ thống Quản lý Kho' }).waitFor();
    await page.screenshot({ path: '.artifacts/uc01-home-board.png', fullPage: true });
    assert.deepEqual(await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) })), { local: [], session: [] });
    const cookies = await context.cookies();
    assert.equal(cookies.find(c => c.name === 'warehouse_session')?.httpOnly, true);
    assert.equal(await page.evaluate(() => document.cookie.includes('warehouse_session')), false);
    checks.push('correct login -> /; HttpOnly; no browser storage secrets');
    step = 'reload and dashboard regression';
    await page.reload(); await page.locator('aside a[href="/dashboard"]').waitFor();
    await page.goto(base + '/dashboard');
    await page.getByRole('heading', { name: 'Lô sắp hết hạn', exact: true }).waitFor();
    await page.screenshot({ path: '.artifacts/uc01-dashboard.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '.artifacts/uc01-dashboard-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    checks.push('reload restores session; existing Home/Dashboard desktop/mobile render');
    step = 'logout'; await logout();
    const loggedOut = await page.evaluate(async () => (await fetch('/api/v1/auth/me')).status);
    assert.equal(loggedOut, 401); checks.push('logout revokes session and returns to login');
    step = 'customer permissions';
    await fill(byRole('customer')); await page.waitForURL(base + '/');
    await page.locator('aside a[href="/"]').waitFor();
    assert.equal(await page.locator('aside a[href="/dashboard"]').count(), 0);
    assert.equal(await page.locator('aside a[href="/users"]').count(), 0);
    await page.screenshot({ path: '.artifacts/uc01-home-customer.png', fullPage: true });
    await page.goto(base + '/dashboard');
    await page.getByRole('alert').filter({ hasText: 'không có quyền' }).waitFor();
    checks.push('customer menu and direct dashboard access denied');
    const health = await page.evaluate(async () => { const r = await fetch('/api/v1/health'); return { status: r.status, body: await r.json() }; });
    assert.equal(health.status, 200); assert.equal(health.body.data.database, 'connected');
    assert.deepEqual(pageErrors, []);
    console.log('UC01 browser PASS (guarded warehouse_test): ' + checks.join('; ') + '; proxy health; no page errors.');
  } finally {
    if (browser) await browser.close();
    if (vite) { const stopped = new Promise(done => vite.once('exit', done)); vite.kill(); await Promise.race([stopped, delay(3000)]); }
    if (server) await new Promise(done => server.close(done));
    try { if (fixture) await transaction(c => cleanupData(c, fixture)); } finally { await pool.end(); }
  }
}
main().catch(() => { console.error('UC01_BROWSER_FAILED at ' + step + '; no secret output.'); process.exitCode = 1; });
