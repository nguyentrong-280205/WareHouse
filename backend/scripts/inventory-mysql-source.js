// Read-only inventory of the preserved source. Not part of the SQL Server runtime.
if (process.env.REVIEWED_MYSQL_SOURCE_INVENTORY !== 'true') throw new Error('ARCHIVED_MYSQL_TOOL_REQUIRES_SEPARATE_DRIVER_AND_REVIEW');
const fs=require('node:fs'),path=require('node:path'),mysql=require('mysql2/promise');
async function main(){
  const env=require('dotenv').parse(fs.readFileSync(path.join(__dirname,'../.artifacts/sqlserver/mysql.env.backup')));
  const u=new URL(env.DATABASE_URL),pool=mysql.createPool({host:u.hostname,port:Number(u.port),user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),database:'warehouse_db',supportBigNumbers:true,bigNumberStrings:true,dateStrings:true});
  try{
    const [tables]=await pool.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='warehouse_db' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME"),rows=[];
    for(const t of tables){if(!/^[A-Za-z_]+$/.test(t.TABLE_NAME))throw new Error('INVALID_IDENTIFIER');const[[n]]=await pool.execute('SELECT COUNT(*) AS n FROM `'+t.TABLE_NAME+'`');const[[col]]=await pool.execute("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='warehouse_db' AND TABLE_NAME=? AND COLUMN_NAME='id'",[t.TABLE_NAME]);let maxId=null;if(Number(col.n)){const[[m]]=await pool.execute('SELECT CAST(MAX(id) AS CHAR) AS id FROM `'+t.TABLE_NAME+'`');maxId=m.id;}rows.push({table:t.TABLE_NAME,count:String(n.n),maxId});}
    fs.writeFileSync(path.join(__dirname,'../.artifacts/sqlserver/mysql-source-inventory.json'),JSON.stringify({capturedAt:new Date().toISOString(),database:'warehouse_db',readOnly:true,tables:rows},null,2));
    console.log(JSON.stringify({tables:rows.length,nonempty:rows.filter(r=>r.count!=='0').map(r=>({table:r.table,count:r.count})),readOnly:true}));
  }finally{await pool.end();}
}
main().catch(()=>{console.error('MYSQL_READ_ONLY_INVENTORY_FAILED');process.exitCode=1;});
