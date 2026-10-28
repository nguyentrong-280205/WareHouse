// One-time source conversion. Offline only. Review the resulting repositories;
// this is not an SQL translation layer used by the application.
const fs=require('node:fs'),path=require('node:path');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(path.join(__dirname,'../src/modules')).filter(x=>x.endsWith('repository.js'));
for(const file of files){
 let source=fs.readFileSync(file,'utf8');
 source=source.replace(/TABLE_SCHEMA=DATABASE\(\)/g,"TABLE_CATALOG=DB_NAME() AND TABLE_SCHEMA='dbo'");
 source=source.replace(/DATE\(CONVERT_TZ\(UTC_TIMESTAMP\(\),'\+00:00','\+07:00'\)\)/g,'CONVERT(date,DATEADD(hour,7,SYSUTCDATETIME()))');
 source=source.replace(/CONVERT_TZ\(DATE_ADD\(CONCAT\(\?,' 00:00:00'\),INTERVAL 1 DAY\),'\+07:00','\+00:00'\)/g,'DATEADD(day,1,DATEADD(hour,-7,CONVERT(datetime2(3),?)))');
 source=source.replace(/CONVERT_TZ\(CONCAT\(\?,' 00:00:00'\),'\+07:00','\+00:00'\)/g,'DATEADD(hour,-7,CONVERT(datetime2(3),?))');
 source=source.replace(/(?:UTC_TIMESTAMP|CURRENT_TIMESTAMP)\(3\)/g,'SYSUTCDATETIME()');
 source=source.replace(/ LIMIT '\+Number\(pageSize\)\+' OFFSET '\+\(\(page-1\)\*pageSize\)/g," OFFSET '+((page-1)*pageSize)+' ROWS FETCH NEXT '+Number(pageSize)+' ROWS ONLY'");
 source=source.replace(/LIMIT 100/g,'OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY');
 source=source.replace(/SELECT t.id FROM ThanhVienKiemKe/g,'SELECT TOP (1) t.id FROM ThanhVienKiemKe').replace(/stocktakes.count' LIMIT 1/g,"stocktakes.count'");
 source=source.replace(/LIMIT 1/g,'OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY');
 source=source.replace(/l\.expires_on IS NULL,l\.expires_on,l\.first_received_at IS NULL/g,'CASE WHEN l.expires_on IS NULL THEN 1 ELSE 0 END,l.expires_on,CASE WHEN l.first_received_at IS NULL THEN 1 ELSE 0 END');
 source=source.split('\n').map(line=>{
   if(!line.includes(' FOR UPDATE')&&!line.includes(' FOR SHARE'))return line;
   // Dynamic session SQL is reviewed separately below.
   if(line.includes('const session ='))return line;
   const hints=line.includes(' FOR UPDATE')?'UPDLOCK,HOLDLOCK,ROWLOCK':'HOLDLOCK,ROWLOCK';
   line=line.replace(/FROM (\w+)(?: ([a-z]))?(?= (?:WHERE|JOIN|ORDER))/,(m)=>m+' WITH ('+hints+')');
   return line.replace(/ FOR (?:UPDATE|SHARE)/g,'');
 }).join('\n');
 source=source.replace(/\(k.status='ACTIVE' AND ([\s\S]*?)\) AS eligible/g,"CAST(CASE WHEN k.status='ACTIVE' AND $1 THEN 1 ELSE 0 END AS bit) AS eligible");
 // Backtick identifiers occur only in these legacy SQL literals.
 source=source.replace(/`key`/g,'[key]');
 fs.writeFileSync(file,source);
}
console.log('Repository sources converted; manual review and syntax checks remain required.');
