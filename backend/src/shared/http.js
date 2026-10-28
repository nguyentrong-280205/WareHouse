const { randomUUID } = require('node:crypto');
const { ZodError } = require('zod');
class AppError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
const requestId = (req, res, next) => {
    const incoming = req.get('X-Request-ID');
    res.locals.correlationId = incoming && /^[A-Za-z0-9_-]{1,64}$/.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-ID', res.locals.correlationId);
    next();
};
function validateBody(schema) {
    return (req, _res, next) => { try {
        req.body = schema.parse(req.body);
        next();
    }
    catch (err) {
        next(err);
    } };
}
function errorHandler(logger) {
    return (err, _req, res, _next) => {
        if (res.headersSent)
            return _next(err);
        let status = 500, code = 'INTERNAL_ERROR', message = 'Internal server error';
        let fieldErrors;
        if (err instanceof AppError) {
            status = err.status;
            code = err.code;
            message = err.message;
            if (err.retryAfter) res.set('Retry-After', String(err.retryAfter));
        }
        else if (err instanceof ZodError) {
            status = 422;
            code = 'VALIDATION_FAILED';
            message = 'Invalid request';
            fieldErrors = err.issues.map(i => ({ field: i.path.join('.'), message: 'Invalid value' }));
        }
        else if ([2601,2627].includes(err?.number)) {
            status = 409; code = 'DUPLICATE_CODE'; message = 'Mã hoặc phiên bản đã tồn tại.';
        }
        else if (err?.number === 547) {
            const check = /CHECK constraint/i.test(err.message || '');
            status = check ? 422 : 409; code = check ? 'CONSTRAINT_INVALID' : 'REFERENCE_INVALID';
            message = check ? 'Dữ liệu vi phạm ràng buộc nghiệp vụ.' : 'Dữ liệu tham chiếu không hợp lệ hoặc đang được sử dụng.';
        }
        else if (err?.number === 515) {
            status = 422; code = 'CONSTRAINT_INVALID'; message = 'Dữ liệu vi phạm ràng buộc nghiệp vụ.';
        }
        else if ([245,241,242,8114,8115,8152,2628].includes(err?.number)) {
            status = 422; code = 'VALUE_OUT_OF_RANGE'; message = 'Giá trị vượt kiểu dữ liệu hoặc độ chính xác cho phép.';
        }
        else if ([1205,1222].includes(err?.number) || ['ETIMEOUT','EABORT'].includes(err?.code)) {
            status = 409; code = 'CONCURRENT_UPDATE'; message = 'Có giao dịch cạnh tranh; tải lại dữ liệu và gửi lại yêu cầu với cùng Idempotency-Key.';
        }
        else if (err?.number === 208) {
            status = 503; code = 'MIGRATION_REQUIRED'; message = 'Cần áp dụng migration của phiên bản ứng dụng trước khi sử dụng chức năng.';
        }
        else if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
            status = 400;
            code = 'MALFORMED_JSON';
            message = 'Malformed JSON';
        }
        else if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.too.large') {
            status = 413;
            code = 'PAYLOAD_TOO_LARGE';
            message = 'Payload too large';
        }
        logger[status >= 500 ? 'error' : 'warn']({ code, status, correlationId: res.locals.correlationId }, 'Request rejected');
        res.status(status).json({ error: { code, message, correlationId: res.locals.correlationId, ...(fieldErrors ? { fieldErrors } : {}) } });
    };
}

module.exports = { AppError, requestId, validateBody, errorHandler };
