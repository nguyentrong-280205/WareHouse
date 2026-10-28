const { createHmac, timingSafeEqual } = require('node:crypto');
const { AppError } = require('../../shared/http.js');
const authPolicy = Object.freeze({ idleMs: 30 * 60_000, hardMs: 8 * 60 * 60_000,
    failedAttempts: 5, failedWindowMs: 15 * 60_000, temporaryLockMs: 15 * 60_000,
    passwordMin: 12, passwordMax: 128 });
function deriveCsrfToken(secret, sessionToken) {
    return createHmac('sha256', secret).update('warehouse-csrf\0' + sessionToken).digest('hex');
}
function csrfProtection(secret) {
    return (req, _res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method))
            return next();
        const sessionToken = req.cookies?.warehouse_session;
        // Cookie presence is NEVER authentication. Auth routes resolve the MySQL session separately;
        // public login uses Origin + JSON and is mounted before this session-CSRF middleware.
        if (!sessionToken)
            return next();
        const actual = req.get('X-CSRF-Token') ?? '';
        const expected = deriveCsrfToken(secret, String(sessionToken));
        if (!/^[a-f0-9]{64}$/.test(actual) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
            return next(new AppError(403, 'CSRF_INVALID', 'Invalid CSRF token'));
        }
        next();
    };
}
function requirePermission(permission) {
    return (_req, res, next) => {
        const principal = res.locals.principal;
        if (!principal)
            return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required'));
        if (!principal.permissions.includes(permission))
            return next(new AppError(403, 'FORBIDDEN', 'Permission denied'));
        next();
    };
}
function assertCustomerScope(principal, customerId) {
    if (!principal.customerId || principal.customerId !== customerId)
        throw new AppError(403, 'FORBIDDEN', 'Customer scope denied');
}
function nextIdleExpiry(now, hardExpiry) {
    if (now >= hardExpiry)
        throw new AppError(401, 'SESSION_EXPIRED', 'Session expired');
    return Math.min(now + authPolicy.idleMs, hardExpiry);
}

module.exports = { authPolicy, deriveCsrfToken, csrfProtection, requirePermission, assertCustomerScope, nextIdleExpiry };
