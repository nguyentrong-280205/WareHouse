const {randomUUID,createHash}=require('node:crypto');
const fs=require('node:fs/promises'),path=require('node:path');
const repo=require('../../shared/business-repository');
const{fail,requireRow,scope}=require('../../shared/business-context');
const signatures={ 'image/png':bytes=>bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])), 'image/jpeg':bytes=>bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255, 'application/pdf':bytes=>bytes.subarray(0,5).toString()==='%PDF-' };
function createEvidenceService(context){
 const directory=path.resolve(__dirname,'../../../uploads/evidence');
 async function create(req){return context.write(req,'evidence.create',async c=>{
  const b=req.body;scope(req.principal,b.warehouseId);if(!!b.stocktakeId===!!b.issueId)fail(422,'EVIDENCE_TARGET_REQUIRED','Chọn đúng một biên bản kiểm kê hoặc phiếu xuất.');
  const target=requireRow(await repo.one(c,b.stocktakeId?'BienBanKiemKe':'PhieuXuatKho',{id:b.stocktakeId||b.issueId,warehouse_id:b.warehouseId}));
  if(b.stocktakeId){const member=await repo.one(c,'ThanhVienKiemKe',{stocktake_id:target.id,account_id:req.principal.accountId});if(!member&&!req.principal.permissions.includes('variances.verify'))fail(403,'EVIDENCE_SCOPE','Chỉ thành viên hoặc người xác minh thêm bằng chứng kiểm kê.');}
  if(!signatures[b.mediaType]||!b.contentBase64||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b.contentBase64))fail(422,'EVIDENCE_FORMAT','Chỉ nhận PNG/JPEG/PDF mã hóa base64 hợp lệ.');
  const bytes=Buffer.from(b.contentBase64,'base64');if(!bytes.length||bytes.length>65536||!signatures[b.mediaType](bytes))fail(422,'EVIDENCE_SIZE_OR_SIGNATURE','Tệp phải có chữ ký đúng và không quá 64 KiB.');
  const storageKey=randomUUID(),checksum=createHash('sha256').update(bytes).digest('hex');await fs.mkdir(directory,{recursive:true});await fs.writeFile(path.join(directory,storageKey),bytes,{flag:'wx',mode:0o600});
  // A rollback can leave an unreferenced file. It is never exposed; do not auto-delete evidence.
  const id=await repo.insert(c,'BangChung',{stocktake_id:b.stocktakeId,issue_id:b.issueId,warehouse_id:b.warehouseId,storage_key:storageKey,checksum,media_type:b.mediaType,byte_size:String(bytes.length),original_name:b.fileName,uploader_id:req.principal.accountId});
  await repo.audit(c,req.principal,'evidence.create','BangChung',id,null,{checksum,mediaType:b.mediaType,byteSize:String(bytes.length),targetId:String(target.id)},req.correlationId);return{id,fileName:b.fileName,checksum,mediaType:b.mediaType,byteSize:String(bytes.length)};
 },201);}
 async function read(req){return context.read(async c=>{const row=requireRow(await repo.one(c,'BangChung',{id:req.params.id}));scope(req.principal,row.warehouse_id);if(!/^[a-f0-9-]{36}$/.test(row.storage_key))fail(409,'EVIDENCE_STORAGE_INVALID','Khóa lưu trữ không hợp lệ.');const bytes=await fs.readFile(path.join(directory,row.storage_key));if(createHash('sha256').update(bytes).digest('hex')!==row.checksum)fail(409,'EVIDENCE_CHECKSUM','Bằng chứng không khớp checksum.');return{bytes,mediaType:row.media_type,fileName:row.original_name};});}
 return{create,read};
}
module.exports={createEvidenceService};
