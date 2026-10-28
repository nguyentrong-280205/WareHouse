const fs=require('node:fs'),{spawnSync}=require('node:child_process');
async function main(){
 for(const[key,file]of [['DATABASE_URL','app_url'],['MIGRATION_DATABASE_URL','migration_url'],['TEST_DATABASE_URL','test_app_url'],['TEST_MIGRATION_DATABASE_URL','test_migration_url'],['CSRF_SECRET','csrf'],['TEST_INSTANCE_ID','test_marker']])process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
 process.env.TEST_ALLOWED_ENDPOINTS='sqlserver:1433';
 const run=args=>{const result=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});if(result.status!==0)throw new Error('DOCKER_INITIALIZATION_STEP_FAILED');};
 run(['scripts/migrate.js','development']);run(['scripts/migrate.js','test']);
 const installationId=fs.readFileSync('/run/secrets/installation_id','utf8').trim();
 const completed='.artifacts/docker-demo-completed.json';
 if(fs.existsSync(completed)){
  const marker=JSON.parse(fs.readFileSync(completed,'utf8'));
  if(marker.installationId!==installationId||marker.revision!=='FS_DEMO_20261015')throw new Error('EXISTING_DEMO_INSTALLATION_CONFLICT');
  // A lost/replaced SQL volume must not inherit another volume's completed seed flag.
  const pool=require('../src/config/database').createDatabase(process.env.DATABASE_URL);
  try{
   const[[state]]=await pool.execute("SELECT CASE WHEN EXISTS(SELECT 1 FROM dbo.TaiKhoan WHERE code LIKE N'UC01_DEMO_%') AND EXISTS(SELECT 1 FROM dbo.KhachHang WHERE code=N'UC01_DEMO_customer') THEN 1 ELSE 0 END AS present");
   if(!state.present)throw new Error('DEMO_MARKER_DATABASE_MISMATCH_REVIEW_REQUIRED');
  }finally{await pool.end();}
  process.env.NODE_ENV='development';
  run(['scripts/seed-product-catalog.js']);
  run(['scripts/seed-product-prices.js']);
  run(['scripts/seed-production-workshops.js']);
  run(['scripts/seed-planning-suggestions.js']);
  run(['scripts/seed-supplier-quotes.js']);
  run(['scripts/consolidate-workshops.js']);
  run(['scripts/use-shared-workshop-account.js']);
  run(['scripts/seed-warehouse-staff.js']);
  run(['scripts/name-warehouse-catalog.js']);
  run(['scripts/normalize-material-lots.js']);
  run(['scripts/seed-material-location-layout.js']);
  run(['scripts/remove-empty-material-locations.js']);
  console.log('WAREHOUSE_DOCKER_INITIALIZATION_OK migrations_current demo_already_initialized_no_reseed');return;
 }
 process.env.NODE_ENV='development';process.env.AUTH_ALLOW_SIMPLE_DEMO='true';
 fs.mkdirSync('.artifacts',{recursive:true});
 const password=fs.readFileSync('/run/secrets/demo_password','utf8').trim();
 const file='.artifacts/simple-demo-password.local';
 if(fs.existsSync(file)&&fs.readFileSync(file,'utf8').trim()!==password)throw new Error('EXISTING_DEMO_PASSWORD_CONFLICT');
 if(!fs.existsSync(file))fs.writeFileSync(file,password,{flag:'wx',mode:0o600});
 run(['scripts/seed-uc01-demo.js']);run(['scripts/seed-full-system-demo.js']);run(['scripts/seed-simple-demo.js']);
 run(['scripts/seed-product-catalog.js']);
 run(['scripts/seed-product-prices.js']);
 run(['scripts/seed-production-workshops.js']);
 run(['scripts/seed-planning-suggestions.js']);
  run(['scripts/seed-supplier-quotes.js']);
  run(['scripts/consolidate-workshops.js']);
  run(['scripts/use-shared-workshop-account.js']);
  run(['scripts/seed-warehouse-staff.js']);
  run(['scripts/name-warehouse-catalog.js']);
  run(['scripts/normalize-material-lots.js']);
  run(['scripts/seed-material-location-layout.js']);
  run(['scripts/remove-empty-material-locations.js']);
  run(['scripts/transfer-legacy-material-stock.js']);
  run(['scripts/replace-empty-demo-locations.js']);
 fs.writeFileSync(completed,JSON.stringify({installationId,revision:'FS_DEMO_20261015',initializedAt:new Date().toISOString()}),{flag:'wx',mode:0o600});
 console.log('WAREHOUSE_DOCKER_INITIALIZATION_OK migrations_and_explicit_demo_seed_only');
}
main().catch(error=>{console.error(/^[A-Z0-9_]+$/.test(error.message)?error.message:error.code||'DOCKER_INITIALIZATION_FAILED');process.exitCode=1;});
