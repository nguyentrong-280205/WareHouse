const {fail}=require('./business-context');
const baseCode=containerType=>containerType==='CAN'?'CAN':'BOTTLE';
function validatePackaging(product,unitCode,factor,cartonsPerPallet,cartonFactor){
 const base=baseCode(product.container_type),whole=10n**9n;
 if(![base,'PACK','CARTON','PALLET'].includes(unitCode))fail(422,'PRODUCT_UNIT_INCOMPATIBLE','Đơn vị đóng gói không phù hợp với chai/lon của thành phẩm.');
 if(unitCode===base&&factor!==whole)fail(422,'BASE_PACKAGING_INVALID','Một chai/lon phải bằng một đơn vị cơ sở.');
 if(unitCode==='PALLET'){
  if(cartonsPerPallet!==undefined&&cartonFactor!==undefined&&BigInt(cartonsPerPallet)*cartonFactor!==factor)fail(422,'PALLET_FACTOR_INVALID','Hệ số pallet không khớp số thùng và hệ số thùng đã cấu hình.');
 }else if(cartonsPerPallet!==undefined)fail(422,'PALLET_UNIT_REQUIRED','Số thùng/pallet chỉ được dùng cho đơn vị Pallet.');
}
module.exports={baseCode,validatePackaging};
