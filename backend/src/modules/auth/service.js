const { randomBytes, createHash, timingSafeEqual } = require('node:crypto');
const { withTransaction } = require('../../config/database.js');
const { AppError } = require('../../shared/http.js');
const { authPolicy, deriveCsrfToken, nextIdleExpiry } = require('./security.js');
const { hashPassword, verifyPassword } = require('./password.js');
const repo = require('./repository.js');
const digest = value => createHash('sha256').update(value).digest('hex');
const sqlTime = ms => new Date(ms).toISOString().slice(0, 23).replace('T', ' ');
const milliseconds = value => Date.parse(String(value).replace(' ', 'T') + 'Z');
const unauthorized = () => new AppError(401, 'AUTHENTICATION_FAILED', 'Tên đăng nhập hoặc mật khẩu không hợp lệ, hoặc tài khoản không khả dụng.');
const expired = () => new AppError(401, 'SESSION_INVALID', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
function temporaryLock(until, now) {
  const error = new AppError(429, 'LOGIN_TEMPORARILY_LOCKED', 'Đăng nhập tạm khóa. Vui lòng thử lại sau.');
  error.retryAfter = Math.max(1, Math.ceil((until - now) / 1000));
  return error;
}
function createAuthService(pool, config, { clock = Date.now, beforeBegin } = {}) {
  if (config.NODE_ENV === 'test' && !beforeBegin) {
    const { verifyTestDatabase } = require('../../shared/test-guard');
    beforeBegin = c => verifyTestDatabase(c, config.DATABASE_URL, process.env.TEST_ALLOWED_ENDPOINTS, process.env.TEST_INSTANCE_ID);
  }
  // Unknown accounts still perform a real Argon2id verification; no fake database actor.
  let dummyHash;
  const dummy = () => dummyHash ??= hashPassword(randomBytes(32).toString('base64url'), config);
  const transaction = callback => withTransaction(pool, callback, { beforeBegin });
  async function principal(c, a, r, s, token, idle) {
    return { accountId: String(a.id), displayName: a.display_name, role: r.name,
      permissions: await repo.permissions(c, a.role_id), customerId: a.customer_id === null ? null : String(a.customer_id),
      ...await require('./scope-repository').loadScopes(c,a.id), csrfToken: deriveCsrfToken(config.CSRF_SECRET, token),
      idleExpiresAt: new Date(idle).toISOString(), absoluteExpiresAt: new Date(milliseconds(s.absolute_expires_at)).toISOString() };
  }
  async function resolve(c, token) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw expired();
    const hint = await repo.session(c, digest(token));
    if (!hint) throw expired();
    // Account -> role -> session is shared with login/logout. Never lock session first.
    const a = await repo.account(c, hint.account_id);
    const r = a && await repo.role(c, a.role_id);
    const s = await repo.session(c, digest(token), true);
    const now = clock();
    if (!a || a.status !== 'ACTIVE' || !r || r.status !== 'ACTIVE' || !s || s.revoked_at
      || now >= milliseconds(s.idle_expires_at) || now >= milliseconds(s.absolute_expires_at)) throw expired();
    return { a, r, s, now };
  }
  async function login(username, password, oldToken, correlation) {
    const result = await transaction(async c => {
      const hint = await repo.accountByLogin(c, username);
      const old = typeof oldToken === 'string' && /^[A-Za-z0-9_-]{43}$/.test(oldToken)
        ? await repo.session(c, digest(oldToken)) : undefined;
      const ids = [...new Set([hint?.id, old?.account_id].filter(Boolean).map(String))]
        .sort((a, b) => BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0);
      const accounts = new Map();
      for (const id of ids) accounts.set(id, await repo.account(c, id));
      const a = hint && accounts.get(String(hint.id));
      const now = clock();
      if (!a || a.login !== username) {
        await verifyPassword(await dummy(), password);
        return { error: unauthorized() };
      }
      const r = await repo.role(c, a.role_id);
      if(Array.from(password).length<12&&(!require('./simple-demo').allowed(config,username)||a.code!==require('./simple-demo').code(username)))return {error:unauthorized()};
      if (a.status !== 'ACTIVE' || !r || r.status !== 'ACTIVE') return { error: unauthorized() };
      if (a.locked_until && milliseconds(a.locked_until) > now)
        return { error: temporaryLock(milliseconds(a.locked_until), now) };
      if (!await verifyPassword(a.password_hash, password)) {
        const withinWindow = a.failed_window_started_at && now - milliseconds(a.failed_window_started_at) < authPolicy.failedWindowMs;
        const count = withinWindow ? Number(a.failed_attempt_count) + 1 : 1;
        const until = count >= authPolicy.failedAttempts ? now + authPolicy.temporaryLockMs : null;
        await repo.failure(c, a.id, count, withinWindow ? a.failed_window_started_at : sqlTime(now), until ? sqlTime(until) : null, sqlTime(now));
        // Return the failure and commit the approved security counter before producing HTTP error.
        return { error: until ? temporaryLock(until, now) : unauthorized() };
      }
      if (old) {
        const current = await repo.session(c, digest(oldToken), true);
        if (current && !current.revoked_at) await repo.revoke(c, current.id, sqlTime(now));
      }
      await repo.resetFailures(c, a.id, sqlTime(now));
      const token = randomBytes(32).toString('base64url');
      const csrf = deriveCsrfToken(config.CSRF_SECRET, token);
      const hard = now + authPolicy.hardMs, idle = nextIdleExpiry(now, hard);
      const sessionId = await repo.createSession(c, a.id, digest(token), digest(csrf), sqlTime(now), sqlTime(idle), sqlTime(hard));
      await repo.audit(c, a.id, 'auth.login', sessionId, correlation);
      return { token, session: await principal(c, a, r, { absolute_expires_at: sqlTime(hard) }, token, idle) };
    });
    if (result.error) throw result.error;
    return result;
  }
  async function me(token) {
    return transaction(async c => {
      const { a, r, s, now } = await resolve(c, token);
      const idle = nextIdleExpiry(now, milliseconds(s.absolute_expires_at));
      await repo.touch(c, s.id, sqlTime(now), sqlTime(idle));
      return principal(c, a, r, s, token, idle);
    });
  }
  async function logout(token, csrf, key, correlation) {
    return transaction(async c => {
      const { a, s, now } = await resolve(c, token);
      if (!/^[a-f0-9]{64}$/.test(csrf ?? '') || !timingSafeEqual(Buffer.from(digest(csrf)), Buffer.from(s.csrf_hash)))
        throw new AppError(403, 'CSRF_INVALID', 'Invalid CSRF token');
      if (typeof key !== 'string' || key.length < 1 || key.length > 128)
        throw new AppError(422, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key required (1–128 characters)');
      const hash = digest('auth.logout\0' + a.id + '\0' + s.id);
      const existing = await repo.idempotency(c, a.id, key);
      if (existing && existing.request_hash !== hash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key already used for another session');
      if (!existing) await repo.recordLogout(c, a.id, key, hash, s.absolute_expires_at);
      await repo.revoke(c, s.id, sqlTime(now));
      await repo.audit(c, a.id, 'auth.logout', s.id, correlation);
    });
  }
  return { login, me, logout };
}
module.exports = { createAuthService, digest, sqlTime, milliseconds };
