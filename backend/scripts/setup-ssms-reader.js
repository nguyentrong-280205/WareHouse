// Provision one SELECT-only MySQL connection account; no application/business data mutations.
throw new Error('DA_THAY_THE_USE_SQLSERVER_NATIVE_CONNECTION');
const{readFileSync,writeFileSync,existsSync}=require('node:fs'),{resolve}=require('node:path'),{randomBytes}=require('node:crypto'),{spawnSync}=require('node:child_process'),mysql=require('mysql2/promise');
const file=resolve(__dirname,'../.artifacts/ssms-reader.local.json'),workspace=resolve(__dirname,'../..'),user='warehouse_ssms_reader';
function admin(sql){
 const run=spawnSync('docker',['compose','--env-file',resolve(workspace,'infra/.env'),'-f',resolve(workspace,'infra/compose.yaml'),'exec','-T','mysql-dev','sh','-c','MYSQL_PWD="$(cat /run/secrets/root_password)" exec mysql --user=root --batch --skip-column-names'],{input:sql,encoding:'utf8',windowsHide:true,timeout:20000});
 if(run.error||run.status!==0)throw new Error('MYSQL_ACCOUNT_SETUP_FAILED');return run.stdout.trim();
}
async function main(){
 if(!admin('SELECT VERSION();').startsWith('8.4.8')||admin('SELECT COUNT(*) FROM warehouse_db._warehouse_environment;')!=='0')throw new Error('UNEXPECTED_MYSQL_DEVELOPMENT_TARGET');
 let credentials;if(existsSync(file)){credentials=JSON.parse(readFileSync(file,'utf8'));if(credentials.user!==user||credentials.database!=='warehouse_db'||credentials.host!=='127.0.0.1'||credentials.port!==3307||credentials.provisioned!==true||!/^[a-f0-9]{64}$/.test(credentials.password))throw new Error('READER_FILE_CONFLICT_REVIEW_REQUIRED');}
 else{
  if(admin("SELECT COUNT(*) FROM mysql.user WHERE User='warehouse_ssms_reader';")!=='0')throw new Error('EXISTING_READER_ACCOUNT_NO_OVERWRITE');
  credentials={host:'127.0.0.1',port:3307,user,database:'warehouse_db',password:randomBytes(32).toString('hex'),provisioned:false};writeFileSync(file,JSON.stringify(credentials),{flag:'wx',mode:0o600});
  // Password is generated hex, passed only over stdin; not shell arguments/output/source.
  admin("CREATE USER 'warehouse_ssms_reader'@'%' IDENTIFIED BY '"+credentials.password+"';\nGRANT SELECT ON warehouse_db.* TO 'warehouse_ssms_reader'@'%';");
  credentials.provisioned=true;writeFileSync(file,JSON.stringify(credentials),{mode:0o600});
 }
 const grants=admin("SHOW GRANTS FOR 'warehouse_ssms_reader'@'%';").split('\n');
 if(!grants.some(g=>/^GRANT SELECT ON `warehouse_db`\.\* TO /.test(g))||grants.some(g=>!/^GRANT (USAGE ON \*\.\*|SELECT ON `warehouse_db`\.\*) TO ['`]/.test(g)||/WITH GRANT OPTION/.test(g)))throw new Error('READER_PRIVILEGES_NOT_SELECT_ONLY');
 const c=await mysql.createConnection({host:credentials.host,port:credentials.port,user:credentials.user,password:credentials.password,database:credentials.database});try{const[[r]]=await c.execute('SELECT DATABASE() AS db');if(r.db!=='warehouse_db')throw new Error('READER_DATABASE_MISMATCH');}finally{await c.end();}
 console.log('MySQL SSMS reader ready: SELECT only on warehouse_db; credentials remain local ignored; no business data/schema changes.');
}
main().catch(error=>{console.error(/^[A-Z0-9_]+$/.test(error.message)?error.message:'SSMS_READER_SETUP_FAILED');process.exitCode=1;});
