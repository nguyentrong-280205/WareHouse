// Rename existing portable demo warehouses; preserve IDs, scopes and inventory.
require('dotenv/config');
const fs=require('node:fs'),{randomUUID}=require('node:crypto');
for(const[key,file]of [['DATABASE_URL','app_url'],['CSRF_SECRET','csrf']])if(!process.env[key]&&fs.existsSync('/run/secrets/'+file))process.env[key]=fs.readFileSync('/run/secrets/'+file,'utf8').trim();
const{loadConfig}=require('../src/config/environment'),{createDatabase,withTransaction}=require('../src/config/database'),repo=require('../src/shared/business-repository');
const expected=[
 {code:'FS_DEMO_20261015_NL',type:'MATERIAL',old:'Kho nguyên liệu giả FS',name:'Kho nguyên liệu'},
 {code:'FS_DEMO_20261015_TP',type:'FINISHED',old:'Kho thành phẩm giả FS',name:'Kho thành phẩm'},
 {code:'FS_DEMO_20261015_CTRL',type:'CONTROLLED',old:'Kho kiểm soát giả FS',name:'Kho hàng lỗi'},
];
async function main(){
 const config=loadConfig();if(config.db.machine!=='warehouse-sqlserver')throw Error('PORTABLE_TARGET_REQUIRED');const pool=createDatabase(config.DATABASE_URL);
 try{const result=await withTransaction(pool,async c=>{
  await require('./sqlserver-demo-guard').guardDemo(c,config);
  await c.raw("DECLARE @r int; EXEC @r=sp_getapplock @Resource=N'warehouse:catalog-names-20261028',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'WAREHOUSE_NAMES_LOCK',1;");
  const[[done]]=await c.execute("SELECT TOP(1) id FROM AuditLog WHERE action='warehouses.catalog.names.completed' AND actor_kind='SYSTEM'");if(done)return{status:'ALREADY_CONFIGURED',noOverwrite:true};
  const[warehouses]=await c.execute('SELECT id,code,name,type,status,version FROM Kho WITH(UPDLOCK,HOLDLOCK) ORDER BY id');
  if(warehouses.length!==3)throw Error('WAREHOUSE_CATALOG_REVIEW_REQUIRED');
  const changes=[];
  for(const target of expected){const row=warehouses.find(w=>w.code===target.code);if(!row||row.type!==target.type||row.status!=='ACTIVE'||![target.old,target.name].includes(row.name))throw Error('WAREHOUSE_CATALOG_CONFLICT_NO_OVERWRITE');changes.push({id:String(row.id),code:row.code,before:row.name,after:target.name});if(row.name!==target.name)await c.execute('UPDATE Kho SET name=?,version=version+1,updated_at=SYSUTCDATETIME() WHERE id=?',[target.name,row.id]);}
  await repo.audit(c,{accountId:null,system:true},'warehouses.catalog.names.completed','Kho',changes[0].id,{warehouses}, {warehouses:changes,idsScopesAndStockUnchanged:true},randomUUID());
  return{status:'CONFIGURED',warehouses:changes};
 });console.log(JSON.stringify(result));}finally{await pool.end();}
}
main().catch(e=>{console.error('WAREHOUSE_CATALOG_FAILED '+(/^[A-Z0-9_]+$/.test(e.message)?e.message:e.code||'CONFIGURATION_OR_CONFLICT'));process.exitCode=1;});
