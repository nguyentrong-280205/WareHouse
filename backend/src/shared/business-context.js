const { createHash } = require('node:crypto');
const { withTransaction, withConnection } = require('../config/database');
const { verifyTestDatabase } = require('./test-guard');
const { AppError } = require('./http');
const repo = require('./business-repository');
function fail(status, code, message) { throw new AppError(status, code, message); }
function requireRow(row) { if (!row) fail(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu trong phạm vi truy cập.'); return row; }
function expectVersion(row, version) { if (!Number.isInteger(version) || Number(row.version) !== version) fail(409, 'STALE_VERSION', 'Dữ liệu đã thay đổi. Hãy tải lại.'); }
function expectState(row, states) { if (!states.includes(row.status)) fail(409, 'INVALID_STATE', 'Trạng thái chứng từ không cho phép thao tác này.'); }
function scope(principal, warehouseId) { if (!principal.warehouseIds.includes(String(warehouseId))) fail(403, 'SCOPE_FORBIDDEN', 'Không được cấp phạm vi kho này.'); }
function businessDate() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date()); }
function now() { return new Date().toISOString().slice(0,23).replace('T',' '); }
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function createBusinessContext(pool, config) {
  const guard = config.NODE_ENV === 'test' ? c => verifyTestDatabase(c, config.DATABASE_URL, process.env.TEST_ALLOWED_ENDPOINTS, process.env.TEST_INSTANCE_ID) : undefined;
  const read = callback => withConnection(pool, callback);
  async function write(request, operation, callback, status = 200) {
    const key = request.key;
    if (typeof key !== 'string' || key.length < 1 || key.length > 128) fail(422,'IDEMPOTENCY_KEY_REQUIRED','Cần Idempotency-Key (1–128 ký tự).');
    const hash = createHash('sha256').update(canonical({ params: request.params, body: request.body })).digest('hex');
    return withTransaction(pool, async c => {
      const actor = requireRow(await repo.lockActor(c, request.principal.accountId));
      if (actor.status !== 'ACTIVE' || actor.role_status !== 'ACTIVE') fail(401,'ACCOUNT_LOCKED','Tài khoản không khả dụng.');
      const permissions=await repo.rolePermissions(c,actor.role_id);
      if(!request.permissions?.some(p=>permissions.includes(p)))fail(403,'FORBIDDEN','Quyền hiện hành không cho phép thao tác.');
      request.principal={...request.principal,permissions,customerId:actor.customer_id===null?null:String(actor.customer_id),...await require('../modules/auth/scope-repository').loadScopes(c,actor.id)};
      const saved = await repo.idempotency(c, request.principal.accountId, operation, key);
      if (saved) {
        if (saved.request_hash !== hash) fail(409,'IDEMPOTENCY_CONFLICT','Mã yêu cầu đã dùng cho nội dung khác.');
        return { status: saved.response_code, body: typeof saved.response === 'string' ? JSON.parse(saved.response) : saved.response };
      }
      const body = await callback(c);
      await repo.saveIdempotency(c, request.principal.accountId, operation, key, hash, body, status);
      return { status, body };
    }, { beforeBegin: async c=>{if(guard)await guard(c);await repo.configureTransaction(c);} });
  }
  return { pool, config, read, write };
}
module.exports = { createBusinessContext, fail, requireRow, expectVersion, expectState, scope, businessDate, now };
