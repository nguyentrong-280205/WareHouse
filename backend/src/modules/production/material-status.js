const repo=require('./repository'),d=require('../../shared/decimal');
const forecast=require('./forecast-repository');

// An observed supply status, independent of approval and never a reservation.
async function materialStatus(c,lines,principal,planId='0'){
 const totals=new Map();
 for(const line of lines){
  if(line.materialDemands.length){
   for(const m of line.materialDemands){const previous=totals.get(m.materialId)||{materialId:m.materialId,unitId:m.unitId,required:0n};const rest=d.parse(m.requiredBase)-d.parse(m.issuedBase)-d.parse(m.heldForDemandBase);previous.required+=rest>0n?rest:0n;totals.set(m.materialId,previous);}
  }else for(const m of line.materials){const previous=totals.get(m.materialId)||{materialId:m.materialId,unitId:m.unitId,required:0n};previous.required+=d.parse(m.quantityBase);totals.set(m.materialId,previous);}
 }
 const shortages=[];
 for(const m of totals.values()){
  const available=d.parse((await forecast.planningAvailability(c,m.materialId,principal,planId)).availableBase),shortage=m.required>available?m.required-available:0n;
  if(shortage>0n){const item=await repo.one(c,'NguyenLieu',{id:m.materialId}),unit=await repo.one(c,'DonViTinh',{id:m.unitId});shortages.push({materialId:m.materialId,materialName:item?.name||m.materialId,unitId:m.unitId,unitName:unit?.name||m.unitId,shortageBase:d.format(shortage)});}
 }
 return{materialStatus:shortages.length?'THIEU_NGUYEN_VAT_LIEU':'DU_NGUYEN_VAT_LIEU',materialShortages:shortages,materialObservedAt:new Date().toISOString()};
}
module.exports={materialStatus};
