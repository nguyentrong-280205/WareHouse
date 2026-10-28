const prefixes=Object.freeze({
 NVL001:'VO-LON-250ML',NVL002:'VO-LON-330ML',NVL003:'NAP-LON',NVL004:'VO-CHAI-PET-350ML',NVL005:'VO-CHAI-PET-450ML',NVL006:'VO-CHAI-PET-500ML',NVL007:'VO-CHAI-PET-15L',NVL008:'NAP-CHAI',NVL009:'NHAN-CHAI',NVL010:'THUNG-CARTON',
 NVL011:'DUONG',NVL012:'NUOC-XU-LY',NVL013:'HUONG-COLA',NVL014:'HUONG-CAM',NVL015:'HUONG-CHANH',NVL016:'HUONG-DAU',NVL017:'TANG-LUC',NVL018:'TRA-CHIET-XUAT',NVL019:'HUONG-DAO',NVL020:'CO2-THUC-PHAM',
});
function prefix(material){
 const known=prefixes[material.code];
 if(known)return 'LO-'+known+'-';
 const slug=(material.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'D').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,22).replace(/-+$/,'');
 return 'LO-'+(slug||'NGUYEN-LIEU')+'-'+String(material.id)+'-';
}
async function next(c,material){
 // Serialize code generation for this material across application instances.
 await c.execute("DECLARE @r int; EXEC @r=sys.sp_getapplock @Resource=?,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000; IF @r<0 THROW 51000,'MATERIAL_LOT_CODE_LOCK',1;",['warehouse:material-lot-code:'+material.id]);
 const[rows]=await c.execute('SELECT code FROM LoNguyenLieu WITH(UPDLOCK,HOLDLOCK) WHERE material_id=?',[material.id]);
 const start=prefix(material);let largest=0n;
 for(const row of rows){if(!row.code.startsWith(start))continue;const suffix=row.code.slice(start.length);if(/^\d+$/.test(suffix)){const n=BigInt(suffix);if(n>largest)largest=n;}}
 const code=start+String(largest+1n).padStart(2,'0');if(code.length>50)throw Error('MATERIAL_LOT_CODE_EXHAUSTED');return code;
}
module.exports={prefix,prefixes,next};
