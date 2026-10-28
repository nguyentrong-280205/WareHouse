const{randomUUID}=require('node:crypto');
const repo=require('./repository'),life=require('./lifecycle'),stock=require('../inventory/stock-service'),d=require('../../shared/decimal'),policy=require('../../shared/business-policy');
const{fail,requireRow,expectState,expectVersion,scope,now}=require('../../shared/business-context');
const key=r=>[String(r.location_id),r.material_lot_id?'M':r.product_lot_id?'P':'U',String(r.material_lot_id||r.product_lot_id||r.reported_lot_code),r.quality_bucket].join(':');
const sqlTime=ms=>new Date(ms).toISOString().slice(0,23).replace('T',' ');
const{rowDto,timestamp}=require('../../shared/dto');
function createStocktakeService(context){
 async function result(c,row,req){
  scope(req.principal,row.warehouse_id);const locations=await repo.find(c,'PhamViKiemKe',{stocktake_id:row.id}),counts=await repo.find(c,'LanDemKiemKe',{stocktake_id:row.id}),variances=await repo.find(c,'ChiTietKiemKe',{stocktake_id:row.id}),verifications=[],countDtos=[];
  for(const count of counts)countDtos.push({...rowDto(count),lines:(await repo.find(c,'ChiTietLanDem',{count_id:count.id})).map(rowDto)});
  for(const v of variances)for(const verification of await repo.find(c,'XuLyChenhLech',{stocktake_line_id:v.id}))verifications.push(rowDto(verification));
  const locks=await repo.find(c,'KhoaViTriKiemKe',{stocktake_id:row.id});
  return{id:String(row.id),code:row.code,warehouseId:String(row.warehouse_id),mode:row.mode,status:row.status,version:row.version,scopeGeneration:row.scope_generation,cutoffAt:timestamp(row.cutoff_at),lockExpiresAt:locks.length?timestamp(locks.map(l=>l.expires_at).sort()[0]):undefined,locationIds:locations.map(l=>String(l.location_id)),countRoundIds:counts.map(l=>String(l.id)),locations:locations.map(rowDto),members:(await repo.find(c,'ThanhVienKiemKe',{stocktake_id:row.id})).map(r=>String(r.account_id)),snapshots:(await repo.find(c,'SnapshotKiemKe',{stocktake_id:row.id})).map(rowDto),counts:countDtos,variances:variances.map(rowDto),verifications,adjustments:(await repo.find(c,'DeNghiDieuChinhTon',{stocktake_id:row.id})).map(rowDto)};
 }
 async function list(req){return context.read(async c=>{const page=req.query.page||1,pageSize=req.query.pageSize||20,{rows,total}=await repo.list(c,req.principal,{...req.query,page,pageSize});return{data:await Promise.all(rows.map(r=>result(c,r,req))),meta:{page,pageSize,total}};});}
 async function read(req){return context.read(async c=>result(c,requireRow(await repo.one(c,'BienBanKiemKe',{id:req.params.id})),req));}
 async function create(req){return context.write(req,'stocktakes.create',async c=>{
  const b=req.body,warehouse=await stock.gate(c,req,b.warehouseId);if(b.mode!==policy.stocktakeMode)fail(422,'MODE_INVALID','Chỉ FROZEN_SCOPE đã được duyệt.');
  if(new Set(b.locationIds).size!==b.locationIds.length||new Set(b.counterAccountIds).size!==b.counterAccountIds.length)fail(422,'DUPLICATE_SCOPE','Vị trí hoặc thành viên bị lặp.');
  const id=await repo.insert(c,'BienBanKiemKe',{code:'KK-'+randomUUID(),warehouse_id:warehouse.id,mode:b.mode,planned_cutoff:b.plannedCutoff?sqlTime(Date.parse(b.plannedCutoff)):undefined,created_by_id:req.principal.accountId});
  for(const locationId of [...b.locationIds].sort((a,b)=>BigInt(a)<BigInt(b)?-1:1)){await stock.location(c,warehouse,locationId);await repo.insert(c,'PhamViKiemKe',{stocktake_id:id,location_id:locationId});}
  for(const accountId of b.counterAccountIds){await repo.insert(c,'ThanhVienKiemKe',{stocktake_id:id,account_id:accountId});if(!await repo.countScope(c,id,accountId))fail(422,'COUNTER_NOT_ELIGIBLE','Thành viên phải đang hoạt động, có quyền đếm và phạm vi kho.');}
  const row=await repo.one(c,'BienBanKiemKe',{id});await repo.audit(c,req.principal,'stocktakes.create','BienBanKiemKe',id,null,row,req.correlationId);return result(c,row,req);
 },201);}
 async function locked(c,req,id){const initial=requireRow(await repo.one(c,'BienBanKiemKe',{id})),warehouse=await stock.gate(c,req,initial.warehouse_id),row=requireRow(await repo.one(c,'BienBanKiemKe',{id},{lock:true}));return{row,warehouse};}
 async function command(action,req){return context.write(req,'stocktakes.'+action,async c=>{
  const{row,warehouse}=await locked(c,req,req.params.id);expectVersion(row,req.body.expectedVersion);
  if(action==='cancel'){expectState(row,['NHAP','DANG_DEM','CHO_XAC_NHAN','DA_XAC_NHAN']);if(!req.body.reason?.trim())fail(422,'REASON_REQUIRED','Hủy cần lý do.');await life.terminate(c,req,row,'HUY');return result(c,await repo.one(c,'BienBanKiemKe',{id:row.id}),req);}
  if(action==='cutoff'){
   expectState(row,['NHAP']);if(row.planned_cutoff&&Date.parse(String(row.planned_cutoff).replace(' ','T')+'Z')>Date.now())fail(409,'CUTOFF_NOT_DUE','Chưa đến thời điểm chốt đã lập.');
   const members=await repo.find(c,'ThanhVienKiemKe',{stocktake_id:row.id});for(const member of members)if(!await repo.countScope(c,row.id,member.account_id))fail(409,'COUNTER_NOT_ELIGIBLE','Cần rà soát lại thành viên trước chốt.');
   await stock.expire(c,req,warehouse.id);const locations=await repo.find(c,'PhamViKiemKe',{stocktake_id:row.id}),generation=row.scope_generation+1,start=Date.now(),expires=sqlTime(start+policy.stocktakeLeaseMinutes*60000),hard=sqlTime(start+policy.stocktakeMaxMinutes*60000);
   for(const s of locations.sort((a,b)=>BigInt(a.location_id)<BigInt(b.location_id)?-1:1)){await stock.location(c,warehouse,s.location_id);await repo.insert(c,'KhoaViTriKiemKe',{stocktake_id:row.id,location_id:s.location_id,scope_generation:generation,expires_at:expires,hard_expires_at:hard});}
   for(const balance of await repo.balances(c,warehouse.id,locations.map(l=>l.location_id)))await repo.insert(c,'SnapshotKiemKe',{stocktake_id:row.id,scope_generation:generation,balance_id:balance.id,location_id:balance.location_id,material_lot_id:balance.material_lot_id,product_lot_id:balance.product_lot_id,quality_bucket:balance.quality_bucket,qty_system:balance.qty_on_hand,qty_reserved:balance.qty_reserved});
   await repo.update(c,'BienBanKiemKe',{id:row.id},{status:'DANG_DEM',scope_generation:generation,cutoff_at:sqlTime(start),hard_expires_at:hard,version:row.version+1});
  }else if(action==='renewLocks'){
   expectState(row,['DANG_DEM','CHO_XAC_NHAN','DA_XAC_NHAN']);const locks=await life.active(c,row),requested=Date.parse(req.body.requestedExpiresAt);
   if(!Number.isFinite(requested)||!req.body.reason?.trim()||locks.some(l=>requested<=Date.parse(String(l.expires_at).replace(' ','T')+'Z')||requested>Date.parse(String(l.expires_at).replace(' ','T')+'Z')+policy.stocktakeRenewMinutes*60000||requested>Date.parse(String(l.hard_expires_at).replace(' ','T')+'Z')))fail(422,'LEASE_RENEW_LIMIT','Gia hạn tối đa 60 phút mỗi lần và không quá 240 phút từ cutoff.');
   await repo.update(c,'KhoaViTriKiemKe',{stocktake_id:row.id},{expires_at:sqlTime(requested)});await repo.update(c,'BienBanKiemKe',{id:row.id},{version:row.version+1});
  }else if(action==='confirm'){
   expectState(row,['CHO_XAC_NHAN']);await life.active(c,row);if(!await repo.countScope(c,row.id,req.principal.accountId))fail(403,'COUNTER_ASSIGNMENT','Phải là thành viên được phân công.');
   const rounds=await repo.find(c,'LanDemKiemKe',{stocktake_id:row.id,scope_generation:row.scope_generation,status:'DA_NOP'}),first=requireRow(rounds.find(r=>r.sequence===1)),latest=[...rounds].sort((a,b)=>b.sequence-a.sequence)[0];
   const snapshots=await repo.find(c,'SnapshotKiemKe',{stocktake_id:row.id,scope_generation:row.scope_generation}),firstLines=await repo.find(c,'ChiTietLanDem',{count_id:first.id}),latestLines=await repo.find(c,'ChiTietLanDem',{count_id:latest.id});
   const sums=rows=>{const m=new Map();for(const r of rows){const k=key(r);m.set(k,(m.get(k)||0n)+d.parse(r.qty_counted));}return m;},initialSums=sums(firstLines),acceptedSums=sums(latestLines),snapshotMap=new Map(snapshots.map(s=>[key(s),s]));
   let differs=false;for(const k of new Set([...initialSums.keys(),...snapshotMap.keys()]))if((initialSums.get(k)||0n)!==d.parse(snapshotMap.get(k)?.qty_system||'0'))differs=true;
   if(differs&&(latest.sequence<2||String(latest.counter_id)===String(first.counter_id)))fail(409,'INDEPENDENT_RECOUNT_REQUIRED','Chênh lệch cần ít nhất một lần đếm lại bởi người khác.');
   for(const k of new Set([...acceptedSums.keys(),...snapshotMap.keys()])){
    const snapshot=snapshotMap.get(k),counted=acceptedSums.get(k)||0n,system=d.parse(snapshot?.qty_system||'0'),sample=snapshot||latestLines.find(l=>key(l)===k),delta=counted-system;
    await repo.insert(c,'ChiTietKiemKe',{stocktake_id:row.id,scope_generation:row.scope_generation,snapshot_id:snapshot?.id,balance_id:snapshot?.balance_id,accepted_count_id:latest.id,location_id:sample.location_id,material_lot_id:sample.material_lot_id,product_lot_id:sample.product_lot_id,quality_bucket:sample.quality_bucket,qty_system:d.format(system),qty_counted:d.format(counted),delta:d.format(delta),status:delta?'CHO_XAC_MINH':'KHONG_DIEU_CHINH'});
   }
   const variances=await repo.find(c,'ChiTietKiemKe',{stocktake_id:row.id,scope_generation:row.scope_generation});const hasVariance=variances.some(v=>d.parse(v.delta,6,20,true)!==0n);
   await repo.update(c,'BienBanKiemKe',{id:row.id},{status:hasVariance?'DA_XAC_NHAN':'HOAN_THANH',version:row.version+1});if(!hasVariance)await repo.unlock(c,row.id);
  }else fail(422,'INVALID_OPERATION','Thao tác không hợp lệ.');
  const after=await repo.one(c,'BienBanKiemKe',{id:row.id});await repo.audit(c,req.principal,'stocktakes.'+action,'BienBanKiemKe',row.id,row,after,req.correlationId);return result(c,after,req);
 });}
 async function count(req){return context.write(req,'stocktakes.count',async c=>{
  const{row}=await locked(c,req,req.params.id),b=req.body;expectVersion(row,b.expectedVersion);expectState(row,['DANG_DEM','CHO_XAC_NHAN']);await life.generation(c,row,b.scopeGeneration);
  if(!await repo.countScope(c,row.id,req.principal.accountId))fail(403,'COUNTER_ASSIGNMENT','Không được phân công đếm phiên này.');
  const existing=await repo.find(c,'LanDemKiemKe',{stocktake_id:row.id,scope_generation:row.scope_generation});if(existing.some(r=>r.status==='NHAP')||b.round!==existing.length+1)fail(409,'COUNT_SEQUENCE','Phải nộp phiên đếm trước và dùng vòng liên tiếp.');if(b.round>1&&String(existing[0].counter_id)===req.principal.accountId)fail(403,'INDEPENDENT_RECOUNT_REQUIRED','Người đếm lại phải khác người đếm đầu tiên.');
  const locations=await repo.find(c,'PhamViKiemKe',{stocktake_id:row.id}),allowed=new Set(locations.map(r=>String(r.location_id))),covered=new Set(b.emptyLocationIds||[]),occupied=new Set(b.lines.map(l=>l.locationId));
  if([...covered].some(id=>occupied.has(id))||[...covered,...occupied].some(id=>!allowed.has(id)))fail(422,'COUNT_SCOPE_INVALID','Vị trí trống và vị trí có dòng phải tách biệt, thuộc phạm vi.');for(const id of occupied)covered.add(id);if(covered.size!==allowed.size)fail(422,'COUNT_INCOMPLETE','Phải đếm hoặc xác nhận trống mọi vị trí.');
  const id=await repo.insert(c,'LanDemKiemKe',{stocktake_id:row.id,scope_generation:row.scope_generation,sequence:b.round,counter_id:req.principal.accountId,empty_location_ids:JSON.stringify(b.emptyLocationIds||[])});
  for(const l of b.lines){let materialLot=null,productLot=null,qty=0n,factors={};
   if(!['DAT','QUARANTINE','FAILED','EXPIRED','UNKNOWN'].includes(l.qualityBucket))fail(422,'QUALITY_BUCKET_INVALID','Trạng thái chất lượng không hợp lệ.');
   if(l.lotKind!=='UNKNOWN'&&l.qualityBucket==='UNKNOWN')fail(422,'KNOWN_LOT_BUCKET','Lô có định danh không dùng bucket UNKNOWN.');
   if(l.lotKind!=='PRODUCT'&&['pallets','cartons','packs','looseUnits','packagingVersionId'].some(k=>l[k]!==undefined))fail(422,'COUNT_INPUT_KIND','Nguyên liệu/hàng chưa định danh không nhận các trường đếm bao gói thành phẩm.');
   if(l.lotKind==='PRODUCT'&&l.materialQuantityBase!==undefined)fail(422,'COUNT_INPUT_KIND','Thành phẩm không nhận lượng nguyên liệu.');
   if(l.lotKind==='MATERIAL'){materialLot=requireRow(await repo.one(c,'LoNguyenLieu',{id:l.lotId}));const item=requireRow(await repo.one(c,'NguyenLieu',{id:materialLot.material_id})),unit=requireRow(await repo.one(c,'DonViTinh',{id:item.base_unit_id}));qty=d.parse(l.materialQuantityBase);if(unit.discrete&&qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Đơn vị đếm phải nguyên.');}
   else if(l.lotKind==='PRODUCT'){
    productLot=requireRow(await repo.one(c,'LoThanhPham',{id:l.lotId}));const anchor=requireRow(await repo.one(c,'QuyCachDongGoi',{id:l.packagingVersionId,product_id:productLot.product_id}));
    for(const[field,code]of [['pallets','PALLET'],['cartons','CARTON'],['packs','PACK']]){const n=d.parse(l[field]||'0');if(n%d.ten(6))fail(422,'DISCRETE_QUANTITY','Đơn vị đóng gói phải nguyên.');if(!n)continue;const unit=requireRow(await repo.one(c,'DonViTinh',{code})),pack=requireRow(await repo.one(c,'QuyCachDongGoi',{product_id:productLot.product_id,unit_id:unit.id,revision:anchor.revision}));factors[field]={id:String(pack.id),factor:pack.units_per_pack};qty+=d.parse(d.convert(d.format(n),pack.units_per_pack,true));}
    const loose=d.parse(l.looseUnits||'0');if(loose%d.ten(6))fail(422,'DISCRETE_QUANTITY','Chai/lon lẻ phải nguyên.');qty+=loose;
   }else if(l.lotKind==='UNKNOWN'){if(l.lotId||!l.reportedLotCode?.trim()||l.qualityBucket!=='UNKNOWN')fail(422,'UNKNOWN_LOT_INVALID','Hàng chưa định danh chỉ ghi mã báo cáo và bucket UNKNOWN.');qty=d.parse(l.materialQuantityBase);}
   else fail(422,'LOT_KIND_INVALID','Loại lô không hợp lệ.');
   d.parse(d.format(qty));if(!l.condition.trim())fail(422,'CONDITION_REQUIRED','Phải ghi nhận tình trạng.');
   for(const evidenceId of l.evidenceIds||[])requireRow(await repo.one(c,'BangChung',{id:evidenceId,stocktake_id:row.id,warehouse_id:row.warehouse_id}));
   await repo.insert(c,'ChiTietLanDem',{count_id:id,location_id:l.locationId,material_lot_id:materialLot?.id,product_lot_id:productLot?.id,reported_lot_code:l.reportedLotCode,quality_bucket:l.qualityBucket,qty_counted:d.format(qty),condition_note:l.condition,breakdown:JSON.stringify(l),factors_snapshot:JSON.stringify(factors),evidence_ids:JSON.stringify(l.evidenceIds||[])});
  }
  await repo.update(c,'BienBanKiemKe',{id:row.id},{status:'DANG_DEM',version:row.version+1});await repo.audit(c,req.principal,'stocktakes.count','LanDemKiemKe',id,null,{round:b.round,scopeGeneration:row.scope_generation},req.correlationId);return{id,version:0,status:'NHAP',round:b.round,stocktakeVersion:row.version+1};
 },201);}
 async function submitCount(req){return context.write(req,'stocktakes.submitCount',async c=>{
  const{row}=await locked(c,req,req.params.id);expectState(row,['DANG_DEM']);await life.active(c,row);const count=requireRow(await repo.one(c,'LanDemKiemKe',{id:req.params.countId,stocktake_id:row.id,scope_generation:row.scope_generation},{lock:true}));expectVersion(count,req.body.expectedVersion);expectState(count,['NHAP']);if(String(count.counter_id)!==req.principal.accountId||!await repo.countScope(c,row.id,req.principal.accountId))fail(403,'COUNT_OWNER','Chỉ người đếm được phân công nộp phiên của mình.');
  await repo.update(c,'LanDemKiemKe',{id:count.id},{status:'DA_NOP',version:count.version+1,submitted_at:now()});await repo.update(c,'BienBanKiemKe',{id:row.id},{status:'CHO_XAC_NHAN',version:row.version+1});await repo.audit(c,req.principal,'stocktakes.submitCount','LanDemKiemKe',count.id,count,{status:'DA_NOP'},req.correlationId);return result(c,await repo.one(c,'BienBanKiemKe',{id:row.id}),req);
 });}
 async function finish(c,row){const lines=await repo.find(c,'ChiTietKiemKe',{stocktake_id:row.id,scope_generation:row.scope_generation});if(lines.every(l=>['DA_DIEU_CHINH','KHONG_DIEU_CHINH'].includes(l.status))){await repo.update(c,'BienBanKiemKe',{id:row.id},{status:'HOAN_THANH',version:row.version+1});await repo.unlock(c,row.id);}}
 async function verify(req){return context.write(req,'variances.verify',async c=>{
  const initial=requireRow(await repo.one(c,'ChiTietKiemKe',{id:req.params.id})),{row}=await locked(c,req,initial.stocktake_id),line=requireRow(await repo.one(c,'ChiTietKiemKe',{id:initial.id},{lock:true})),b=req.body;expectState(row,['DA_XAC_NHAN']);await life.generation(c,row,line.scope_generation);expectVersion(line,b.expectedVersion);expectState(line,['CHO_XAC_MINH']);if(!b.reason.trim())fail(422,'REASON_REQUIRED','Cần lý do xác minh.');
  const count=requireRow(await repo.one(c,'LanDemKiemKe',{id:line.accepted_count_id}));if(count.sequence!==b.acceptedCountRound)fail(409,'ACCEPTED_ROUND_MISMATCH','Chỉ dùng vòng đếm đã được hội đồng xác nhận.');
  for(const id of b.evidenceIds)requireRow(await repo.one(c,'BangChung',{id,stocktake_id:row.id,warehouse_id:row.warehouse_id}));
  if(b.proposeAdjustment&&line.quality_bucket==='UNKNOWN')fail(422,'UNKNOWN_NOT_ADJUSTABLE','Không tạo tồn đã định danh từ hàng chưa xác minh.');
  const verificationId=await repo.insert(c,'XuLyChenhLech',{stocktake_line_id:line.id,verifier_id:req.principal.accountId,reason:b.reason,accepted_count_round:b.acceptedCountRound,evidence_ids:JSON.stringify(b.evidenceIds)});
  let proposalId;if(b.proposeAdjustment)proposalId=await repo.insert(c,'DeNghiDieuChinhTon',{stocktake_line_id:line.id,verification_id:verificationId,stocktake_id:row.id,scope_generation:row.scope_generation,qty_signed:line.delta,proposer_id:req.principal.accountId});
  await repo.update(c,'ChiTietKiemKe',{id:line.id},{status:proposalId?'CHO_DUYET':'KHONG_DIEU_CHINH',version:line.version+1});await finish(c,row);await repo.audit(c,req.principal,'variances.verify','ChiTietKiemKe',line.id,line,{verificationId,proposalId,reason:b.reason},req.correlationId);return{id:String(line.id),verificationId,proposalId,status:proposalId?'CHO_DUYET':'KHONG_DIEU_CHINH',version:line.version+1};
 });}
 async function decide(req){return context.write(req,'adjustments.decide',async c=>{
  const initial=requireRow(await repo.one(c,'DeNghiDieuChinhTon',{id:req.params.id})),{row,warehouse}=await locked(c,req,initial.stocktake_id),proposal=requireRow(await repo.one(c,'DeNghiDieuChinhTon',{id:initial.id},{lock:true})),b=req.body;expectState(row,['DA_XAC_NHAN']);await life.generation(c,row,b.scopeGeneration);if(proposal.scope_generation!==row.scope_generation)fail(409,'STALE_SCOPE','Đề nghị thuộc phạm vi cũ.');expectVersion(proposal,b.expectedVersion);expectState(proposal,['CHO_DUYET']);if(String(proposal.proposer_id)===req.principal.accountId)fail(403,'MAKER_CHECKER','Người đề nghị không được tự phê duyệt.');
  const line=requireRow(await repo.one(c,'ChiTietKiemKe',{id:proposal.stocktake_line_id},{lock:true})),approve=b.decision==='APPROVE';if(!approve&&!b.reason?.trim())fail(422,'REASON_REQUIRED','Từ chối cần lý do.');
  if(approve){
   const loc=requireRow(await repo.one(c,'ViTriLuuKho',{id:line.location_id,warehouse_id:warehouse.id},{lock:true})),kind=line.material_lot_id?'MATERIAL':'PRODUCT',lot=requireRow(await repo.one(c,kind==='MATERIAL'?'LoNguyenLieu':'LoThanhPham',{id:line.material_lot_id||line.product_lot_id})),balance=line.balance_id?requireRow(await repo.one(c,'TonKho',{id:line.balance_id},{lock:true})):await stock.balance(c,warehouse,loc,kind,lot,line.quality_bucket);
   if(d.parse(balance.qty_on_hand)!==d.parse(line.qty_system))fail(409,'SNAPSHOT_STALE','Tồn đã thay đổi so với snapshot.');
   if(d.parse(line.qty_counted)<d.parse(balance.qty_reserved))fail(409,'RESERVED_EXCEEDS_COUNT','Quản lý kho cần giải phóng reservation chưa xuất trước khi phê duyệt lại.');
   const postingId=await repo.insert(c,'StockPosting',{adjustment_id:proposal.id,created_by_id:req.principal.accountId});await stock.move(c,{postingId,balance,delta:d.parse(proposal.qty_signed,6,20,true),reason:'Điều chỉnh kiểm kê đã được phê duyệt: '+(b.reason||'Theo hồ sơ xác minh')});await stock.capacity(c,warehouse,[String(loc.id)]);
  }
  await repo.update(c,'DeNghiDieuChinhTon',{id:proposal.id},{status:approve?'DA_DUYET':'TU_CHOI',approver_id:req.principal.accountId,decided_at:now(),reason:b.reason,version:proposal.version+1});await repo.update(c,'ChiTietKiemKe',{id:line.id},{status:approve?'DA_DIEU_CHINH':'KHONG_DIEU_CHINH',version:line.version+1});await finish(c,row);
  await repo.audit(c,req.principal,'adjustments.decide','DeNghiDieuChinhTon',proposal.id,proposal,{decision:b.decision,reason:b.reason},req.correlationId);return{id:String(proposal.id),version:proposal.version+1,status:approve?'DA_DUYET':'TU_CHOI'};
 });}
 return{list,read,create,command,count,submitCount,verify,decide};
}
module.exports={createStocktakeService};
