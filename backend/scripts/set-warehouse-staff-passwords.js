// Explicit one-time local password change; never run automatically on restart.
require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[k,f]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[k]&&fs.existsSync('/run/secrets/'+f))process.env[k]=fs.readFileSync('/run/secrets/'+f,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),{hashPassword,verifyPassword}=require('../src/modules/auth/password'),simple=require('../src/modules/auth/simple-demo'),repo=require('../src/shared/business-repository');
const logins=['uc01.staff','nhanvienkho01','nguyentrong','vuthinh','truongthinh'];
function privateWrite(file,body){fs.mkdirSync('.artifacts',{recursive:true});const temporary=file+'.pending';fs.writeFileSync(temporary,body,{mode:0o600});fs.renameSync(temporary,file);}
async function main(){
 if(!process.argv.includes('--apply'))throw Error('EXPLICIT_APPLY_REQUIRED');
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver'||config.NODE_ENV!=='development'||!config.AUTH_ALLOW_SIMPLE_DEMO)throw Error('LOCAL_DOCKER_CONFIGURATION_REQUIRED');
 const password=fs.readFileSync(process.env.WAREHOUSE_STAFF_PASSWORD_FILE||'/run/secrets/demo_password','utf8').trim();if(Array.from(password).length<6||Array.from(password).length>128)throw Error('INVALID_LOCAL_PASSWORD');
 const pool=createDatabase(config.DATABASE_URL);try{const result=await withTransaction(pool,async c=>{
  await require('./sqlserver-demo-guard').guardDemo(c,config);
  await c.raw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'warehouse:staff-password-change-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'STAFF_PASSWORD_LOCK',1;");
  const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='warehouse.staff.password.changed.20261028'");
  const[accounts]=await c.execute("SELECT a.id,a.login,a.code,a.display_name,a.status,r.status AS role_status FROM TaiKhoan a WITH(UPDLOCK,HOLDLOCK) JOIN VaiTroQuyen r ON r.id=a.role_id WHERE r.code=? ORDER BY a.id",['UC01_DEMO_staff']);
  if(accounts.length!==logins.length||accounts.some(a=>!logins.includes(a.login)||a.code!==simple.code(a.login)||a.role_status!=='ACTIVE'||!simple.allowed(config,a.login)))throw Error('STAFF_ACCOUNT_SET_CHANGED');
  if(!done){for(const a of accounts){const hash=await hashPassword(password,config);if(!await verifyPassword(hash,password))throw Error('HASH_VERIFICATION_FAILED');await c.execute('UPDATE TaiKhoan SET password_hash=?,failed_attempt_count=0,failed_window_started_at=NULL,locked_until=NULL,version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?',[hash,a.id]);await c.execute('UPDATE PhienDangNhap SET revoked_at=SYSUTCDATETIME() WHERE account_id=? AND revoked_at IS NULL',[a.id]);}
   await repo.audit(c,{accountId:null,system:true},'warehouse.staff.password.changed.20261028','TaiKhoan',accounts[0].id,null,{accounts:accounts.map(a=>({id:a.id,login:a.login,status:a.status})),sessionsRevoked:true,loginFailureCountersCleared:true,rolesScopesAndStatusUnchanged:true},randomUUID());
  }
  for(const a of accounts){const[[row]]=await c.execute('SELECT password_hash FROM TaiKhoan WHERE id=?',[a.id]);if(!await verifyPassword(row.password_hash,password))throw Error('CURRENT_PASSWORD_DIFFERS_NO_OVERWRITE');}
  return{status:done?'ALREADY_CHANGED':'CHANGED',accounts:accounts.map(a=>({login:a.login,name:a.display_name.replace(/^demo\s+/i,''),status:a.status})),hashesVerified:true};
 });
 privateWrite('.artifacts/WAREHOUSE-STAFF-logins.local.md',['# Đăng nhập nhân viên kho — chỉ lưu cục bộ','','Mở http://localhost:8080/login. Mật khẩu đã được đổi theo yêu cầu ngày 28/10/2026.','','| Nhân viên | Đăng nhập | Mật khẩu |','|---|---|---|',...result.accounts.map(a=>'| '+a.name+' | '+a.login+' | '+password+' |'),'','Chỉ nhân viên được phân công nhận phiếu tương ứng. Các phiên đăng nhập cũ đã được thu hồi. Không đưa file lên GitHub/log.',''].join('\n'));
 const staffFile='.artifacts/WAREHOUSE-STAFF-passwords.local.json';if(fs.existsSync(staffFile)){const data=JSON.parse(fs.readFileSync(staffFile,'utf8'));for(const a of data)if(logins.includes(a.login))a.password=password;privateWrite(staffFile,JSON.stringify(data,null,2)+'\n');}
 const legacyFile='.artifacts/uc01-demo-credentials.json';if(fs.existsSync(legacyFile)){const data=JSON.parse(fs.readFileSync(legacyFile,'utf8'));for(const a of data.accounts||[])if(a.username==='uc01.staff')a.password=password;privateWrite(legacyFile,JSON.stringify(data,null,2)+'\n');}
 const legacyGuide='.artifacts/UC01-demo-login.local.md';if(fs.existsSync(legacyGuide)){const text=fs.readFileSync(legacyGuide,'utf8').split(/\r?\n/).map(line=>{if(!/^\|\s*uc01\.staff\s*\|/.test(line))return line;const cells=line.split('|');cells[3]=' '+password+' ';return cells.join('|');}).join('\n');privateWrite(legacyGuide,text);}
 console.log(JSON.stringify({...result,passwordsLogged:false,guide:'.artifacts/WAREHOUSE-STAFF-logins.local.md'}));
 }finally{await pool.end();}
}
main().catch(e=>{console.error('STAFF_PASSWORD_CHANGE_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
