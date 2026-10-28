// Explicit user approval 27/10: merge beverages, remove unused sample workshop,
// lock both general workshop accounts and create three scoped local accounts.
require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[key,file]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[key]&&fs.existsSync('/run/secrets/'+file))process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database');
const repo=require('../src/shared/business-repository'),{hashPassword}=require('../src/modules/auth/password');
const accounts=require('../src/modules/auth/simple-demo').dedicatedWorkshopAccounts.map(a=>({login:a.username,workshop:a.workshopCode,name:a.displayName}));
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL);
 try{
  const outcome=await withTransaction(pool,async c=>{
   await require('./sqlserver-demo-guard').guardDemo(c,config);
   await c.raw("DECLARE @r int; EXEC @r=sp_getapplock @Resource=N'warehouse:workshops-consolidate-20261027',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'WORKSHOP_MERGE_LOCK',1;");
   const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='workshops.consolidate.completed' ORDER BY id");
   if(done)return{status:'ALREADY_CONSOLIDATED',noScopeRegrant:true,noAccountUnlock:true};
   const [workshops]=await c.execute('SELECT * FROM XuongSanXuat WITH(UPDLOCK,HOLDLOCK) ORDER BY id');
   const get=code=>{const w=workshops.find(x=>x.code===code);if(!w||w.status!=='ACTIVE')throw new Error('EXPECTED_WORKSHOP_REQUIRED');return w;};
   const demo=get('FS_DEMO_20261015_WS_A'),can=get('XSX001'),beverage=get('XSX002');get('XSX003');get('XSX004');
   if(workshops.length!==5)throw new Error('ADDITIONAL_WORKSHOPS_REVIEW_REQUIRED');
   const[refs]=await c.execute("SELECT OBJECT_NAME(parent_object_id) AS child,COL_NAME(parent_object_id,parent_column_id) AS field FROM sys.foreign_key_columns WHERE referenced_object_id=OBJECT_ID('dbo.XuongSanXuat')");
   const allowed=['TaiKhoan_Xuong','LichNangLucXuong','ChiTietKeHoachSanXuat','PhieuXuatKhoNguyenLieu','PhieuNhapKhoThanhPham'];
   if(refs.length!==5||refs.some(r=>!allowed.includes(r.child)||r.field!=='workshop_id'))throw new Error('WORKSHOP_REFERENCE_REVIEW_REQUIRED');
   for(const table of allowed.slice(2))if((await repo.find(c,table,{workshop_id:demo.id},{lock:true})).length)throw new Error('DEMO_HAS_DOCUMENT_HISTORY_REVIEW_REQUIRED');
   const[[demoSchedule]]=await c.execute('SELECT COUNT(*) AS n FROM PhanBoLichSanXuat a JOIN LichNangLucXuong l ON l.id=a.calendar_id WHERE l.workshop_id=?',[demo.id]);
   if(Number(demoSchedule.n))throw new Error('DEMO_CALENDAR_HAS_HISTORY_REVIEW_REQUIRED');
   const[[overlap]]=await c.execute('SELECT COUNT(*) AS n FROM LichNangLucXuong a JOIN LichNangLucXuong b ON b.product_id=a.product_id AND b.business_date=a.business_date WHERE a.workshop_id=? AND b.workshop_id=?',[can.id,beverage.id]);
   if(Number(overlap.n))throw new Error('CALENDAR_OVERLAP_REVIEW_REQUIRED');
   const [oldScopes]=await c.execute('SELECT account_id,workshop_id FROM TaiKhoan_Xuong WHERE workshop_id IN (?,?)',[demo.id,can.id]);
   const demoCalendars=await repo.find(c,'LichNangLucXuong',{workshop_id:demo.id},{lock:true}),canCalendars=await repo.find(c,'LichNangLucXuong',{workshop_id:can.id},{lock:true});
   const moved={};for(const table of allowed.slice(2))moved[table]=await repo.find(c,table,{workshop_id:can.id},{lock:true});
   const[roleRows]=await c.execute("SELECT id FROM VaiTroQuyen WHERE code='UC01_DEMO_workshop' AND status='ACTIVE'");if(roleRows.length!==1)throw new Error('WORKSHOP_ROLE_REQUIRED');
   const roleId=roleRows[0].id;
   for(const a of accounts)if((await c.execute('SELECT id FROM TaiKhoan WITH(UPDLOCK,HOLDLOCK) WHERE login=? OR code=?',[a.login,'LOCAL_SIMPLE_'+a.login]))[0].length)throw new Error('ACCOUNT_COLLISION_NO_OVERWRITE');
   const[oldAccounts]=await c.execute("SELECT id,login,status,role_id FROM TaiKhoan WITH(UPDLOCK,HOLDLOCK) WHERE login IN ('xuong01','uc01.workshop') ORDER BY id");
   if(oldAccounts.length!==2||oldAccounts.some(a=>a.role_id!==roleId))throw new Error('GENERAL_WORKSHOP_ACCOUNTS_REVIEW_REQUIRED');
   const password=fs.readFileSync('/run/secrets/demo_password','utf8').trim();if(password.length<6||password.length>128)throw new Error('LOCAL_PASSWORD_INVALID');
   const hashes=[];for(const a of accounts)hashes.push(await hashPassword(password,config));
   const [warehouses]=await c.execute("SELECT id FROM Kho WHERE code IN ('FS_DEMO_20261015_NL','FS_DEMO_20261015_TP','FS_DEMO_20261015_CTRL') AND status='ACTIVE' ORDER BY id");if(warehouses.length!==3)throw new Error('WAREHOUSE_SCOPE_REVIEW_REQUIRED');
   // Keep calendar IDs, capacities and allocations intact; only change their workshop.
   await c.execute('UPDATE LichNangLucXuong SET workshop_id=? WHERE workshop_id=?',[beverage.id,can.id]);
   const affectedPlans=[...new Set(moved.ChiTietKeHoachSanXuat.map(l=>String(l.plan_id)))];
   for(const id of affectedPlans)await repo.one(c,'KeHoachSanXuat',{id},{lock:true});
   for(const table of allowed.slice(2)){
    if(table==='ChiTietKeHoachSanXuat')await c.execute('UPDATE ChiTietKeHoachSanXuat SET workshop_id=? WHERE workshop_id=?',[beverage.id,can.id]);
    else await c.execute('UPDATE dbo.['+table+'] SET workshop_id=?,version=version+1,updated_at=SYSUTCDATETIME() WHERE workshop_id=?',[beverage.id,can.id]);
   }
   for(const id of affectedPlans)await c.execute('UPDATE KeHoachSanXuat SET version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?',[id]);
   await c.execute('INSERT INTO TaiKhoan_Xuong(account_id,workshop_id) SELECT s.account_id,? FROM TaiKhoan_Xuong s WHERE s.workshop_id=? AND NOT EXISTS(SELECT 1 FROM TaiKhoan_Xuong t WHERE t.account_id=s.account_id AND t.workshop_id=?)',[beverage.id,can.id,beverage.id]);
   await c.execute('DELETE FROM TaiKhoan_Xuong WHERE workshop_id IN (?,?)',[demo.id,can.id]);
   await c.execute('DELETE FROM LichNangLucXuong WHERE workshop_id=?',[demo.id]);
   await c.execute('DELETE FROM XuongSanXuat WHERE id IN (?,?)',[demo.id,can.id]);
   await repo.update(c,'XuongSanXuat',{id:beverage.id},{name:'Xưởng nước giải khát'});
   for(const old of oldAccounts){await c.execute("UPDATE TaiKhoan SET status='LOCKED',version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?",[old.id]);await c.execute('UPDATE PhienDangNhap SET revoked_at=SYSUTCDATETIME() WHERE account_id=? AND revoked_at IS NULL',[old.id]);}
   const created=[];
   for(const[aIndex,a]of accounts.entries()){
    const workshop=get(a.workshop);
    const[[row]]=await c.execute('INSERT INTO TaiKhoan(code,login,password_hash,display_name,role_id,customer_id,updated_at) OUTPUT CONVERT(varchar(20),INSERTED.id) AS id VALUES(?,?,?,?,?,NULL,SYSUTCDATETIME())',['LOCAL_SIMPLE_'+a.login,a.login,hashes[aIndex],a.name,roleId]);
    await c.execute('INSERT INTO TaiKhoan_Xuong(account_id,workshop_id) VALUES(?,?)',[row.id,workshop.id]);
    for(const w of warehouses)await c.execute('INSERT INTO TaiKhoan_Kho(account_id,warehouse_id) VALUES(?,?)',[row.id,w.id]);
    created.push({id:row.id,login:a.login,workshopCode:a.workshop,workshopName:a.name});
   }
   const after={mapping:{[can.code]:beverage.code},removedDemo:demo.code,renamedBeverage:'Xưởng nước giải khát',movedCalendarIds:canCalendars.map(x=>x.id),affectedPlans,lockedAccounts:oldAccounts.map(a=>a.login),accounts:created,noQuantityOrPriceChanges:true};
   await repo.audit(c,{accountId:null,system:true},'workshops.consolidate.completed','XuongSanXuat',beverage.id,{workshops,oldScopes,demoCalendars,moved,oldAccounts},after,randomUUID());
   fs.mkdirSync('.artifacts',{recursive:true});const guide='.artifacts/WORKSHOP-logins.local.md';
   if(!fs.existsSync(guide))fs.writeFileSync(guide,['# Tài khoản ba xưởng — chỉ lưu cục bộ','','| Xưởng | Tên đăng nhập | Mật khẩu |','|---|---|---|',...accounts.map(a=>'| '+a.name+' | '+a.login+' | '+password+' |'),'','Không đưa file này lên GitHub/log. Hai tài khoản xưởng chung cũ đã khóa.'].join('\n'),{flag:'wx',mode:0o600});
   return{status:'CONSOLIDATED',workshops:3,movedCalendars:canCalendars.length,removedUnusedDemoCalendars:demoCalendars.length,affectedPlans,lockedAccounts:after.lockedAccounts,accounts:created};
  });console.log(JSON.stringify(outcome));
 }finally{await pool.end();}
}
main().catch(e=>{console.error('WORKSHOP_CONSOLIDATION_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
