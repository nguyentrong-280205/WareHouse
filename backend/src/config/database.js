const sql = require('mssql');
const { parse: parseLossless } = require('lossless-json');
const { parseDatabaseUrl } = require('./environment');

// This scanner binds positional values; it never translates SQL dialects.
function bind(request, text, values = []) {
  let index = 0, quote = '', output = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      output += ch;
      if (ch === quote) {
        if (text[i + 1] === quote) output += text[++i]; else quote = '';
      }
    } else if (ch === "'" || ch === '"' || ch === '[') {
      quote = ch === '[' ? ']' : ch; output += ch;
    } else if (ch === '?') {
      if (index >= values.length) throw new Error('SQL_PARAMETER_COUNT_MISMATCH');
      const value = values[index], name = 'p' + index++;
      if (value === undefined) throw new Error('UNDEFINED_SQL_PARAMETER');
      if (typeof value === 'bigint') request.input(name, sql.VarChar(40), value.toString());
      else if (value === null) request.input(name, sql.NVarChar(sql.MAX), null);
      else if (typeof value === 'string') request.input(name, sql.NVarChar(sql.MAX), value);
      else if (typeof value === 'boolean') request.input(name, sql.Bit, value);
      else if (typeof value === 'number' && Number.isSafeInteger(value)) request.input(name, sql.BigInt, value);
      else if (value instanceof Date) request.input(name, sql.DateTime2(3), value);
      else throw new Error('UNSAFE_SQL_PARAMETER_TYPE');
      output += '@' + name;
    } else output += ch;
  }
  if (index !== values.length || quote) throw new Error('SQL_PARAMETER_COUNT_MISMATCH');
  return output;
}
function exactNumber(value) {
  if (/[.eE]/.test(value)) return value;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : value;
}
const jsonColumns = new Set(['before','after','response','capacity_snapshot','empty_location_ids','breakdown','factors_snapshot','evidence_ids']);
function normalize(rows) {
  for (const row of rows) for (const [key, value] of Object.entries(row)) {
    if (value === null) continue;
    if (key === 'id' || key.endsWith('_id')) row[key] = String(value);
    else if (typeof value === 'number' && /(^|_)(amount|price|qty|quantity|capacity|factor)(_|$)/.test(key)) row[key] = String(value);
    else if (jsonColumns.has(key) && typeof value === 'string') row[key] = JSON.parse(value);
    else if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value)) row[key] = value.slice(0,19).replace('T',' ') + '.' + (value.split('.')[1] || '').replace(/Z$/, '').padEnd(3,'0').slice(0,3);
  }
  return rows;
}
function facade(pool) {
  let transaction;
  return {
    async execute(text, params = []) {
      await pool.connect();
      const request = new sql.Request(transaction || pool);
      let command = bind(request, text, params);
      // Serialize on the server before Tedious converts DECIMAL into JS Number.
      const select = /^\s*SELECT\b/i.test(command) && !/\bFOR\s+JSON\b/i.test(command);
      if (select) command = command.trim().replace(/;$/, '') + ' FOR JSON PATH, INCLUDE_NULL_VALUES';
      const result = await request.query(command);
      if (select) {
        const json = (result.recordset || []).map(row => Object.values(row)[0]).join('');
        return [normalize(parseLossless(json || '[]', undefined, exactNumber)), []];
      }
      if (result.recordset) return [normalize(result.recordset), []];
      return [{ affectedRows: result.rowsAffected.reduce((a, b) => a + b, 0) }, []];
    },
    async query(text, params) { return this.execute(text, params); },
    async raw(text) { await pool.connect(); return new sql.Request(transaction || pool).batch(text); },
    async beginTransaction() {
      if (transaction) throw new Error('NESTED_SQL_TRANSACTION');
      await pool.connect(); transaction = new sql.Transaction(pool);
      try {
        await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
        await new sql.Request(transaction).batch('SET XACT_ABORT ON;');
      } catch (error) {
        const active=transaction;transaction=undefined;
        try { await active.rollback(); } catch {}
        throw error;
      }
    },
    async commit() { const active = transaction; await active.commit(); transaction = undefined; },
    async rollback() { const active = transaction; transaction = undefined; if (active) await active.rollback(); },
    release() { if (transaction) throw new Error('UNRELEASED_SQL_TRANSACTION'); },
    destroy() {},
  };
}
function createDatabase(url, { migration = false } = {}) {
  const db = parseDatabaseUrl(url);
  const pool = new sql.ConnectionPool({ server: db.host, ...(db.port ? { port: db.port } : {}),
    user: db.user, password: db.password, database: db.database,
    connectionTimeout: 8000, requestTimeout: migration ? 120000 : 30000,
    pool: { max: migration ? 1 : 5, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: true, trustServerCertificate: db.trustServerCertificate,
      useUTC: true, abortTransactionOnError: true, enableArithAbort: true,
      enableAnsiNull: true, enableAnsiPadding: true, enableAnsiWarnings: true,
      enableQuotedIdentifier: true, enableConcatNullYieldsNull: true,
      enableNumericRoundabort: false,
      ...(db.port ? {} : { instanceName: db.instance }) },
  });
  pool.on('error', () => {});
  let ready;
  async function connect() {
    if(!ready)ready=(async()=>{
      await pool.connect();
      const result=await new sql.Request(pool).query("SELECT DB_NAME() AS database_name,CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) AS instance_name,CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')) AS machine_name");
      const identity=result.recordset[0];
      if(identity.database_name!==db.database||!require('./sqlserver-identity').matchesIdentity(identity,db)){
        await pool.close();throw new Error('SQLSERVER_CONNECTION_IDENTITY_MISMATCH');
      }
    })().catch(error=>{ready=undefined;throw error;});
    await ready;
  }
  return {
    async getConnection() { await connect(); return facade(pool); },
    async execute(text, values) { await connect(); return facade(pool).execute(text, values); },
    async query(text, values) { return this.execute(text, values); },
    async end() { await pool.close(); },
  };
}
async function withConnection(pool, callback) {
  const connection = await pool.getConnection();
  try { return await callback(connection); } finally { connection.release(); }
}
async function withTransaction(pool, callback, { beforeBegin } = {}) {
  return withConnection(pool, async connection => {
    if (beforeBegin) await beforeBegin(connection);
    await connection.beginTransaction();
    try { const result = await callback(connection); await connection.commit(); return result; }
    catch (error) { try { await connection.rollback(); } catch {} throw error; }
  });
}
async function probeDatabase(pool) { return withConnection(pool, c => c.execute('SELECT 1 AS ok')); }
module.exports = { createDatabase, withConnection, withTransaction, probeDatabase };
