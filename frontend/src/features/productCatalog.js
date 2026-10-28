export function defaultProductExpiry(manufacturedOn,days){
 if(!/^\d{4}-\d\d-\d\d$/.test(manufacturedOn||'')||!Number.isSafeInteger(days)||days<1)return '';
 const date=new Date(manufacturedOn+'T00:00:00.000Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==manufacturedOn)return '';
 date.setUTCDate(date.getUTCDate()+days);
 return Number.isFinite(date.getTime())&&date.getUTCFullYear()<=9999?date.toISOString().slice(0,10):'';
}
export function palletBaseQuantity(cartons,packaging,effectiveFrom){
 if(!/^[1-9][0-9]{0,9}$/.test(String(cartons))||!effectiveFrom)return '';
 const carton=packaging.filter(p=>p.unitCode==='CARTON'&&p.effectiveFrom<=effectiveFrom).sort((a,b)=>Number(a.revision)-Number(b.revision)).at(-1);
 if(!carton||!/^\d+(\.0+)?$/.test(String(carton.unitsPerPack)))return '';
 const quantity=BigInt(cartons)*BigInt(String(carton.unitsPerPack).split('.')[0]);
 return quantity>0n&&quantity<100000000000n?quantity.toString()+'.000000000':'';
}
export function orderPackaging(product,today){
 const base=product?.containerType==='CAN'?'CAN':'BOTTLE';
 return(product?.packaging||[]).filter(p=>[base,'PACK','CARTON','PALLET'].includes(p.unitCode)&&(!p.effectiveFrom||p.effectiveFrom<=today));
}
export function convertedProductQuantity(quantity,factor){
 if(!/^\d+(\.\d{1,6})?$/.test(quantity||'')||!/^\d+(\.\d{1,9})?$/.test(factor||''))return '';
 const scaled=(value,scale)=>{const[w,f='']=value.split('.');return BigInt(w)*10n**BigInt(scale)+BigInt(f.padEnd(scale,'0'));};
 const raw=scaled(quantity,6)*scaled(factor,9);
 if(raw<=0n||raw%1000000000n)return '';
 const units=raw/1000000000n;
 if(units%1000000n||units>=10n**20n)return '';
 return(units/1000000n).toString();
}
