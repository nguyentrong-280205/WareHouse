require('dotenv/config');
const fs=require('node:fs'),{randomBytes,randomUUID}=require('node:crypto');
for(const[key,file]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[key]&&fs.existsSync('/run/secrets/'+file))process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),{hashPassword}=require('../src/modules/auth/password'),repo=require('../src/shared/business-repository');
const people=[{login:'nguyentrong',name:'Nguyễn Trọng'},{login:'vuthinh',name:'Vũ Thịnh'},{login:'truongthinh',name:'Trường Thịnh'}];
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw Error('PORTABLE_TARGET_REQUIRED');const pool=createDatabase(config.DATABASE_URL);
 try{
  const result=await withTransaction(pool,async c=>{
   await require('./sqlserver-demo-guard').guardDemo(c,config);
   await c.raw("DECLARE @r int; EXEC @r=sp_getapplock @Resource=N'warehouse:staff-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'STAFF_SEED_LOCK',1;");
   const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE action='warehouse.staff.seed.completed' AND actor_kind='SYSTEM'");if(done)return{status:'ALREADY_SEEDED',noRegrant:true,noUnlock:true};
   const[[base]]=await c.execute("SELECT a.id,a.role_id FROM TaiKhoan a JOIN VaiTroQuyen r ON r.id=a.role_id WHERE a.login='nhanvienkho01' AND a.status='ACTIVE' AND a.customer_id IS NULL AND r.status='ACTIVE'");if(!base)throw Error('STAFF_TEMPLATE_REQUIRED');
   const permissions=await repo.rolePermissions(c,base.role_id);if(!permissions.includes('issues.postMaterial')||permissions.includes('issues.allocate'))throw Error('STAFF_ROLE_REVIEW_REQUIRED');
   const[warehouses]=await c.execute('SELECT k.id FROM TaiKhoan_Kho s JOIN Kho k ON k.id=s.warehouse_id WHERE s.account_id=? AND k.status=? ORDER BY k.id',[base.id,'ACTIVE']);if(!warehouses.length)throw Error('STAFF_WAREHOUSE_SCOPE_REQUIRED');
   for(const a of people)if((await c.execute('SELECT id FROM TaiKhoan WITH(UPDLOCK,HOLDLOCK) WHERE login=? OR code=?',[a.login,'STAFF_20261028_'+a.login]))[0].length)throw Error('STAFF_COLLISION_NO_OVERWRITE');
   fs.mkdirSync('.artifacts',{recursive:true});const file='.artifacts/WAREHOUSE-STAFF-passwords.local.json';
   if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(people.map(a=>({...a,password:randomBytes(18).toString('base64url')}))),{flag:'wx',mode:0o600});
   const credentials=JSON.parse(fs.readFileSync(file,'utf8'));if(credentials.length!==3||people.some((a,i)=>credentials[i].login!==a.login||credentials[i].password.length<12))throw Error('LOCAL_STAFF_CREDENTIALS_CONFLICT');
   const created=[];
   for(const a of credentials){const hash=await hashPassword(a.password,config);const[[account]]=await c.execute('INSERT INTO TaiKhoan(code,login,password_hash,display_name,role_id,customer_id,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES(?,?,?,?,?,NULL,SYSUTCDATETIME())',['STAFF_20261028_'+a.login,a.login,hash,a.name,base.role_id]);for(const w of warehouses)await c.execute('INSERT INTO TaiKhoan_Kho(account_id,warehouse_id) VALUES(?,?)',[account.id,w.id]);created.push({id:account.id,login:a.login,name:a.name});}
   await repo.audit(c,{accountId:null,system:true},'warehouse.staff.seed.completed','TaiKhoan',created[0].id,null,{accounts:created,warehouseIds:warehouses.map(w=>w.id),noWorkshopScope:true},randomUUID());
   fs.writeFileSync('.artifacts/WAREHOUSE-STAFF-logins.local.md',['# Tài khoản nhân viên kho — chỉ lưu cục bộ','','| Nhân viên | Đăng nhập | Mật khẩu |','|---|---|---|',...credentials.map(a=>'| '+a.name+' | '+a.login+' | '+a.password+' |'),'','Mở http://localhost:8080/login. Mỗi nhân viên xem việc được quản lý kho phân công tại mục Phân công. Không đưa file này lên GitHub/log.'].join('\n'),{mode:0o600});
   return{status:'SEEDED',accounts:created,passwordsLogged:false};
  });console.log(JSON.stringify(result));
 }finally{await pool.end();}
}
main().catch(e=>{console.error('STAFF_SEED_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
