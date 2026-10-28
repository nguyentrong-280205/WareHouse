// Configuration inspection only: no HTTP requests, MySQL connections, fixtures, or test runner.
const{readFileSync}=require('node:fs');
const api=JSON.parse(readFileSync('../docs/api_contract.yaml','utf8'));
const missingRefs=new Set();
function walk(value){if(!value||typeof value!=='object')return;if(value.$ref?.startsWith('#/')){let resolved=api;for(const part of value.$ref.slice(2).split('/'))resolved=resolved?.[part];if(!resolved)missingRefs.add(value.$ref);}for(const item of Object.values(value))walk(item);}
walk(api);
try{
 const disabledPool={getConnection(){throw new Error('CONFIG_INSPECTION_HAS_NO_DATABASE');}};
 const business=require('../src/business').createBusiness(disabledPool,{NODE_ENV:'development'},api),registered=new Set(Object.keys(business.handlers)),pending=[],seen=new Set(),duplicates=[];
 for(const item of Object.values(api.paths))for(const op of Object.values(item))if(op.operationId){if(seen.has(op.operationId))duplicates.push(op.operationId);seen.add(op.operationId);if(!registered.has(op.operationId)&&!op.operationId.startsWith('auth.')&&!op.operationId.startsWith('health.'))pending.push(op.operationId);}
 console.log(JSON.stringify({registeredBusinessHandlers:registered.size,unboundOperations:pending,missingReferences:[...missingRefs],duplicateOperationIds:duplicates,noDatabaseOrHttpExecuted:true},null,2));
 if(missingRefs.size||duplicates.length||pending.length)process.exitCode=1;
}catch(error){console.error('BUSINESS_CONFIG_FAILED: '+error.message);process.exitCode=1;}
