// Explicitly approved additive migration and sample catalog only; never creates a PO.
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
for(const[key,file]of [['DATABASE_URL','app_url'],['MIGRATION_DATABASE_URL','migration_url'],['TEST_DATABASE_URL','test_app_url'],['TEST_MIGRATION_DATABASE_URL','test_migration_url'],['TEST_INSTANCE_ID','test_marker'],['CSRF_SECRET','csrf']])process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
process.env.NODE_ENV='development';process.env.TEST_ALLOWED_ENDPOINTS='sqlserver:1433';
for(const args of [['scripts/migrate.js','development'],['scripts/migrate.js','test'],['scripts/seed-supplier-quotes.js']]){
 const result=spawnSync(process.execPath,args,{env:process.env,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
