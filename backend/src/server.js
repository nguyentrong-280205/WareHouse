require('dotenv/config');
const { readFileSync } = require('node:fs');
const { loadConfig } = require('./config/environment.js');
const { createLogger } = require('./shared/logger.js');
const { createDatabase, withConnection } = require('./config/database.js');
const { createApp } = require('./app.js');
const { checkConnection } = require('./modules/health/repository.js');
const logger = createLogger(process.env.LOG_LEVEL);
try {
    const config = loadConfig();
    const db = createDatabase(config.DATABASE_URL);
    const contract = JSON.parse(readFileSync(process.env.OPENAPI_FILE ?? '../docs/runtime_api.json', 'utf8'));
    const auth = require('./modules/auth/service.js').createAuthService(db, config);
    const planned = JSON.parse(readFileSync(process.env.PLANNED_OPENAPI_FILE ?? '../docs/api_contract.yaml','utf8'));
    const business = require('./business').createBusiness(db,config,planned);
    const implemented = new Set(Object.keys(business.handlers));
    for (const [path,item] of Object.entries(planned.paths)) for (const [method,operation] of Object.entries(item))
        if (implemented.has(operation.operationId)) { contract.paths['/api/v1'+path] ??= {}; contract.paths['/api/v1'+path][method]=operation; }
    for (const [group,values] of Object.entries(planned.components)) contract.components[group] = { ...contract.components[group],...values };
    const app = createApp(config, logger, () => withConnection(db, checkConnection), contract, auth, business);
    const stopMaintenance=require('./modules/inventory/maintenance').startMaintenance(db,config,logger);
    const server = app.listen(config.PORT, config.HOST, () => logger.info({ port: config.PORT }, 'Warehouse server listening'));
    server.on('error', () => {
        logger.error({ code: 'HTTP_LISTEN_FAILED' }, 'Cannot bind HTTP port');
        void db.end().then(() => { process.exitCode = 1; });
    });
    const shutdown = () => {
        stopMaintenance();
        server.close(() => void db.end().then(() => process.exit(0)));
        setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
}
catch {
    logger.error({ code: 'STARTUP_FAILED' }, 'Startup failed; check configuration without logging secrets');
    process.exitCode = 1;
}
