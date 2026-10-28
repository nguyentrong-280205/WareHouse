const fs=require('node:fs'),{spawnSync}=require('node:child_process'),{parseDatabaseUrl}=require('../src/config/environment');
for(const[k,f]of [['DATABASE_URL','app_url'],['MIGRATION_DATABASE_URL','migration_url'],['TEST_DATABASE_URL','test_app_url'],['TEST_MIGRATION_DATABASE_URL','test_migration_url'],['TEST_INSTANCE_ID','test_marker']])process.env[k]=fs.readFileSync('/run/secrets/'+f,'utf8').trim();
for(const key of ['DATABASE_URL','MIGRATION_DATABASE_URL','TEST_DATABASE_URL','TEST_MIGRATION_DATABASE_URL'])if(parseDatabaseUrl(process.env[key]).machine!=='warehouse-sqlserver')throw Error('PORTABLE_TARGET_REQUIRED');
const target=process.argv[2];if(!['development','test'].includes(target))throw Error('INVALID_TARGET');
process.env.NODE_ENV='development';process.env.TEST_ALLOWED_ENDPOINTS='sqlserver:1433';
const r=spawnSync(process.execPath,['scripts/migrate.js',target,...(process.argv.includes('--apply')?[]:['--status'])],{env:process.env,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
