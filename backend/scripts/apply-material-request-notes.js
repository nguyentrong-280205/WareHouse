// Approved in chat 28/10: additive notes column only, Docker development/test.
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const{parseDatabaseUrl}=require('../src/config/environment');
for(const[key,file]of [['DATABASE_URL','app_url'],['MIGRATION_DATABASE_URL','migration_url'],['TEST_DATABASE_URL','test_app_url'],['TEST_MIGRATION_DATABASE_URL','test_migration_url'],['TEST_INSTANCE_ID','test_marker']])process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
for(const key of ['DATABASE_URL','MIGRATION_DATABASE_URL','TEST_DATABASE_URL','TEST_MIGRATION_DATABASE_URL'])if(parseDatabaseUrl(process.env[key]).machine!=='warehouse-sqlserver')throw new Error('PORTABLE_TARGET_REQUIRED');
process.env.NODE_ENV='development';process.env.TEST_ALLOWED_ENDPOINTS='sqlserver:1433';
for(const target of ['development','test']){
 const args=['scripts/migrate.js',target,...(process.argv.includes('--apply')?[]:['--status'])];
 const result=spawnSync(process.execPath,args,{env:process.env,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
