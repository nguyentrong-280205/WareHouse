const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const { loadConfig, parseDatabaseUrl } = require('../../src/config/environment.js');
const { assertTestTarget } = require('../../src/shared/test-guard.js');
const { createLogger } = require('../../src/shared/logger.js');
const { createApp } = require('../../src/app.js');
const { errorHandler, requestId, validateBody } = require('../../src/shared/http.js');
const { deriveCsrfToken, csrfProtection, requirePermission, assertCustomerScope, nextIdleExpiry, authPolicy } = require('../../src/modules/auth/security.js');
const environment = { NODE_ENV: 'development', DATABASE_URL: 'sqlserver://warehouse_app:fixture-only@127.0.0.1:60026/warehouse_db',
    CSRF_SECRET: 'fixture-csrf-secret-with-more-than-32-chars', CORS_ORIGINS: 'http://localhost:5173', LOG_LEVEL: 'silent' };
const config = loadConfig(environment), logger = createLogger('silent');
test('environment validates types and refuses unsafe database identity without disclosing values', () => {
    assert.equal(config.PORT, 3000);
    assert.throws(() => loadConfig({ ...environment, PORT: 'bad' }), /PORT/);
    assert.throws(() => loadConfig({ ...environment, NODE_ENV: 'test' }), /MISMATCH/);
    assert.throws(() => parseDatabaseUrl('sqlserver://root:fixture@localhost/warehouse_db'), /INVALID_DATABASE_CONFIGURATION/);
    assert.throws(() => loadConfig({ ...environment, CSRF_SECRET: 'not-a-real-secret' }), err => {
        assert.ok(err instanceof Error);
        assert.ok(!err.message.includes('not-a-real-secret'));
        return true;
    });
});
test('test guards refuse dev database, wrong host/port/user or missing marker before writes', () => {
    const marker = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const url = 'sqlserver://warehouse_test_app:fixture-only@127.0.0.1:60027/warehouse_test';
    assert.doesNotThrow(() => assertTestTarget('test', url, '127.0.0.1:60027', marker));
    assert.throws(() => assertTestTarget('development', url, '127.0.0.1:60027', marker));
    assert.throws(() => assertTestTarget('test', environment.DATABASE_URL, '127.0.0.1:60026', marker));
    assert.throws(() => assertTestTarget('test', url, '127.0.0.1:60026', marker));
    assert.throws(() => assertTestTarget('test', url, '127.0.0.1:60027', undefined));
});
test('hard expiry cannot be extended by idle renewal', () => {
    assert.equal(nextIdleExpiry(100, 200), 200);
    assert.equal(nextIdleExpiry(0, authPolicy.hardMs), authPolicy.idleMs);
    assert.throws(() => nextIdleExpiry(200, 200), /Session expired/);
});
test('customer scope permits multiple principals of same customer and denies other/internal scope', () => {
    assert.doesNotThrow(() => assertCustomerScope({ accountId: '1', customerId: '42', permissions: [] }, '42'));
    assert.doesNotThrow(() => assertCustomerScope({ accountId: '2', customerId: '42', permissions: [] }, '42'));
    assert.throws(() => assertCustomerScope({ accountId: '3', customerId: '43', permissions: [] }, '42'));
    assert.throws(() => assertCustomerScope({ accountId: '4', customerId: null, permissions: [] }, '42'));
});
test('CSRF is bound to opaque cookie, cannot be forged or reused across sessions', async () => {
    const app = express();
    app.use(requestId, require('cookie-parser')(), csrfProtection(config.CSRF_SECRET));
    app.post('/fixture', (_req, res) => res.sendStatus(204));
    app.use(errorHandler(logger));
    await request(app).post('/fixture').set('Cookie', 'warehouse_session=fixture-A').expect(403);
    await request(app).post('/fixture').set('Cookie', 'warehouse_session=fixture-A')
        .set('X-CSRF-Token', deriveCsrfToken(config.CSRF_SECRET, 'fixture-A')).expect(204);
    await request(app).post('/fixture').set('Cookie', 'warehouse_session=fixture-B')
        .set('X-CSRF-Token', deriveCsrfToken(config.CSRF_SECRET, 'fixture-A')).expect(403);
});
test('RBAC scaffold denies untrusted or absent principal', async () => {
    const app = express();
    app.use(requestId);
    app.get('/fixture', requirePermission('fixture.read'), (_req, res) => res.sendStatus(204));
    app.use(errorHandler(logger));
    await request(app).get('/fixture').set('X-Account-ID', '1').expect(401);
});
test('validation and error boundary sanitize body/errors and preserve correlation ID', async () => {
    const app = express();
    app.use(requestId, express.json());
    app.post('/fixture', validateBody(z.object({ quantity: z.number().positive() }).strict()), (_req, res) => res.sendStatus(204));
    app.get('/unexpected', () => { throw new Error('sqlserver://private:secret@database'); });
    app.use(errorHandler(logger));
    const invalid = await request(app).post('/fixture').send({ quantity: -1, password: 'never-log' }).expect(422);
    assert.equal(invalid.body.error.code, 'VALIDATION_FAILED');
    assert.ok(!JSON.stringify(invalid.body).includes('never-log'));
    const malformed = await request(app).post('/fixture').set('Content-Type', 'application/json').send('{').expect(400);
    assert.equal(malformed.body.error.code, 'MALFORMED_JSON');
    const failure = await request(app).get('/unexpected').set('X-Request-ID', 'unit-correlation').expect(500);
    assert.equal(failure.body.error.correlationId, 'unit-correlation');
    assert.ok(!JSON.stringify(failure.body).includes('private'));
});
test('health degrades safely when database unavailable; no business routes implemented', async () => {
    const app = createApp(config, logger, async () => { throw new Error('private credentials'); }, {});
    const response = await request(app).get('/health').expect(503);
    assert.equal(response.body.data.database, 'unavailable');
    assert.ok(!JSON.stringify(response.body).includes('credentials'));
    await request(app).post('/api/v1/auth/login').send({ username: 'fixture', password: 'fixture' }).expect(404);
    await request(app).get('/api/v1/materials').expect(404);
    await request(app).get('/health').set('Origin', 'http://untrusted.invalid').expect(403);
});
