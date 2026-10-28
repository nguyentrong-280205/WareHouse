const { pino } = require('pino');
function createLogger(level = 'info') {
    return pino({ level, base: { service: 'warehouse-foundation' },
        redact: { paths: ['password', 'passwordHash', 'token', 'cookie', 'authorization', 'databaseUrl', 'csrfToken', 'secret'], censor: '[REDACTED]' } });
}

module.exports = { createLogger };
