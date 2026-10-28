const { loadConfig } = require('../../src/config/environment');
const { loginInput } = require('../../src/modules/auth/routes');
const { hashPassword, verifyPassword } = require('../../src/modules/auth/password');
const { cookieOptions } = require('../../src/modules/auth/controller');
const { digest } = require('../../src/modules/auth/service');
const input = { DATABASE_URL: 'sqlserver://warehouse_app:placeholder@localhost:60026/warehouse_db', CSRF_SECRET: 'x'.repeat(32), CORS_ORIGINS: 'http://localhost:5173' };
test('approved Argon2 configuration validates and cannot silently downgrade', () => {
  const c = loadConfig(input);
  expect([c.ARGON2_MEMORY_COST, c.ARGON2_TIME_COST, c.ARGON2_PARALLELISM]).toEqual([65536, 3, 1]);
  for (const bad of [{ ARGON2_MEMORY_COST: '19456' }, { ARGON2_TIME_COST: '2' }, { ARGON2_PARALLELISM: '0' }, { ARGON2_TIME_COST: 'invalid' }, { ARGON2_MEMORY_COST: '65536', ARGON2_PARALLELISM: '8193' }, { AUTH_COOKIE_SECURE: 'yes' }]) expect(() => loadConfig({ ...input, ...bad })).toThrow();
  expect(cookieOptions(loadConfig({ ...input, NODE_ENV: 'production' }))).toEqual({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  expect(loadConfig({ ...input, NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'false' }).AUTH_COOKIE_SECURE).toBe(false);
});
test('login normalizes identifier only and rejects extra fields, injection and Unicode password bounds', () => {
  expect(loginInput.parse({ username: ' USER.ONE ', password: '😀'.repeat(12) })).toEqual({ username: 'user.one', password: '😀'.repeat(12) });
  for (const password of ['a'.repeat(11), '😀'.repeat(129)]) expect(() => loginInput.parse({ username: 'user', password })).toThrow();
  for (const username of ["' OR 1=1 --", 'a'.repeat(101), 'á']) expect(() => loginInput.parse({ username, password: 'x'.repeat(12) })).toThrow();
  expect(() => loginInput.parse({ username: 'user', password: 'x'.repeat(12), customerId: '1' })).toThrow();
});
test('real approved Argon2id hash uses random salt and verifies password without truncation', async () => {
  const c = loadConfig(input), password = 'AuthTestOnly_' + '😀'.repeat(12);
  const a = await hashPassword(password, c), b = await hashPassword(password, c);
  expect(a.startsWith('$argon2id$v=19$')).toBe(true);
  expect(a.split('$')[3].split(',').sort()).toEqual(['m=65536', 'p=1', 't=3']);
  expect(a).not.toBe(b);
  expect(await verifyPassword(a, password)).toBe(true);
  expect(await verifyPassword(a, password + 'x')).toBe(false);
  expect(await verifyPassword('plaintext-not-supported', password)).toBe(false);
  expect(digest(a)).toHaveLength(64);
});
