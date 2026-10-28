// Intentionally runs ONLY the newly authorized catalog scenario, against portable warehouse_test.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const secrets=path.resolve(__dirname,'../../infra/secrets/docker');
const url=new URL(fs.readFileSync(path.join(secrets,'testAppUrl'),'utf8').trim());
url.hostname='localhost';url.port=process.env.SQLSERVER_DOCKER_PORT||'14330';
const env={...process.env,NODE_ENV:'test',TEST_DATABASE_URL:url.href,DATABASE_URL:url.href,TEST_ALLOWED_ENDPOINTS:'localhost:'+url.port,TEST_INSTANCE_ID:fs.readFileSync(path.join(secrets,'testMarker'),'utf8').trim()};
delete env.DATABASE_URL_FILE;delete env.TEST_DATABASE_URL_FILE;
const result=spawnSync(process.execPath,[require.resolve('jest/bin/jest'),'--runInBand','--runTestsByPath','tests/integration/product-catalog.test.js'],{cwd:path.resolve(__dirname,'..'),env,stdio:'inherit'});
process.exitCode=result.status??1;
