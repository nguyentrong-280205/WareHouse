async function one(connection, sql, params) { const [rows] = await connection.execute(sql, params); return rows[0]; }
const accountByLogin = (c, login) => one(c, 'SELECT id FROM TaiKhoan WHERE login=?', [login]);
const account = (c, id) => one(c, 'SELECT * FROM TaiKhoan WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE id=?', [id]);
const role = (c, id) => one(c, 'SELECT * FROM VaiTroQuyen WITH (HOLDLOCK,ROWLOCK) WHERE id=?', [id]);
const session = (c, hash, lock = false) => one(c, 'SELECT * FROM PhienDangNhap' + (lock ? ' WITH (UPDLOCK,HOLDLOCK,ROWLOCK)' : '') + ' WHERE token_hash=?', [hash]);
async function permissions(c, roleId) {
  const [rows] = await c.execute('SELECT q.code FROM Quyen q JOIN VaiTro_Quyen v ON v.permission_id=q.id WHERE v.role_id=? ORDER BY q.code', [roleId]);
  return rows.map(r => r.code);
}
async function failure(c, id, count, window, until, now) {
  await c.execute('UPDATE TaiKhoan SET failed_attempt_count=?,failed_window_started_at=?,locked_until=?,updated_at=?,version=version+1 WHERE id=?', [count, window, until, now, id]);
}
async function resetFailures(c, id, now) { await failure(c, id, 0, null, null, now); }
async function createSession(c, a, token, csrf, now, idle, hard) {
  return (await one(c, 'INSERT INTO PhienDangNhap(account_id,token_hash,csrf_hash,created_at,last_seen_at,idle_expires_at,absolute_expires_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?,?,?,?,?,?)', [a, token, csrf, now, now, idle, hard])).id;
}
async function revoke(c, id, now) { await c.execute('UPDATE PhienDangNhap SET revoked_at=? WHERE id=? AND revoked_at IS NULL', [now, id]); }
async function touch(c, id, now, idle) { await c.execute('UPDATE PhienDangNhap SET last_seen_at=?,idle_expires_at=? WHERE id=?', [now, idle, id]); }
async function audit(c, actor, action, target, correlation) {
  await c.execute('INSERT INTO AuditLog(actor_id,action,target_type,target_id,correlation_id) VALUES (?,?,?,?,?)', [actor, action, 'PhienDangNhap', target, correlation]);
}
const idempotency = (c, actor, key) => one(c, 'SELECT request_hash FROM IdempotencyRequest WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE account_id=? AND operation=? AND [key]=?', [actor, 'auth.logout', key]);
async function recordLogout(c, actor, key, hash, hard) {
  await c.execute('INSERT INTO IdempotencyRequest(account_id,operation,[key],request_hash,response_code,expires_at) VALUES (?,?,?,?,?,?)', [actor, 'auth.logout', key, hash, 204, hard]);
}
module.exports = { accountByLogin, account, role, session, permissions, failure, resetFailures, createSession, revoke, touch, audit, idempotency, recordLogout };
