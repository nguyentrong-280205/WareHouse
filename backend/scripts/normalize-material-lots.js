require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[k,f]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[k]&&fs.existsSync('/run/secrets/'+f))process.env[k]=fs.readFileSync('/run/secrets/'+f,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),repo=require('../src/shared/business-repository'),{prefixes}=require('../src/modules/warehouse/material-lot-codes');
async function main(){const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw Error('PORTABLE_TARGET_REQUIRED');const pool=createDatabase(config.DATABASE_URL);try{const result=await withTransaction(pool,async c=>{
 await require('./sqlserver-demo-guard').guardDemo(c,config);
 await c.raw("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=N'warehouse:normalize-material-lots-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'LOT_NORMALIZE_LOCK',1;");
 const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='materialLots.sample.codes.normalized'");if(done)return{status:'ALREADY_NORMALIZED',noOverwrite:true};
 const[[seed]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE actor_kind='SYSTEM' AND action='planning.sample.completed'");if(!seed)throw Error('PLANNING_SAMPLE_REQUIRED');
 const changes=[];
 for(const[materialCode,token]of Object.entries(prefixes)){
  const material=await repo.one(c,'NguyenLieu',{code:materialCode},{lock:true});if(!material)throw Error('EXPECTED_SAMPLE_MATERIAL_MISSING');
  const oldCode=materialCode+'_KHOITAO_20261023',newCode='LO-'+token+'-01';
  const old=await repo.one(c,'LoNguyenLieu',{material_id:material.id,code:oldCode},{lock:true});if(!old)throw Error('EXPECTED_SAMPLE_LOT_MISSING');
  if(await repo.one(c,'LoNguyenLieu',{material_id:material.id,code:newCode},{lock:true}))throw Error('MATERIAL_LOT_CODE_CONFLICT_NO_OVERWRITE');
  changes.push({id:String(old.id),materialCode,before:oldCode,after:newCode});
 }
 for(const change of changes)await c.execute('UPDATE LoNguyenLieu SET code=?,version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?',[change.after,change.id]);
 await repo.audit(c,{accountId:null,system:true},'materialLots.sample.codes.normalized','LoNguyenLieu',changes[0].id,{lots:changes.map(x=>({id:x.id,code:x.before}))},{lots:changes,noStockOrLotIdentityChange:true},randomUUID());
 return{status:'NORMALIZED',lots:changes};
 });console.log(JSON.stringify(result));}finally{await pool.end();}}
main().catch(e=>{console.error('MATERIAL_LOT_NORMALIZE_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
