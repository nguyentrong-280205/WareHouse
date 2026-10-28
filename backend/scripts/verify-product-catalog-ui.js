const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
async function main(){
 const contract=require('../../docs/runtime_api.json'),{compileSchema}=require('../src/shared/contract-validation');
 compileSchema(contract.components.schemas.ProductInputUpdate,contract).parse({expectedVersion:0,shelfLifeDays:365,salesPrices:[]});
 const{convertedProductQuantity:convert,defaultProductExpiry:expiry,palletBaseQuantity:pallet,orderPackaging}=await import(pathToFileURL(path.resolve(__dirname,'../../frontend/src/features/productCatalog.js')).href);
 for(const[factor,expected]of [['1','2'],['6','12'],['24','48'],['1440','2880'],['1920','3840']])assert.equal(convert('2',factor),expected);
 assert.equal(convert('0.5','1'),'');assert.equal(convert('0.5','24'),'12');assert.equal(convert('99999999999999','1920'),'');
 const packaging=[{unitCode:'CAN',effectiveFrom:'2020-01-01'},{unitCode:'BOTTLE',effectiveFrom:'2020-01-01'},{unitCode:'PACK',effectiveFrom:'2020-01-01'},{unitCode:'CARTON',unitsPerPack:'24.000000000',revision:1,effectiveFrom:'2020-01-01'},{unitCode:'PALLET',effectiveFrom:'2099-01-01'}];
 assert.deepEqual(orderPackaging({containerType:'CAN',packaging},'2026-10-23').map(p=>p.unitCode),['CAN','PACK','CARTON']);
 assert.deepEqual(orderPackaging({containerType:'PET',packaging},'2026-10-23').map(p=>p.unitCode),['BOTTLE','PACK','CARTON']);
 assert.equal(pallet('60',packaging,'2026-10-23'),'1440.000000000');assert.equal(pallet('80',packaging,'2026-10-23'),'1920.000000000');
 packaging.push({unitCode:'CARTON',unitsPerPack:'30.000000000',revision:2,effectiveFrom:'2026-10-24'});
 assert.equal(pallet('60',packaging,'2026-10-23'),'1440.000000000');assert.equal(pallet('60',packaging,'2026-10-24'),'1800.000000000');
 assert.equal(expiry('2024-02-28',1),'2024-02-29');assert.equal(expiry('2024-02-30',365),'');assert.equal(expiry('2026-10-23',365),'2027-10-23');
 console.log('CATALOG_UI_HELPERS_OK exact_conversions compatible_units effective_versions pallet_snapshots expiry_dates');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
