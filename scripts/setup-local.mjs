import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
throw new Error('DA_THAY_THE_USE_SETUP_SQLSERVER_PS1');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (['infra/.env','backend/.env','infra/secrets'].some(p => existsSync(resolve(root,p)))) {
  console.error('Private configuration exists; refusing overwrite or disclosure.'); process.exit(1);
}
const secret = () => randomBytes(32).toString('hex');
const values = { devRoot:secret(),testRoot:secret(),devApp:secret(),testApp:secret(),devMigration:secret(),testMigration:secret(),shadow:secret(),csrf:secret(),testId:randomUUID() };
mkdirSync(resolve(root,'infra/secrets'),{recursive:true});
for (const [key,value] of Object.entries(values)) writeFileSync(resolve(root,'infra/secrets',key),value+'\n',{flag:'wx',mode:0o600});
for (const [name,user,key,db,host] of [
  ['devAppUrl','warehouse_app','devApp','warehouse_db','mysql-dev'],
  ['devMigrationUrl','warehouse_migration','devMigration','warehouse_db','mysql-dev'],
  ['testAppUrl','warehouse_test_app','testApp','warehouse_test','mysql-test'],
  ['testMigrationUrl','warehouse_test_migration','testMigration','warehouse_test','mysql-test']]) {
  writeFileSync(resolve(root,'infra/secrets',name),'mysql://'+user+':'+values[key]+'@'+host+':3306/'+db+'\n',{flag:'wx',mode:0o600});
}
const backend = ['NODE_ENV=development','HOST=127.0.0.1','PORT=3000',
  'DATABASE_URL=mysql://warehouse_app:'+values.devApp+'@127.0.0.1:3307/warehouse_db',
  'MIGRATION_DATABASE_URL=mysql://warehouse_migration:'+values.devMigration+'@127.0.0.1:3307/warehouse_db',
  'TEST_DATABASE_URL=mysql://warehouse_test_app:'+values.testApp+'@127.0.0.1:3308/warehouse_test',
  'TEST_MIGRATION_DATABASE_URL=mysql://warehouse_test_migration:'+values.testMigration+'@127.0.0.1:3308/warehouse_test',
  'SHADOW_DATABASE_URL=mysql://warehouse_shadow:'+values.shadow+'@127.0.0.1:3308/warehouse_shadow',
  'TEST_INSTANCE_ID='+values.testId,
  'TEST_ALLOWED_ENDPOINTS=127.0.0.1:3308,localhost:3308,mysql-test:3306','CSRF_SECRET='+values.csrf,
  'CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080','LOG_LEVEL=info'].join('\n')+'\n';
writeFileSync(resolve(root,'backend/.env'),backend,{flag:'wx',mode:0o600});
writeFileSync(resolve(root,'infra/.env'),'TEST_INSTANCE_ID='+values.testId+'\n',{flag:'wx',mode:0o600});
console.log('Private configuration generated, credentials not printed; frontend env unchanged.');
