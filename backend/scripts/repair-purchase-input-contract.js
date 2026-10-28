const fs=require('node:fs');
// A JSON pattern needs one regex escape for the decimal point, not two.
const decimal=String.raw`^[0-9]{1,14}(\.[0-9]{1,6})?$`;
for(const file of ['../docs/api_contract.yaml','../docs/runtime_api.json']){
 const api=JSON.parse(fs.readFileSync(file,'utf8')),schemas=api.components.schemas;
 for(const name of ['Quantity','UnitPrice'])schemas[name].pattern=decimal;
 schemas.PurchaseInput.properties.lines.items.properties.quantity.pattern=decimal;
 fs.writeFileSync(file,JSON.stringify(api,null,2)+'\n');
}
console.log('Purchase quantity and shared DECIMAL patterns corrected; VND remains required.');
