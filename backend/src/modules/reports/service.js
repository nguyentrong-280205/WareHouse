const repo=require('./repository'),d=require('../../shared/decimal');
const{fail,requireRow,scope,businessDate}=require('../../shared/business-context');
const rowKey=r=>[String(r.warehouse_id),r.material_lot_id?'MATERIAL':'PRODUCT',String(r.item_id)].join(':');
const ruleKey=r=>[String(r.warehouse_id),r.material_id?'MATERIAL':'PRODUCT',String(r.material_id||r.product_id)].join(':');
const dateDays=(a,b)=>Math.floor((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000);
const camel=require('../../shared/dto').rowDto;
function createReportService(context){
 function dates(req){if(req.query.from&&req.query.to&&req.query.from>req.query.to)fail(422,'DATE_RANGE_INVALID','Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');}
 async function page(rows,req,c){const page=req.query.page||1,pageSize=req.query.pageSize||20;return{data:await require('../../shared/reference-names').describeRows(c,rows.slice((page-1)*pageSize,page*pageSize)),meta:{page,pageSize,total:rows.length}};}
 async function ledger(req){dates(req);return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.ledger(c,req.principal,{...req.query,page,pageSize});return{data:await require('../../shared/reference-names').describeRows(c,rows.map(camel)),meta:{page,pageSize,total}};});}
 async function inventory(req){dates(req);if(!!req.query.from!==!!req.query.to)fail(422,'REPORT_PERIOD_REQUIRED','Báo cáo tồn theo kỳ cần đủ ngày bắt đầu và kết thúc.');return context.read(async c=>{
  if(req.query.from)return page((await repo.inventoryPeriod(c,req.principal,req.query)).map(r=>({...camel(r),itemKind:r.lot_kind==='M'?'MATERIAL':'PRODUCT',from:req.query.from,to:req.query.to})),req,c);
  const rows=await repo.balances(c,req.principal,req.query.warehouseId),groups=new Map();
  for(const r of rows){if(req.query.itemId&&String(r.item_id)!==req.query.itemId||req.query.lotId&&String(r.material_lot_id||r.product_lot_id)!==req.query.lotId||req.query.status&&r.quality_bucket!==req.query.status)continue;const k=rowKey(r)+':'+r.quality_bucket;if(!groups.has(k))groups.set(k,{warehouseId:String(r.warehouse_id),itemKind:r.material_lot_id?'MATERIAL':'PRODUCT',itemId:String(r.item_id),unitId:String(r.unit_id),qualityBucket:r.quality_bucket,onHand:0n,reserved:0n,available:0n});const g=groups.get(k),qty=d.parse(r.qty_on_hand),reserved=d.parse(r.active_reserved);g.onHand+=qty;g.reserved+=reserved;if(r.eligible&&r.quality_bucket==='DAT'&&(!r.expires_on||r.expires_on>=businessDate()))g.available+=qty-reserved;}
  return page([...groups.values()].map(g=>({...g,onHand:d.format(g.onHand),reserved:d.format(g.reserved),available:d.format(g.available)})),req,c);
 });}
 async function expiry(req){dates(req);return context.read(async c=>page((await repo.balances(c,req.principal,req.query.warehouseId)).filter(r=>r.expires_on&&(!req.query.from||r.expires_on>=req.query.from)&&(!req.query.to||r.expires_on<=req.query.to)&&(!req.query.itemId||String(r.item_id)===req.query.itemId)).map(r=>({...camel(r),daysRemaining:dateDays(r.expires_on,businessDate()),expired:r.expires_on<businessDate()})),req,c));}
 async function alertRules(req){return context.read(async c=>({data:(await repo.rules(c,req.principal.accountId,req.query.warehouseId)).map(camel)}));}
 async function configureAlert(req){return context.write(req,'reports.configureAlert',async c=>{
  const b=req.body;scope(req.principal,b.warehouseId);requireRow(await repo.one(c,'Kho',{id:b.warehouseId},{lock:true}));const material=b.itemKind==='MATERIAL';requireRow(await repo.one(c,material?'NguyenLieu':'ThanhPham',{id:b.itemId}));
  const criteria={warehouse_id:b.warehouseId,material_id:material?b.itemId:null,product_id:material?null:b.itemId},prior=(await repo.find(c,'CauHinhNghiepVu',criteria,{lock:true,order:'revision'})).at(-1),version=prior?.revision||0;
  if(version!==b.expectedVersion)fail(409,'STALE_CONFIGURATION','Cấu hình đã thay đổi.');d.parse(b.lowStockBase);
  const id=await repo.insert(c,'CauHinhNghiepVu',{...criteria,revision:version+1,low_stock_base:b.lowStockBase,near_expiry_days:b.nearExpiryDays,slow_moving_days:b.slowMovingDays,created_by_id:req.principal.accountId});const after=await repo.one(c,'CauHinhNghiepVu',{id});await repo.audit(c,req.principal,'reports.configureAlert','CauHinhNghiepVu',id,prior,after,req.correlationId);return camel(after);
 },201);}
 async function alerts(req){return context.read(async c=>{
  const rules=await repo.rules(c,req.principal.accountId,req.query.warehouseId),balances=await repo.balances(c,req.principal,req.query.warehouseId),today=businessDate(),alerts=[],configured=new Set(rules.map(ruleKey));
  for(const rule of rules){const ls=balances.filter(r=>rowKey(r)===ruleKey(rule)),available=ls.filter(r=>r.eligible&&r.quality_bucket==='DAT'&&(!r.expires_on||r.expires_on>=today)).reduce((n,r)=>n+d.parse(r.qty_on_hand)-d.parse(r.active_reserved),0n),base={warehouseId:String(rule.warehouse_id),itemKind:rule.material_id?'MATERIAL':'PRODUCT',itemId:String(rule.material_id||rule.product_id),configurationRevision:rule.revision};
   if(available<d.parse(rule.low_stock_base))alerts.push({...base,type:'LOW_STOCK',availableBase:d.format(available),thresholdBase:rule.low_stock_base});
   for(const r of ls){if(d.parse(r.qty_on_hand)===0n)continue;const days=r.expires_on?dateDays(r.expires_on,today):null;
    if(days!==null&&days<=rule.near_expiry_days)alerts.push({...base,type:days<0?'EXPIRED':'NEAR_EXPIRY',balanceId:String(r.id),lotId:String(r.material_lot_id||r.product_lot_id),expiresOn:r.expires_on,daysRemaining:days,quantityBase:r.qty_on_hand});
    if(r.last_movement_at){const lastVN=new Date(Date.parse(String(r.last_movement_at).replace(' ','T')+'Z')+7*3600000).toISOString().slice(0,10),idle=dateDays(today,lastVN);if(idle>=rule.slow_moving_days)alerts.push({...base,type:'SLOW_MOVING',balanceId:String(r.id),idleDays:idle,thresholdDays:rule.slow_moving_days,quantityBase:r.qty_on_hand});}
   }
  }
  const missing=[...new Map(balances.filter(r=>!configured.has(rowKey(r))).map(r=>[rowKey(r),{warehouseId:String(r.warehouse_id),itemKind:r.material_lot_id?'MATERIAL':'PRODUCT',itemId:String(r.item_id)}])).values()];return{...await page(alerts,req,c),configurationRequired:missing};
 });}
 async function variances(req){dates(req);return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.variances(c,req.principal,{...req.query,page,pageSize});return{data:await require('../../shared/reference-names').describeRows(c,rows.map(r=>({...camel(r),varianceRatio:d.parse(r.qty_system)===0n?null:{numerator:r.delta,denominator:r.qty_system}}))),meta:{page,pageSize,total}};});}
 return{ledger,inventory,expiry,alertRules,configureAlert,alerts,variances};
}
module.exports={createReportService};
