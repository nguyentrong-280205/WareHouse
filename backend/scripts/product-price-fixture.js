// User delegated sample pricing on 23/10/2026; these are project fixtures, not market quotations.
const {products}=require('./product-catalog-fixture');
const basePrices=['10000','9000','18000','10000','9000','10000','9000','9000','12000','15000','9000','9000','11000','12000','5000'];
module.exports={revision:'PRODUCT_PRICES_20261023',products:products.map((p,index)=>({...p,basePrice:basePrices[index]}))};
