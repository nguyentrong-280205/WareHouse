// Enrich rows already authorized by their read service. No independent lookup route.
const repo=require('./business-repository');
async function describeRows(c,rows){
 const cache=new Map();
 const find=async(table,id)=>{if(id===null||id===undefined)return undefined;const key=table+':'+id;if(!cache.has(key))cache.set(key,await repo.one(c,table,{id}));return cache.get(key);};
 const output=[];
 for(const source of rows){const row={...source};
  if(row.warehouseId)row.warehouseName=(await find('Kho',row.warehouseId))?.name;
  if(row.locationId)row.locationName=(await find('ViTriLuuKho',row.locationId))?.name;
  if(row.unitId)row.unitName=(await find('DonViTinh',row.unitId))?.name;
  const product=row.lotKind==='PRODUCT'||row.itemKind==='PRODUCT'||row.lotKind==='P'||row.itemKind==='P'||!!row.productLotId;
  const lotId=row.materialLotId||row.productLotId||row.lotId;
  const lot=lotId?await find(product?'LoThanhPham':'LoNguyenLieu',lotId):undefined;
  if(lot)row.lotCode=lot.code;
  const itemId=row.itemId||row.materialId||row.productId||lot?.material_id||lot?.product_id;
  if(itemId)row.itemName=(await find(product||row.productId?'ThanhPham':'NguyenLieu',itemId))?.name;
  for(const key of ['actorId','counterId','verifierId'])if(row[key]){const cacheKey='account:'+row[key];if(!cache.has(cacheKey)){const[[account]]=await c.execute('SELECT display_name FROM TaiKhoan WHERE id=?',[row[key]]);cache.set(cacheKey,account);}row[key.replace(/Id$/,'Name')]=cache.get(cacheKey)?.display_name;}
  output.push(row);
 }
 return output;
}
module.exports={describeRows};
