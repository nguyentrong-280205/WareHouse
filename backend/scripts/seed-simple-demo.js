require('dotenv/config');
const{readFileSync,writeFileSync,existsSync}=require('node:fs'),{randomUUID}=require('node:crypto');
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database');
const{hashPassword,verifyPassword}=require('../src/modules/auth/password'),{accounts,code}=require('../src/modules/auth/simple-demo'),repo=require('../src/shared/business-repository');
async function main(){
 const config=loadConfig();if(config.NODE_ENV!=='development'||config.db.database!=='warehouse_db'||config.db.user!=='warehouse_app'||!(config.db.instance==='HTTT02'||config.db.machine==='warehouse-sqlserver'))throw new Error('UNSAFE_DEMO_TARGET');
 const password=readFileSync('.artifacts/simple-demo-password.local','utf8').trim();if(Array.from(password).length<6||Array.from(password).length>128)throw new Error('INVALID_DEMO_PASSWORD');
 const hashes=new Map();for(const a of accounts)hashes.set(a.username,await hashPassword(password,config));
 const pool=createDatabase(config.DATABASE_URL);try{await withTransaction(pool,async c=>{
  await require('./sqlserver-demo-guard').guardDemo(c,config);
  const[[consolidated]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE action='workshops.consolidate.completed' AND actor_kind='SYSTEM'");if(consolidated){console.log('LEGACY_WORKSHOP_SEED_SKIPPED_AFTER_CONSOLIDATION');return;}

  const customer=await repo.one(c,'KhachHang',{code:'UC01_DEMO_customer',status:'ACTIVE'},{lock:true});if(!customer)throw new Error('DEMO_CUSTOMER_REQUIRED');
  const ids=[];for(const a of accounts){
   const role=(await c.execute("SELECT id,name FROM VaiTroQuyen WITH (HOLDLOCK,ROWLOCK) WHERE code=? AND status='ACTIVE'",['UC01_DEMO_'+a.role]))[0][0];if(!role)throw new Error('DEMO_ROLE_REQUIRED');
   const existing=(await c.execute('SELECT * FROM TaiKhoan WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE login=?',[a.username]))[0][0],sameCode=(await c.execute('SELECT id FROM TaiKhoan WITH (UPDLOCK,HOLDLOCK,ROWLOCK) WHERE code=?',[code(a.username)]))[0][0],customerId=a.role==='customer'?String(customer.id):null;
   let accountId;if(existing||sameCode){if(!existing||!sameCode||String(existing.id)!==String(sameCode.id)||existing.code!==code(a.username)||String(existing.role_id)!==String(role.id)||(existing.customer_id===null?null:String(existing.customer_id))!==customerId||!await verifyPassword(existing.password_hash,password))throw new Error('DEMO_CONFLICT_NO_OVERWRITE');accountId=String(existing.id);}
   else{const[[inserted]]=await c.execute('INSERT INTO TaiKhoan(code,login,password_hash,display_name,role_id,customer_id,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES (?,?,?,?,?,?,SYSUTCDATETIME())',[code(a.username),a.username,hashes.get(a.username),'Demo '+role.name,role.id,customerId]);accountId=String(inserted.id);}
   ids.push(accountId);if(a.role==='customer')continue;
   const[kho]=await c.execute("SELECT id FROM Kho WHERE code IN ('FS_DEMO_20261015_NL','FS_DEMO_20261015_TP','FS_DEMO_20261015_CTRL') ORDER BY id");const workshop=await repo.one(c,'XuongSanXuat',{code:'FS_DEMO_20261015_WS_A'});if(kho.length!==3||!workshop)throw new Error('FS_SUPPORT_SEED_REQUIRED');
   for(const k of kho)if(!(await c.execute('SELECT 1 AS present FROM TaiKhoan_Kho WHERE account_id=? AND warehouse_id=?',[accountId,k.id]))[0].length)await c.execute('INSERT INTO TaiKhoan_Kho(account_id,warehouse_id) VALUES (?,?)',[accountId,k.id]);
   if(!(await c.execute('SELECT 1 AS present FROM TaiKhoan_Xuong WHERE account_id=? AND workshop_id=?',[accountId,workshop.id]))[0].length)await c.execute('INSERT INTO TaiKhoan_Xuong(account_id,workshop_id) VALUES (?,?)',[accountId,workshop.id]);
  }
  await repo.audit(c,{accountId:null,system:true},'demo.simpleAccounts.seed','TaiKhoan',ids[0],null,{accountIds:ids,usernames:accounts.map(a=>a.username),noOldAccountsChanged:true},randomUUID());
  const guide='.artifacts/SIMPLE-demo-login.local.md';if(!existsSync(guide))writeFileSync(guide,['# Đăng nhập demo cục bộ — riêng tư','','Mở http://localhost:8080/login. Ngoại lệ mật khẩu ngắn chỉ cho bộ demo mới.','','| Vai trò | Tên đăng nhập | Mật khẩu |','|---|---|---|',...accounts.map(a=>'| '+a.role+' | '+a.username+' | '+password+' |'),'','Giữ file này cục bộ, không đưa lên GitHub/log. Tài khoản uc01.* cũ giữ nguyên.',''].join('\n'),{flag:'wx',mode:0o600});
 });console.log('Simple local demo ready: 9 named accounts, existing roles/customer/scopes; old accounts unchanged; passwords not logged.');}finally{await pool.end();}
}
main().catch(error=>{console.error('SIMPLE_DEMO_FAILED: '+(/^[A-Z0-9_]+$/.test(error.message)?error.message:'CONFIGURATION_OR_CONFLICT')+'; no reset or overwrite.');process.exitCode=1;});
