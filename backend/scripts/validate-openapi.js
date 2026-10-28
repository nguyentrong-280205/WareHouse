const parser = require('@apidevtools/swagger-parser');
async function main() {
  await parser.validate('../docs/foundation_api.json');
  await parser.validate('../docs/api_contract.yaml');
  await parser.validate('../docs/runtime_api.json');
  console.log('Foundation, planned and runtime OpenAPI syntax/specification validated; no HTTP/database or functional tests executed.');
}
main().catch(()=>{ console.error('OPENAPI_VALIDATION_FAILED'); process.exitCode=1; });
