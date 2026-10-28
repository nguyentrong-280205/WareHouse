const fs=require('node:fs'),{spawnSync}=require('node:child_process'),{parseDatabaseUrl}=require('../src/config/environment');
for(const[key,file]of [['DATABASE_URL','app_url'],['MIGRATION_DATABASE_URL','migration_url'],['TEST_DATABASE_URL','test_app_url'],['TEST_MIGRATION_DATABASE_URL','test_migration_url'],['TEST_INSTANCE_ID','test_marker'],['CSRF_SECRET','csrf']])process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
for(const key of ['DATABASE_URL','MIGRATION_DATABASE_URL','TEST_DATABASE_URL','TEST_MIGRATION_DATABASE_URL'])if(parseDatabaseUrl(process.env[key]).machine!=='warehouse-sqlserver')throw Error('PORTABLE_TARGET_REQUIRED');
process.env.NODE_ENV='development';process.env.TEST_ALLOWED_ENDPOINTS='sqlserver:1433';const apply=process.argv.includes('--apply');
for(const target of ['development','test']){const r=spawnSync(process.execPath,['scripts/migrate.js',target,...(apply?[]:['--status'])],{env:process.env,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
if(apply){const r=spawnSync(process.execPath,['scripts/seed-material-location-layout.js'],{env:process.env,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
