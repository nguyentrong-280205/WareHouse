// Offline, source-owned DDL conversion only. Never connects to any database.
// Legacy files are read verbatim; the new SQL Server lineage is written separately.
const fs = require('node:fs');
const path = require('node:path');
const { splitSql } = require('../database/sql');
function parts(text) {
  const result=[]; let start=0,depth=0,quote='';
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(quote){if(ch===quote){if(text[i+1]===quote)i++;else quote='';}}
    else if(ch==="'"||ch==='`')quote=ch;
    else if(ch==='(')depth++;else if(ch===')')depth--;
    else if(ch===','&&depth===0){result.push(text.slice(start,i).trim());start=i+1;}
  }
  result.push(text.slice(start).trim());return result;
}
const tables=new Map(), foreignKeys=[];
function add(table,definition){
  const col=/^`?(\w+)`?\s+(BIGINT|INTEGER|INT|SMALLINT|TINYINT|VARCHAR|CHAR|TEXT|ENUM|BOOLEAN|DATETIME|DATE|JSON|DECIMAL)\b([\s\S]*)$/i.exec(definition);
  if(col){table.columns.set(col[1],definition);return;}
  if(/FOREIGN KEY/i.test(definition)){foreignKeys.push({table:table.name,definition});return;}
  table.constraints.push(definition);
}
const directory=path.join(__dirname,'../database/migrations');
for(const file of fs.readdirSync(directory).filter(x=>x.endsWith('.sql')).sort()){
  if(file.includes('environment_bootstrap'))continue;
  for(const raw of splitSql(fs.readFileSync(path.join(directory,file),'utf8'))){
    const statement=raw.replace(/^\s*--[^\n]*(?:\n|$)/gm,'').trim();if(!statement)continue;
    const create=/^CREATE TABLE `?(\w+)`?\s*\(([\s\S]*)\)\s*ENGINE=/i.exec(statement);
    if(create){const table={name:create[1],columns:new Map(),constraints:[]};tables.set(table.name,table);for(const p of parts(create[2]))add(table,p);continue;}
    const alter=/^ALTER TABLE `?(\w+)`?\s+([\s\S]*)$/i.exec(statement);
    if(!alter)throw new Error('UNSUPPORTED_SOURCE_STATEMENT');
    const table=tables.get(alter[1]);if(!table)throw new Error('UNKNOWN_ALTER_TABLE');
    for(let p of parts(alter[2])){
      if(/^MODIFY\b/i.test(p))add(table,p.replace(/^MODIFY\s+/i,''));
      else if(/^ADD\b/i.test(p))add(table,p.replace(/^ADD\s+/i,''));
      else throw new Error('UNSUPPORTED_SOURCE_ALTER');
    }
  }
}
const q=name=>'['+name+']';
function expression(text){
  text=text.replace(/`(\w+)`/g,'$1').replace(/CURRENT_TIMESTAMP\(3\)/gi,'SYSUTCDATETIME()');
  text=text.replace(/REGEXP_LIKE\(login,\s*'[^']*',\s*'c'\)/i,"(LEN(login) BETWEEN 1 AND 100 AND login COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^a-z0-9_.-]%' AND LEFT(login,1) COLLATE Latin1_General_100_BIN2 LIKE '[a-z0-9]')");
  text=text.replace(/\((\w+) IS NULL\)\s*<>\s*\((\w+) IS NULL\)/gi,'(($1 IS NULL AND $2 IS NOT NULL) OR ($1 IS NOT NULL AND $2 IS NULL))');
  text=text.replace(/\((\w+) IS NOT NULL\)(?=\s*[+=<])/gi,'(CASE WHEN $1 IS NOT NULL THEN 1 ELSE 0 END)');
  text=text.replace(/\+\((\w+) IS NOT NULL\)/gi,'+(CASE WHEN $1 IS NOT NULL THEN 1 ELSE 0 END)');
  text=text.replace(/\bNOT discrete\b/gi,'discrete=0');
  // Quote only outside literals (the login pattern and enum values remain intact).
  const identifiers=new Set([...tables.values()].flatMap(t=>[t.name,...t.columns.keys()]));
  return text.split(/('(?:''|[^'])*')/g).map((segment,i)=>i%2?segment:segment.replace(/\b[A-Za-z_]\w*\b/g,x=>identifiers.has(x)?q(x):x)).join('');
}
const out=['-- SQL Server 2022 native schema; final approved model from immutable MySQL lineage.',
  '-- UTF-16 NVARCHAR; BIN2 identifiers; filtered nullable uniqueness; transactional DDL.',
  'SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON; SET ANSI_PADDING ON; SET ANSI_WARNINGS ON;',
  'SET CONCAT_NULL_YIELDS_NULL ON; SET ARITHABORT ON; SET NUMERIC_ROUNDABORT OFF;'];
