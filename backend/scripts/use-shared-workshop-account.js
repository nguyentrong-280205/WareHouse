// User approval 28/10: one workshop login xuong01 manages all three workshops.
require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[key,file]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[key]&&fs.existsSync('/run/secrets/'+file))process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database');
const repo=require('../src/shared/business-repository');
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL);
 try{
  const outcome=await withTransaction(pool,async c=>{
   await require('./sqlserver-demo-guard').guardDemo(c,config);
   await c.raw("DECLARE @r int; EXEC @r=sp_getapplock @Resource=N'warehouse:workshops-shared-account-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'WORKSHOP_ACCOUNT_LOCK',1;");
   const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='workshops.shared-account.completed'");
   if(done)return{status:'ALREADY_CONFIGURED',noAccountUnlock:true,noScopeRegrant:true};
   const[[merged]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='workshops.consolidate.completed'");
   if(!merged)throw new Error('WORKSHOP_CONSOLIDATION_REQUIRED');
   const[workshops]=await c.execute('SELECT id,code,status FROM XuongSanXuat WITH(UPDLOCK,HOLDLOCK) ORDER BY id');
   if(workshops.length!==3||workshops.some(w=>!['XSX002','XSX003','XSX004'].includes(w.code)||w.status!=='ACTIVE'))throw new Error('THREE_WORKSHOPS_REQUIRED');
   const[accounts]=await c.execute("SELECT id,code,login,status,role_id,customer_id FROM TaiKhoan WITH(UPDLOCK,HOLDLOCK) WHERE login IN ('xuong01','uc01.workshop','xuong_ngk','xuong_tra','xuong_nuoc') ORDER BY id");
   const[roles]=await c.execute("SELECT id FROM VaiTroQuyen WHERE code='UC01_DEMO_workshop' AND status='ACTIVE'");
   if(roles.length!==1||accounts.length!==5||accounts.some(a=>a.role_id!==roles[0].id||a.customer_id!==null))throw new Error('WORKSHOP_ACCOUNTS_REVIEW_REQUIRED');
   const shared=accounts.find(a=>a.login==='xuong01');
   if(shared.code!=='LOCAL_SIMPLE_xuong01')throw new Error('SHARED_ACCOUNT_CODE_MISMATCH');
   const[beforeScopes]=await c.execute('SELECT workshop_id FROM TaiKhoan_Xuong WHERE account_id=?',[shared.id]);
   for(const w of workshops)await c.execute('INSERT INTO TaiKhoan_Xuong(account_id,workshop_id) SELECT ?,? WHERE NOT EXISTS(SELECT 1 FROM TaiKhoan_Xuong WHERE account_id=? AND workshop_id=?)',[shared.id,w.id,shared.id,w.id]);
   // Preserve the existing password hash and warehouse permissions.
   await c.execute("UPDATE TaiKhoan SET status='ACTIVE',failed_attempt_count=0,failed_window_started_at=NULL,locked_until=NULL,version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?",[shared.id]);
   for(const a of accounts){
    if(a.id!==shared.id)await c.execute("UPDATE TaiKhoan SET status='LOCKED',version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?",[a.id]);
    await c.execute('UPDATE PhienDangNhap SET revoked_at=SYSUTCDATETIME() WHERE account_id=? AND revoked_at IS NULL',[a.id]);
   }
   const after={activeLogin:shared.login,workshops:workshops.map(w=>w.code),lockedLogins:accounts.filter(a=>a.id!==shared.id).map(a=>a.login),passwordUnchanged:true,warehouseScopesUnchanged:true};
   await repo.audit(c,{accountId:null,system:true},'workshops.shared-account.completed','TaiKhoan',shared.id,{accounts,workshopScopes:beforeScopes},after,randomUUID());
   return{status:'CONFIGURED',...after};
  });
  console.log(JSON.stringify(outcome));
 }finally{await pool.end();}
}
main().catch(e=>{console.error('SHARED_WORKSHOP_ACCOUNT_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
