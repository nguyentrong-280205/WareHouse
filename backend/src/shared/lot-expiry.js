function defaultExpiry(manufacturedOn,shelfLifeDays){
 if(!/^\d{4}-\d\d-\d\d$/.test(manufacturedOn||'')||!Number.isSafeInteger(shelfLifeDays)||shelfLifeDays<1)return undefined;
 const date=new Date(manufacturedOn+'T00:00:00.000Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==manufacturedOn)return undefined;
 date.setUTCDate(date.getUTCDate()+shelfLifeDays);
 if(!Number.isFinite(date.getTime())||date.getUTCFullYear()>9999)return undefined;
 return date.toISOString().slice(0,10);
}
module.exports={defaultExpiry};
