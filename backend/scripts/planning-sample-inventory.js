const repo=require('../src/shared/business-repository'),{randomUUID}=require('node:crypto');
function evidencePdf(items){
 const content='BT /F1 10 Tf 40 780 Td (PROJECT SAMPLE INVENTORY - NOT REAL PRODUCTION DATA) Tj '+items.map(x=>'0 -24 Td ('+x.code+' : '+x.initialQuantity+' '+x.unit+') Tj').join(' ')+' ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>','<< /Length '+Buffer.byteLength(content)+' >>\nstream\n'+content+'\nendstream','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 let pdf='%PDF-1.4\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}const xref=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return Buffer.from(pdf).toString('base64');
}
async function initializeInventory(c,actors,warehouse,location,lots,profile){
 // Outer seed transaction owns the real SQL connection. Each service call still checks the actor's live grants.
 const context={read:fn=>fn(c),write:async(req,operation,fn)=>{
  const actor=await repo.lockActor(c,req.principal.accountId);
  if(!actor||actor.status!=='ACTIVE'||actor.role_status!=='ACTIVE'||String(actor.role_id)!==String(req.principal.roleId))throw new Error('SEED_ACTOR_NOT_ACTIVE');
  const permissions=await repo.rolePermissions(c,actor.role_id);
  req.principal.permissions=permissions;
  const required=operation==='stocktakes.submitCount'?'stocktakes.count':operation==='stocktakes.cutoff'?'stocktakes.create':operation==='evidence.create'?'variances.verify':operation;
  if(!permissions.includes(required))throw new Error('SEED_ACTOR_PERMISSION_REQUIRED');
  return fn(c);
 }};
 const stocktakes=require('../src/modules/stocktake/service').createStocktakeService(context);
 const request=(actor,body={},params={})=>({principal:actor,body,params,correlationId:randomUUID()});
 let record=await stocktakes.create(request(actors.manager,{warehouseId:warehouse.id,mode:'FROZEN_SCOPE',locationIds:[location.id],counterAccountIds:actors.counters.map(a=>a.accountId)}));
 record=await stocktakes.command('cutoff',request(actors.manager,{expectedVersion:record.version},{id:record.id}));
 const evidence=await require('../src/modules/evidence/service').createEvidenceService(context).create(request(actors.manager,{warehouseId:warehouse.id,stocktakeId:record.id,fileName:'ton-khoi-tao-do-an.pdf',mediaType:'application/pdf',contentBase64:evidencePdf(profile.materials)}));
 const lines=profile.materials.map(m=>({locationId:location.id,lotKind:'MATERIAL',lotId:lots[m.code],qualityBucket:'DAT',materialQuantityBase:m.initialQuantity,condition:'Vật tư mẫu phục vụ đồ án, không phải số kiểm đếm hàng thực tế.',evidenceIds:[evidence.id]}));
 for(let i=0;i<2;i++){
  const actor=actors.counters[i],count=await stocktakes.count(request(actor,{expectedVersion:record.version,scopeGeneration:record.scopeGeneration,round:i+1,emptyLocationIds:[],lines},{id:record.id}));
  record=await stocktakes.submitCount(request(actor,{expectedVersion:count.version},{id:record.id,countId:count.id}));
 }
 record=await stocktakes.command('confirm',request(actors.counters[1],{expectedVersion:record.version},{id:record.id}));
 for(const variance of record.variances){
  const verified=await stocktakes.verify(request(actors.manager,{expectedVersion:variance.version,acceptedCountRound:2,reason:'Khởi tạo số liệu vật tư mẫu cho đồ án theo yêu cầu người dùng.',evidenceIds:[evidence.id],proposeAdjustment:true},{id:variance.id}));
  await stocktakes.decide(request(actors.board,{expectedVersion:0,scopeGeneration:record.scopeGeneration,decision:'APPROVE',reason:'Phê duyệt tồn mẫu đồ án, không phải hàng thực tế.'},{id:verified.proposalId}));
 }
 const final=await repo.one(c,'BienBanKiemKe',{id:record.id});if(final.status!=='HOAN_THANH')throw new Error('INITIAL_STOCKTAKE_NOT_COMPLETED');
 return{stocktakeId:record.id,evidenceId:evidence.id,adjustments:record.variances.length};
}
module.exports={initializeInventory};
