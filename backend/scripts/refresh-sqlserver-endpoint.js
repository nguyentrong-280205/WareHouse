// Called only after Windows Authentication discovers the actual named-instance port.
// Update endpoint configuration only: no schema changes and no business data access.
const fs=require('node:fs'),path=require('node:path');
const {parseDatabaseUrl}=require('../src/config/environment');
function main(){
 const port=Number(process.argv[2]);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('INVALID_DISCOVERED_PORT');
 const root=path.join(__dirname,'../..'),envFile=path.join(root,'backend/.env');
 const original=fs.readFileSync(envFile,'utf8'),values=require('dotenv').parse(original);
 const changes=[],updated={};
 for(const key of ['DATABASE_URL','MIGRATION_DATABASE_URL','TEST_DATABASE_URL','TEST_MIGRATION_DATABASE_URL']){
  const value=values[key],config=parseDatabaseUrl(value);
  if(config.instance!=='HTTT02'||!['nguyentrong-200','localhost','127.0.0.1'].includes(config.host.toLowerCase()))throw new Error('UNEXPECTED_SQLSERVER_ENDPOINT');
  const url=new URL(value);url.port=String(port);updated[key]=url.toString();
 }
 let next=original;
 for(const[key,value]of Object.entries(updated))next=next.replace(new RegExp('^'+key+'=.*$','m'),()=>key+'='+value);
 const test=parseDatabaseUrl(updated.TEST_DATABASE_URL);
 const allowlist='TEST_ALLOWED_ENDPOINTS='+test.host+':'+port;
 next=/^TEST_ALLOWED_ENDPOINTS=.*$/m.test(next)?next.replace(/^TEST_ALLOWED_ENDPOINTS=.*$/m,()=>allowlist):next+'\n'+allowlist+'\n';
 if(next!==original)changes.push({file:envFile,before:original,after:next});
 for(const[key,name]of [['DATABASE_URL','sqlserverAppUrl'],['MIGRATION_DATABASE_URL','sqlserverMigrationUrl']]){
  const file=path.join(root,'infra/secrets',name),url=new URL(updated[key]);url.hostname='host.docker.internal';
  const after=url.toString()+'\n',before=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
  if(before!==null){
   const previous=new URL(before.trim()),oldConfig=parseDatabaseUrl(before.trim()),current=parseDatabaseUrl(after.trim());
   if(previous.hostname!=='host.docker.internal'||oldConfig.user!==current.user||oldConfig.password!==current.password||oldConfig.database!==current.database||oldConfig.instance!==current.instance)throw new Error('DOCKER_CREDENTIAL_CONFLICT_REQUIRES_REVIEW');
  }
  if(before!==after)changes.push({file,before,after});
 }
 const backup=path.join(root,'backend/.artifacts/sqlserver/endpoint-backups',new Date().toISOString().replace(/[:.]/g,'-'));
 if(changes.length){
  fs.mkdirSync(backup,{recursive:true});
  for(const[index,change]of changes.entries())if(change.before!==null)fs.writeFileSync(path.join(backup,index+'-'+path.basename(change.file)),change.before,{flag:'wx',mode:0o600});
  for(const change of changes){fs.mkdirSync(path.dirname(change.file),{recursive:true});fs.writeFileSync(change.file,change.after,{mode:0o600});}
 }
 console.log('SQLSERVER_ENDPOINT_REFRESHED instance=HTTT02 tcp_port='+port+' config_files_changed='+changes.length+' credentials=UNCHANGED');
}
try{main();}catch(error){console.error(/^[A-Z0-9_]+$/.test(error.message)?error.message:'SQLSERVER_ENDPOINT_REFRESH_FAILED');process.exitCode=1;}
