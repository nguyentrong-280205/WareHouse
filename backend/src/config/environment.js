const { readFileSync } = require('node:fs');
const { z } = require('zod');
const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    CSRF_SECRET: z.string().min(32),
    CORS_ORIGINS: z.string().min(1),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
    ARGON2_MEMORY_COST: z.coerce.number().int().min(65536).max(4294967295).default(65536),
    ARGON2_TIME_COST: z.coerce.number().int().min(3).max(4294967295).default(3),
    ARGON2_PARALLELISM: z.coerce.number().int().min(1).max(16777215).default(1),
    AUTH_COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    AUTH_ALLOW_SIMPLE_DEMO: z.enum(['true','false']).default('false'),
});
function parseDatabaseUrl(value) {
    let url;
    try {
        url = new URL(value);
    }
    catch {
        throw new Error('INVALID_DATABASE_URL');
    }
    if (url.protocol !== 'sqlserver:' || !url.username || !url.password || ['sa','root'].includes(decodeURIComponent(url.username).toLowerCase())) {
        throw new Error('INVALID_DATABASE_CONFIGURATION');
    }
    const database = decodeURIComponent(url.pathname.slice(1));
    if (!['warehouse_db', 'warehouse_test'].includes(database))
        throw new Error('UNEXPECTED_DATABASE_NAME');
    const instance = url.searchParams.get('instance');
    if (!url.port && !instance) throw new Error('SQLSERVER_ENDPOINT_REQUIRED');
    if (instance && !/^[A-Za-z0-9_]+$/.test(instance)) throw new Error('INVALID_SQLSERVER_INSTANCE');
    const port = url.port ? Number(url.port) : undefined;
    if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) throw new Error('INVALID_SQLSERVER_PORT');
    const machine = url.searchParams.get('machine');
    if (machine && (machine !== 'warehouse-sqlserver' || instance)) throw new Error('INVALID_SQLSERVER_MACHINE');
    return { host: url.hostname, port, instance, machine, user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password), database,
        encrypt: true, trustServerCertificate: url.searchParams.get('trustServerCertificate') === 'true' };
}
function loadConfig(input = process.env) {
    const values = { ...input };
    for (const key of ['DATABASE_URL', 'CSRF_SECRET']) {
        if (values[key + '_FILE'])
            values[key] = readFileSync(values[key + '_FILE'], 'utf8').trim();
    }
    const result = schema.safeParse(values);
    if (!result.success)
        throw new Error('INVALID_ENVIRONMENT_FIELDS: ' + result.error.issues.map(x => x.path.join('.')).join(','));
    const db = parseDatabaseUrl(result.data.DATABASE_URL);
    if ((result.data.NODE_ENV === 'test') !== (db.database === 'warehouse_test'))
        throw new Error('ENVIRONMENT_DATABASE_MISMATCH');
    const origins = result.data.CORS_ORIGINS.split(',').map(x => x.trim());
    if (origins.some(x => { try {
        const u = new URL(x);
        return !['http:', 'https:'].includes(u.protocol) || u.origin !== x;
    }
    catch {
        return true;
    } })) {
        throw new Error('INVALID_CORS_ORIGINS');
    }
    if (result.data.ARGON2_MEMORY_COST < 8 * result.data.ARGON2_PARALLELISM)
        throw new Error('INVALID_ARGON2_MEMORY_PARALLELISM');
    if(result.data.AUTH_ALLOW_SIMPLE_DEMO==='true'&&(db.database!=='warehouse_db'||origins.some(origin=>!['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname))))throw new Error('SIMPLE_DEMO_REQUIRES_LOCAL_ENVIRONMENT');
    return { ...result.data, db, origins, AUTH_ALLOW_SIMPLE_DEMO:result.data.AUTH_ALLOW_SIMPLE_DEMO==='true', AUTH_COOKIE_SECURE: result.data.AUTH_COOKIE_SECURE
        ? result.data.AUTH_COOKIE_SECURE === 'true' : result.data.NODE_ENV === 'production' };
}

module.exports = { parseDatabaseUrl, loadConfig };
