const { z } = require('zod');
function compileSchema(schema, contract) {
  if (schema.$ref) { const value=compileSchema(schema.$ref.split('/').slice(1).reduce((o,k) => o[k], contract), contract);return schema.nullable?value.nullable():value; }
  let value;
  if (schema.enum) value = z.enum(schema.enum);
  else if (schema.type === 'object') {
    const shape = {};
    for (const [key, child] of Object.entries(schema.properties || {})) { const s = compileSchema(child, contract); shape[key] = (schema.required || []).includes(key) ? s : s.optional(); }
    value = schema.additionalProperties === false ? z.object(shape).strict() : z.object(shape).passthrough();
  } else if (schema.type === 'array') {
    value = z.array(compileSchema(schema.items, contract));
    if (schema.minItems !== undefined) value = value.min(schema.minItems);
    if (schema.maxItems !== undefined) value = value.max(schema.maxItems);
  } else if (schema.type === 'boolean') value = z.boolean();
  else if (schema.type === 'integer' || schema.type === 'number') {
    value = z.number().finite(); if (schema.type === 'integer') value = value.int().safe();
    if (schema.minimum !== undefined) value = value.min(schema.minimum);
    if (schema.maximum !== undefined) value = value.max(schema.maximum);
  } else {
    value = z.string();
    if (schema.minLength !== undefined) value = value.min(schema.minLength);
    if (schema.maxLength !== undefined) value = value.max(schema.maxLength);
    if (schema.pattern) value = value.regex(new RegExp(schema.pattern));
    if (schema.format === 'date') value = value.date();
    if (schema.format === 'date-time') value = value.datetime({ offset: true });
    if (schema.pattern === '^[1-9][0-9]*$') value = value.max(20).refine(v => /^[1-9][0-9]{0,19}$/.test(v) && BigInt(v) <= 18446744073709551615n, 'ID vượt BIGINT UNSIGNED.');
  }
  return schema.nullable ? value.nullable() : value;
}
function validateOperation(operation, contract) {
  const body = operation.requestBody?.content?.['application/json']?.schema;
  const schema = body && compileSchema(body, contract);
  return (req, _res, next) => {
    try {
      if (schema) req.body = schema.parse(req.body);
      for (const p of operation.parameters || []) {
        if (p.in === 'path') compileSchema(p.schema,contract).parse(req.params[p.name]);
        if (p.in === 'header' && p.required) compileSchema(p.schema,contract).parse(req.get(p.name));
      }
      const query = {};
      const allowed = (operation.parameters || []).filter(p => p.in === 'query');
      for (const p of allowed) {
        const raw = req.query[p.name];
        if (raw === undefined) continue;
        query[p.name] = compileSchema(p.schema,contract).parse(p.schema.type === 'integer' ? Number(raw) : raw);
      }
      if (Object.keys(req.query).some(k => !allowed.some(p => p.name === k))) throw new (require('./http').AppError)(422,'QUERY_INVALID','Bộ lọc không được hỗ trợ.');
      req.validatedQuery = query;
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { compileSchema, validateOperation };
