const repo=require('./repository');
const {fail,requireRow,now}=require('../../shared/business-context');
async function terminate(c,req,row,status){
 // Proposals become unusable before any scope unlock; all changes share the same transaction.
 await repo.invalidate(c,row.id);await repo.unlock(c,row.id);
 await repo.update(c,'BienBanKiemKe',{id:row.id},{status,scope_generation:row.scope_generation+1,version:row.version+1});
 await repo.audit(c,req.principal,'stocktakes.'+(status==='HET_HAN'?'expire':'cancel'),'BienBanKiemKe',row.id,row,{status,reason:req.body?.reason,at:now()},req.correlationId);
}
async function recover(c,req,warehouseId){for(const row of await repo.expired(c,warehouseId))await terminate(c,req,row,'HET_HAN');}
async function active(c,row){const locks=await repo.find(c,'KhoaViTriKiemKe',{stocktake_id:row.id},{lock:true});const scope=await repo.find(c,'PhamViKiemKe',{stocktake_id:row.id});if(locks.length!==scope.length||!locks.length||locks.some(l=>l.scope_generation!==row.scope_generation||Date.parse(String(l.expires_at).replace(' ','T')+'Z')<=Date.now()))fail(409,'STOCKTAKE_LEASE_INVALID','Phiên đã hết hạn hoặc không còn đủ khóa phạm vi.');return locks;}
async function generation(c,row,value){requireRow(row);if(row.scope_generation!==value)fail(409,'STALE_SCOPE','Phạm vi kiểm kê đã thay đổi.');return active(c,row);}
module.exports={terminate,recover,active,generation};
