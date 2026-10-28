const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { AppError, requestId, errorHandler } = require('./shared/http.js');
const { csrfProtection } = require('./modules/auth/security.js');
function createApp(config, logger, probe, contract, authService, business) {
    const app = express();
    app.disable('x-powered-by');
    app.use(requestId);
    app.use((req, res, next) => {
        const started = Date.now();
        res.on('finish', () => logger.info({ correlationId: res.locals.correlationId, method: req.method,
            path: req.path, status: res.statusCode, durationMs: Date.now() - started }, 'HTTP request'));
        next();
    });
    app.use(cors({ credentials: true, exposedHeaders:['X-Session-Idle-Expires-At'], origin(origin, callback) {
            if (!origin || config.origins.includes(origin))
                return callback(null, true);
            callback(new AppError(403, 'ORIGIN_FORBIDDEN', 'Origin not allowed'));
        } }));
    app.use(express.json({ limit: '100kb', strict: true }));
    app.use(cookieParser());
    if (authService) app.use('/api/v1/auth', require('./modules/auth/routes.js').createAuthRouter(authService, config));
    app.use(csrfProtection(config.CSRF_SECRET));
    app.use(require('./modules/health/routes.js').createHealthRouter(probe));
    app.get('/api/v1/openapi.json', (_req, res) => res.json(contract));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(contract, { customSiteTitle: 'Warehouse Foundation API' }));
    if (business && authService) app.use('/api/v1', require('./modules/auth/middleware').createAuthenticate(authService), business.router);
    app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found')));
    app.use(errorHandler(logger));
    return app;
}

module.exports = { createApp };