const indexes=[];
let counter=0;
for(const table of tables.values()){
  const columns=[],checks=[],constraints=[];
  const nullable=new Set();
  for(const [name,source] of table.columns){
    let text=source.replace(/`/g,'').replace(/^\w+\s+/,''), unsigned=/\bUNSIGNED\b/i.test(text);
    const computed=/^.+? GENERATED ALWAYS AS \(([\s\S]*)\) STORED$/i.exec(text);
    if(computed){let ex=computed[1].replace(/IF\((\w+) IS NULL,'([^']*)','([^']*)'\)/gi,"CASE WHEN $1 IS NULL THEN '$2' ELSE '$3' END");columns.push(q(name)+' AS ('+expression(ex)+') PERSISTED');continue;}
    const en=/^ENUM\(([^)]*)\)/i.exec(text);
    if(en){checks.push(q(name)+' IN ('+en[1]+')');text=text.replace(en[0],'NVARCHAR(40)');}
    const json=/^JSON\b/i.test(text);if(json)checks.push(q(name)+' IS NULL OR ISJSON('+q(name)+')=1');
    if(/\bUNIQUE\b/.test(text)){
      indexes.push({table:table.name,columns:[name],unique:true});text=text.replace(/\s+UNIQUE\b/,'');
    }
    if(/\bPRIMARY KEY\b/.test(text)){constraints.push('PRIMARY KEY ('+q(name)+')');text=text.replace(/\s+PRIMARY KEY\b/,'');}
    text=text.replace(/BIGINT UNSIGNED/gi,'BIGINT').replace(/\b(?:INTEGER|INT) UNSIGNED/gi,'BIGINT').replace(/SMALLINT UNSIGNED/gi,'INT').replace(/TINYINT UNSIGNED/gi,'TINYINT').replace(/\bINTEGER\b/gi,'INT');
    if(/AUTO_INCREMENT/.test(text))text=text.replace(/\bNOT NULL\s*/i,'');
    text=text.replace(/\bAUTO_INCREMENT\b/gi,'IDENTITY(1,1) NOT NULL').replace(/\bBOOLEAN\b/gi,'BIT').replace(/\bDATETIME\(3\)/gi,'DATETIME2(3)').replace(/\bJSON\b/gi,'NVARCHAR(MAX)').replace(/\bTEXT\b/gi,'NVARCHAR(MAX)').replace(/\bVARCHAR\(/gi,'NVARCHAR(');
    text=text.replace(/CHARACTER SET utf8mb4\s*/gi,'').replace(/COLLATE utf8mb4_0900_bin/gi,'COLLATE Latin1_General_100_BIN2');
    text=text.replace(/CURRENT_TIMESTAMP\(3\)/gi,'SYSUTCDATETIME()');
    if(!/NOT NULL|IDENTITY/.test(text))nullable.add(name);
    if(unsigned)checks.push(q(name)+(name==='id'?' > 0':' >= 0'));
    columns.push(q(name)+' '+text);
  }
  for(const source of table.constraints){
    const index=/^(UNIQUE\s*(?:INDEX\s+`?(\w+)`?\s*)?|INDEX\s*(?:`?(\w+)`?\s*)?)\(([^)]*)\)$/i.exec(source);
    if(index){indexes.push({table:table.name,name:index[2]||index[3],columns:index[4].replace(/`/g,'').split(',').map(x=>x.trim()),unique:/^UNIQUE/i.test(source)});continue;}
    if(/^CHECK\b|^CONSTRAINT\b|^PRIMARY KEY\b/.test(source)){constraints.push(expression(source));continue;}
    throw new Error('UNSUPPORTED_CONSTRAINT: '+table.name+' '+source);
  }
  out.push('CREATE TABLE dbo.'+q(table.name)+' (\n  '+[...columns,...constraints,...checks.map(x=>'CHECK ('+x+')')].join(',\n  ')+'\n);');
  table.nullable=nullable;
}
for(const index of indexes){
  const name=index.name||'IX_'+index.table+'_'+(++counter);
  const nulls=index.columns.filter(x=>tables.get(index.table).nullable.has(x));
  out.push('CREATE '+(index.unique?'UNIQUE ':'')+'INDEX '+q(name)+' ON dbo.'+q(index.table)+' ('+index.columns.map(q).join(',')+')'+(index.unique&&nulls.length?' WHERE '+nulls.map(x=>q(x)+' IS NOT NULL').join(' AND '):'')+';');
}
for(const fk of foreignKeys){
  let text=fk.definition.replace(/ON DELETE RESTRICT/gi,'ON DELETE NO ACTION').replace(/ON UPDATE RESTRICT/gi,'ON UPDATE NO ACTION');
  text=expression(text);
  out.push('ALTER TABLE dbo.'+q(fk.table)+' ADD '+text+';');
}
const target=path.join(__dirname,'../database/sqlserver/migrations');fs.mkdirSync(target,{recursive:true});
const destination=path.join(target,'202610160001_native_schema.sql'), rendered=out.join('\n\n')+'\n';
if(fs.existsSync(destination)&&fs.readFileSync(destination,'utf8')!==rendered)throw new Error('IMMUTABLE_MIGRATION_USE_NEW_VERSION');
if(!fs.existsSync(destination))fs.writeFileSync(destination,rendered,{flag:'wx'});
console.log(JSON.stringify({tables:tables.size,foreignKeys:foreignKeys.length,indexes:indexes.length,output:'database/sqlserver/migrations/202610160001_native_schema.sql',databaseWrites:0}));
