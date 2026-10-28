const repo=require('./repository');
const base=require('../../shared/business-repository');
const {fail,requireRow}=require('../../shared/business-context');
function clean(row){return Object.fromEntries(Object.entries(row).map(([k,v])=>[k.replace(/_([a-z])/g,(_,x)=>x.toUpperCase()),Array.isArray(v)?v.map(clean):(k==='id'||k.endsWith('_id'))?String(v):v]));}
function createLookupService(context){return{async lookup(kind,req){return context.read(async c=>{
  if(req.principal.customerId){const customer=requireRow(await base.one(c,'KhachHang',{id:req.principal.customerId}));if(customer.status!=='ACTIVE')fail(403,'CUSTOMER_LOCKED','Khách hàng đã khóa.');}
  let rows;
  if(kind==='units')rows=await repo.units(c);
  else if(kind==='workshops')rows=await repo.workshops(c,req.principal.accountId);
  else if(kind==='orders')rows=await repo.orders(c);
  else if(kind==='planLines'&&req.query?.purpose!=='PRODUCT'){
    rows=[];const eligible=new Map();
    for(const line of await repo.planLines(c,req.principal.accountId)){
      if(!eligible.has(String(line.plan_id))){const plan=requireRow(await base.one(c,'KeHoachSanXuat',{id:line.plan_id}));eligible.set(String(line.plan_id),await require('../production/material-release-gate').canRequestMaterials(c,plan,req.principal));}
      if(eligible.get(String(line.plan_id)))rows.push(line);
    }
  }
  else if(kind==='planLines')rows=await repo.planLines(c,req.principal.accountId);
  else rows=await repo.catalog(c,kind);
  if(kind==='planLines')for(const row of rows){
    row.name=[row.plan_code,row.product_code,row.product_name,row.workshop_name].join(' — ');
    row.demands=await base.find(c,'NhuCauNguyenLieuKHSX',{plan_line_id:row.id});
    const decimal=require('../../shared/decimal'),requests=require('../production/request-repository');
    for(const demand of row.demands){
      const material=requireRow(await base.one(c,'NguyenLieu',{id:demand.material_id})),unit=requireRow(await base.one(c,'DonViTinh',{id:demand.unit_id}));
      const requested=await requests.requested(c,'materialRequests',demand.id);
      demand.material_code=material.code;demand.material_name=material.name;demand.unit_name=unit.name;
      demand.requested_base=requested;
      const remaining=decimal.parse(demand.qty_required)-decimal.parse(requested);
      demand.remaining_base=decimal.format(remaining>0n?remaining:0n);
    }
  }
  if(kind==='suppliers')for(const r of rows)r.quotes=await require('../purchasing/supplier-repository').currentQuotes(c,r.id);
  if(kind==='products')for(const r of rows)r.packaging=await require('../warehouse/repository').packaging(c,r.id);
  return{data:rows.map(clean)};
});}};}
module.exports={createLookupService};
