require('dotenv/config');
const fs=require('node:fs'),path=require('node:path');
const {parseDatabaseUrl}=require('../src/config/environment');
const target=path.join(__dirname,'../../infra/secrets');fs.mkdirSync(target,{recursive:true});
for(const[key,file]of [['DATABASE_URL','sqlserverAppUrl'],['MIGRATION_DATABASE_URL','sqlserverMigrationUrl']]){
 const db=parseDatabaseUrl(process.env[key]);if(!db.port||db.instance!=='HTTT02')throw new Error('VERIFIED_TCP_PORT_REQUIRED');
 const url=new URL(process.env[key]);url.hostname='host.docker.internal';
 const destination=path.join(target,file),value=url.toString();
 if(fs.existsSync(destination)&&fs.readFileSync(destination,'utf8').trim()!==value)throw new Error('EXISTING_DOCKER_SECRET_REQUIRES_REVIEW');
 if(!fs.existsSync(destination))fs.writeFileSync(destination,value+'\n',{flag:'wx',mode:0o600});
}
console.log('SQL Server Docker endpoint prepared in ignored secret files; no MySQL/volume changes.');
