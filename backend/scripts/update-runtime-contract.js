const { readFileSync, writeFileSync } = require('node:fs');
const foundation = JSON.parse(readFileSync('../docs/foundation_api.json', 'utf8'));
const planned = JSON.parse(readFileSync('../docs/api_contract.yaml', 'utf8'));
const paths = { ...foundation.paths };
// Source composition only; the disabled pool must never connect during contract generation.
const disabledPool={getConnection(){throw new Error('CONTRACT_GENERATION_HAS_NO_DATABASE');}};
const implemented=new Set(Object.keys(require('../src/business').createBusiness(disabledPool,{NODE_ENV:'development'},planned).handlers));
for(const[path,item]of Object.entries(planned.paths))for(const[method,operation]of Object.entries(item))if(implemented.has(operation.operationId)||operation.operationId?.startsWith('auth.')){
 paths['/api/v1'+path]??={};paths['/api/v1'+path][method]=operation;
}
const components = { ...foundation.components };
function collect(value) {
  if (!value || typeof value !== 'object') return;
  if (value.$ref?.startsWith('#/components/')) {
    const [, , group, name] = value.$ref.split('/');
    components[group] ??= {};
    if (!components[group][name]) { components[group][name] = planned.components[group][name]; collect(components[group][name]); }
  }
  for (const entry of Object.values(value)) collect(entry);
}
collect(paths);
components.securitySchemes = planned.components.securitySchemes;
writeFileSync('../docs/runtime_api.json', JSON.stringify({ ...foundation, info: { ...foundation.info, title: 'Warehouse API — 29 UC, DA_CODE_CHUA_TEST' }, paths, components }, null, 2) + '\n');
console.log('Runtime contract generated from bound handlers: foundation, auth and '+implemented.size+' business operations; no database/HTTP/test executed.');
