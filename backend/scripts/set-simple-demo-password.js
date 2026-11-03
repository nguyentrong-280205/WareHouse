// Explicit one-time local password change for the 9 base simple-demo accounts; never run automatically on restart.
require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[k,f]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[k]&&fs.existsSync('/run/secrets/'+f))process.env[k]=fs.readFileSync('/run/secrets/'+f,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),{hashPassword,verifyPassword}=require('../src/modules/auth/password'),simple=require('../src/modules/auth/simple-demo'),repo=require('../src/shared/business-repository');
const logins=simple.accounts.map(a=>a.username);
function privateWrite(file,body){fs.mkdirSync('.artifacts',{recursive:true});const temporary=file+'.pending';fs.writeFileSync(temporary,body,{mode:0o600});fs.renameSync(temporary,file);}
async function main(){
 if(!process.argv.includes('--apply'))throw Error('EXPLICIT_APPLY_REQUIRED');
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver'||config.NODE_ENV!=='development'||!config.AUTH_ALLOW_SIMPLE_DEMO)throw Error('LOCAL_DOCKER_CONFIGURATION_REQUIRED');
 const password=fs.readFileSync(process.env.SIMPLE_DEMO_PASSWORD_FILE||'/run/secrets/demo_password','utf8').trim();if(Array.from(password).length<6||Array.from(password).length>128)throw Error('INVALID_LOCAL_PASSWORD');
 const pool=createDatabase(config.DATABASE_URL);try{const result=await withTransaction(pool,async c=>{
  await require('./sqlserver-demo-guard').guardDemo(c,config);
  await c.raw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'warehouse:simple-demo-password-change-20261103',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'SIMPLE_DEMO_PASSWORD_LOCK',1;");
  const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='demo.simpleAccounts.password.changed.20261103'");
  const[accounts]=await c.execute("SELECT a.id,a.login,a.code,a.display_name,a.status,r.status AS role_status FROM TaiKhoan a WITH(UPDLOCK,HOLDLOCK) JOIN VaiTroQuyen r ON r.id=a.role_id WHERE a.login IN ("+logins.map(()=>'?').join(',')+") ORDER BY a.id",logins);
  if(accounts.length!==logins.length||accounts.some(a=>a.code!==simple.code(a.login)||a.role_status!=='ACTIVE'||!simple.allowed(config,a.login)))throw Error('SIMPLE_DEMO_ACCOUNT_SET_CHANGED');
  if(!done){for(const a of accounts){const hash=await hashPassword(password,config);if(!await verifyPassword(hash,password))throw Error('HASH_VERIFICATION_FAILED');await c.execute('UPDATE TaiKhoan SET password_hash=?,failed_attempt_count=0,failed_window_started_at=NULL,locked_until=NULL,version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?',[hash,a.id]);await c.execute('UPDATE PhienDangNhap SET revoked_at=SYSUTCDATETIME() WHERE account_id=? AND revoked_at IS NULL',[a.id]);}
   await repo.audit(c,{accountId:null,system:true},'demo.simpleAccounts.password.changed.20261103','TaiKhoan',accounts[0].id,null,{accounts:accounts.map(a=>({id:a.id,login:a.login,status:a.status})),sessionsRevoked:true,loginFailureCountersCleared:true,rolesScopesAndStatusUnchanged:true},randomUUID());
  }
  for(const a of accounts){const[[row]]=await c.execute('SELECT password_hash FROM TaiKhoan WHERE id=?',[a.id]);if(!await verifyPassword(row.password_hash,password))throw Error('CURRENT_PASSWORD_DIFFERS_NO_OVERWRITE');}
  return{status:done?'ALREADY_CHANGED':'CHANGED',accounts:accounts.map(a=>({login:a.login,role:simple.accounts.find(s=>s.username===a.login).role,status:a.status})),hashesVerified:true};
 });
 privateWrite('.artifacts/SIMPLE-demo-login.local.md',['# Đăng nhập demo cục bộ — riêng tư','','Mở http://localhost:8080/login. Ngoại lệ mật khẩu ngắn chỉ cho bộ demo mới. Mật khẩu đã đổi theo yêu cầu 03/11/2026.','','| Vai trò | Tên đăng nhập | Mật khẩu |','|---|---|---|',...result.accounts.map(a=>'| '+a.role+' | '+a.login+' | '+password+' |'),'','Giữ file này cục bộ, không đưa lên GitHub/log. Tài khoản uc01.* cũ giữ nguyên.',''].join('\n'));
 console.log(JSON.stringify({...result,passwordsLogged:false,guide:'.artifacts/SIMPLE-demo-login.local.md'}));
 }finally{await pool.end();}
}
main().catch(e=>{console.error('SIMPLE_DEMO_PASSWORD_CHANGE_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
