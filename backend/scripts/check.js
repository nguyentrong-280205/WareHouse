const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
function walk(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]); }
for (const file of ['src','database','scripts','tests'].flatMap(walk).filter(p=>p.endsWith('.js'))) {
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0){ console.error('SYNTAX_CHECK_FAILED: '+file);process.exit(1); }
}
console.log('CommonJS JavaScript syntax checks passed.');
