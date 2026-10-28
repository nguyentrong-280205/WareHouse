function timestamp(value){return typeof value==='string'&&/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d/.test(value)?value.replace(' ','T')+'Z':value;}
function rowDto(row){return Object.fromEntries(Object.entries(row).map(([key,value])=>[key.replace(/_([a-z])/g,(_,letter)=>letter.toUpperCase()),value===null?null:(key==='id'||key.endsWith('_id'))?String(value):key.endsWith('_at')?timestamp(value):value]));}
module.exports={timestamp,rowDto};
