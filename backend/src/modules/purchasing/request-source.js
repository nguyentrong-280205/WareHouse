const repo=require('../production/repository'),d=require('../../shared/decimal');
// Procurement sees material requirements only, without workshop assignments.
async function requestSource(c,plan,principal){
 const free=new Map(),shortages=new Map(),demands=[];
 for(const line of await repo.find(c,'ChiTietKeHoachSanXuat',{plan_id:plan.id})){
  for(const n of await repo.find(c,'NhuCauNguyenLieuKHSX',{plan_line_id:line.id})){
   const usage=await repo.demandUsage(c,n.id),gross=d.parse(n.qty_required)-d.parse(usage.issued)-d.parse(usage.held),remaining=gross>0n?gross:0n;
   if(!free.has(n.material_id))free.set(n.material_id,d.parse((await require('../production/forecast-repository').planningAvailability(c,n.material_id,principal,plan.id)).availableBase));
   const available=free.get(n.material_id),assigned=remaining<available?remaining:available,missing=remaining-assigned;free.set(n.material_id,available-assigned);
   const material=await repo.one(c,'NguyenLieu',{id:n.material_id}),unit=await repo.one(c,'DonViTinh',{id:n.unit_id});
   const open=d.parse(await require('./repository').openApproved(c,n.id))+d.parse(await repo.pendingPurchase(c,n.id));
   const demand={id:String(n.id),materialId:String(n.material_id),materialCode:material.code,materialName:material.name,unitId:String(n.unit_id),unitName:unit.name,shortageBase:d.format(missing),openPurchaseBase:d.format(open),purchaseRequiredBase:d.format(missing>open?missing-open:0n)};
   if(missing>0n)demands.push(demand);
   if(missing>0n){const old=shortages.get(demand.materialId);if(old)old.shortageBase=d.format(d.parse(old.shortageBase)+missing);else shortages.set(demand.materialId,{materialId:demand.materialId,materialName:material.name,unitId:demand.unitId,unitName:unit.name,shortageBase:d.format(missing)});}
  }
 }
 return{id:String(plan.id),code:plan.code,requestType:'MATERIAL_SHORTAGE',materialShortages:[...shortages.values()],lines:[{materialDemands:demands}],observedAt:new Date().toISOString()};
}
module.exports={requestSource};
