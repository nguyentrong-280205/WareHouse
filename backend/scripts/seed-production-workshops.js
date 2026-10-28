// Four workshop names approved by the user; no capacity, calendar or BOM assumptions.
require('dotenv/config');
const {randomUUID}=require('node:crypto');
const{loadConfig}=require('../src/config/environment');
const{createDatabase,withTransaction,withConnection}=require('../src/config/database');
const{guardDemo}=require('./sqlserver-demo-guard');
const repo=require('../src/shared/business-repository');
const workshops=[
 {code:'XSX001',name:'Xưởng nước giải khát đóng lon',products:['TP001','TP004','TP006','TP009','TP010']},
 {code:'XSX002',name:'Xưởng nước giải khát chai PET',products:['TP002','TP003','TP005','TP007','TP008']},
 {code:'XSX003',name:'Xưởng trà và nước trái cây',products:['TP011','TP012','TP013','TP014']},
 {code:'XSX004',name:'Xưởng nước tinh khiết',products:['TP015']},
];
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw new Error('PORTABLE_DOCKER_TARGET_REQUIRED');
 const pool=createDatabase(config.DATABASE_URL),verify=process.argv.includes('--verify');
 try{
  const result=await(verify?withConnection:withTransaction)(pool,async c=>{
   await guardDemo(c,config);
   if(!verify)await c.raw("DECLARE @result int; EXEC @result=sys.sp_getapplock @Resource=N'warehouse:seed:production-workshops-20261023',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @result<0 THROW 51000,'WORKSHOP_SEED_LOCK_UNAVAILABLE',1;");
   const[[consolidated]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE action='workshops.consolidate.completed' AND actor_kind='SYSTEM'");
   const entries=consolidated?[{code:'XSX002',name:'Xưởng nước giải khát'},...workshops.filter(w=>['XSX003','XSX004'].includes(w.code))]:workshops;
   const summary={inserted:0,preserved:0,scopeLinksAdded:0,workshops:[]};
   for(const entry of entries){
    let row=await repo.one(c,'XuongSanXuat',{code:entry.code},{lock:!verify});
    if(row&&row.name!==entry.name)throw new Error('WORKSHOP_CODE_NAME_CONFLICT');
    if(!row){
     if(verify)throw new Error('WORKSHOP_NOT_CREATED');
     const id=await repo.insert(c,'XuongSanXuat',{code:entry.code,name:entry.name,status:'ACTIVE'});
     row=await repo.one(c,'XuongSanXuat',{id});summary.inserted++;
     await repo.audit(c,{accountId:null,system:true},'catalog.productionWorkshop.seed','XuongSanXuat',id,null,{code:entry.code,name:entry.name,noScopeChanges:true,noCapacityAssumed:true},randomUUID());
    }else summary.preserved++;
    const[[scope]]=await c.execute('SELECT COUNT(*) AS n FROM TaiKhoan_Xuong WHERE workshop_id=?',[row.id]);
    summary.workshops.push({code:row.code,name:row.name,status:row.status,scopeAccounts:Number(scope.n)});
   }
   const[[count]]=await c.execute('SELECT COUNT(*) AS total FROM XuongSanXuat');
   return{...summary,totalWorkshops:Number(count.total),mode:verify?'READ_ONLY':'FILL_MISSING_ONLY',oldWorkshop:consolidated?'REMOVED':'UNCHANGED',calendar:'NOT_CREATED',capacity:'NOT_ASSUMED'};
  });
  console.log(JSON.stringify(result));
 }finally{await pool.end();}
}
main().catch(error=>{console.error('WORKSHOP_SEED_FAILED '+(/^[A-Z0-9_]+$/.test(error.message)?error.message:error.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
