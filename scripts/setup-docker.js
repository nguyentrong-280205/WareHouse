// No packages required. Create installation-local secrets; never reuse Windows DB credentials.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),dir=path.join(root,'infra/secrets/docker');
const manifest=path.join(dir,'bootstrap.json');
const secret=()=> 'W!a9'+crypto.randomBytes(30).toString('base64url');
function main(){
 if(fs.existsSync(manifest)){
  for(const name of ['saPassword','appUrl','migrationUrl','testAppUrl','testMigrationUrl','csrf','testMarker','installationId','simpleDemoPassword','SSMS.local.md'])if(!fs.existsSync(path.join(dir,name)))throw new Error('INCOMPLETE_DOCKER_SECRETS_REVIEW_REQUIRED');
  console.log('Warehouse Docker secrets already exist; unchanged.');return;
 }
 if(fs.existsSync(dir)&&fs.readdirSync(dir).length)throw new Error('EXISTING_DOCKER_SECRET_DIRECTORY_REQUIRES_REVIEW');
 fs.mkdirSync(dir,{recursive:true});
 const credentials=Object.fromEntries(['warehouse_app','warehouse_migration','warehouse_test_app','warehouse_test_migration'].map(name=>[name,secret()]));
 const config={installationId:crypto.randomUUID(),testMarker:crypto.randomUUID(),saPassword:secret(),credentials};
 const write=(name,value)=>fs.writeFileSync(path.join(dir,name),value,{flag:'wx',mode:0o600});
 write('saPassword',config.saPassword);write('csrf',secret());write('testMarker',config.testMarker);write('installationId',config.installationId);
 for(const[user,file]of [['warehouse_app','appUrl'],['warehouse_migration','migrationUrl'],['warehouse_test_app','testAppUrl'],['warehouse_test_migration','testMigrationUrl']]){
  const db=user.startsWith('warehouse_test_')?'warehouse_test':'warehouse_db';
  write(file,'sqlserver://'+user+':'+encodeURIComponent(credentials[user])+'@sqlserver:1433/'+db+'?machine=warehouse-sqlserver&trustServerCertificate=true');
 }
 // Reuse only an explicitly configured local demo password, never Windows DB credentials.
 // A fresh recipient gets a random password; no plaintext password in source/Git.
 const localDemo=path.join(root,'backend/.artifacts/simple-demo-password.local');
 const demoPassword=fs.existsSync(localDemo)?fs.readFileSync(localDemo,'utf8').trim():secret();
 if(Array.from(demoPassword).length<6||Array.from(demoPassword).length>128)throw new Error('INVALID_LOCAL_DEMO_PASSWORD');
 write('simpleDemoPassword',demoPassword);
 write('SSMS.local.md',['# SQL Server Docker — private local credentials','','Server: localhost,14330','Authentication: SQL Server Authentication','Read/write app login: warehouse_app','Password: '+credentials.warehouse_app,'Database: warehouse_db','Trust Server Certificate: true (local development)','','Bootstrap administrator: sa','Administrator password: '+config.saPassword,'Use administrator only for database management, never in backend.','','Application demo password: '+demoPassword,'See data.md for role-specific usernames.','','Do not publish or send this file. Generate separate credentials on another machine.',''].join('\n'));
 write('bootstrap.json',JSON.stringify(config,null,2));
 console.log('Warehouse Docker secrets generated locally; credentials not logged. SSMS guide: infra/secrets/docker/SSMS.local.md');
}
try{main();}catch(error){console.error(/^[A-Z0-9_]+$/.test(error.message)?error.message:'DOCKER_SETUP_FAILED');process.exitCode=1;}
