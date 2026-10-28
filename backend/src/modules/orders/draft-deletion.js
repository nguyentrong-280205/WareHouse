const repo=require('../../shared/business-repository');
const {fail,requireRow,expectVersion,expectState}=require('../../shared/business-context');
const definitions={
 orders:{path:'/orders',table:'DonHang',line:'ChiTietDonHang',fk:'order_id',permission:'orders.create',scope:'customer'},
 purchases:{path:'/purchases',table:'DonMuaNguyenLieu',line:'ChiTietDonMuaNguyenLieu',fk:'purchase_id',permission:'purchases.create',scope:'plan',allocation:{line:'PhanBoMuaChoNhuCau',fk:'purchase_line_id'}},
 materialRequests:{path:'/material-requests',table:'PhieuXuatKhoNguyenLieu',line:'ChiTietYeuCauXuatNL',fk:'request_id',permission:'materialRequests.create',scope:'workshop'},
 productRequests:{path:'/product-requests',table:'PhieuNhapKhoThanhPham',line:'ChiTietYeuCauNhapTP',fk:'request_id',permission:'productRequests.create',scope:'workshop'},
};
async function referenced(c,table,id,ownedChild){
 const[refs]=await c.execute('SELECT OBJECT_NAME(f.parent_object_id) AS table_name,COL_NAME(f.parent_object_id,f.parent_column_id) AS column_name FROM sys.foreign_key_columns f WHERE OBJECT_NAME(f.referenced_object_id)=? AND COL_NAME(f.referenced_object_id,f.referenced_column_id)=?',[table,'id']);
 for(const ref of refs){
  if(ownedChild&&ref.table_name===ownedChild.line&&ref.column_name===ownedChild.fk)continue;
  if(!/^[A-Za-z_]+$/.test(ref.table_name)||!/^[a-z_]+$/.test(ref.column_name))throw new Error('INVALID_METADATA_IDENTIFIER');
  const[rows]=await c.execute('SELECT TOP (1) id FROM dbo.['+ref.table_name+'] WITH(HOLDLOCK) WHERE ['+ref.column_name+']=?',[id]);
  if(rows.length)fail(409,'DOCUMENT_HAS_HISTORY','Chứng từ đã có dữ liệu phụ thuộc; không được xóa. Hãy dùng quy trình hủy phù hợp.');
 }
}
async function remove(c,config,row,req){
 if(config.scope==='customer'&&(!req.principal.customerId||String(row.customer_id)!==req.principal.customerId))fail(404,'NOT_FOUND','Không tìm thấy đơn hàng.');
 if(config.scope==='workshop'&&!req.principal.workshopIds.includes(String(row.workshop_id)))fail(404,'NOT_FOUND','Không tìm thấy yêu cầu trong phạm vi xưởng.');
 if(config.scope==='plan'){
  if(req.principal.customerId)fail(403,'FORBIDDEN','Chỉ tài khoản nội bộ có quyền mua hàng được xử lý đơn mua.');
  requireRow(await repo.one(c,'KeHoachSanXuat',{id:row.plan_id}));
 }
 expectVersion(row,req.body.expectedVersion);expectState(row,['NHAP']);
 const lines=await repo.find(c,config.line,{[config.fk]:row.id},{lock:true});
 const allocations=[];
 await referenced(c,config.table,row.id,config);
 for(const line of lines){
  await referenced(c,config.line,line.id,config.allocation);
  if(config.allocation)for(const allocation of await repo.find(c,config.allocation.line,{[config.allocation.fk]:line.id},{lock:true})){
   await referenced(c,config.allocation.line,allocation.id);allocations.push(allocation);
  }
 }
 // No cascade: only owned draft lines and the header. Any FK race rolls back the entire transaction.
 await repo.audit(c,req.principal,'documents.deleteDraft',config.table,row.id,{...row,lines,allocations},{deleted:true},req.correlationId);
 if(config.allocation)for(const line of lines)await c.execute('DELETE FROM '+repoTable(config.allocation.line)+' WHERE ['+config.allocation.fk+']=?',[line.id]);
 await c.execute('DELETE FROM '+repoTable(config.line)+' WHERE ['+config.fk+']=?',[row.id]);
 await c.execute('DELETE FROM '+repoTable(config.table)+' WHERE id=?',[row.id]);
 return{id:String(row.id),deleted:true};
}
function repoTable(name){if(!Object.values(definitions).some(d=>d.table===name||d.line===name||d.allocation?.line===name))throw new Error('INVALID_DELETE_TABLE');return'dbo.['+name+']';}
function createDraftDeletionHandlers(context){
 const handlers={};
 for(const[kind,config]of Object.entries(definitions))handlers[kind+'.deleteDraft']=async(req,res)=>{
  const input=require('../warehouse/controller').requestContext(req,res);
  const result=await context.write(input,kind+'.deleteDraft',async c=>{
   if(!input.principal.permissions.includes(config.permission))fail(403,'FORBIDDEN','Không có quyền xóa bản nháp.');
   const row=requireRow(await repo.one(c,config.table,{id:input.params.id},{lock:true}));
   try{return await remove(c,config,row,input);}catch(error){if(error.number===547)fail(409,'DOCUMENT_HAS_HISTORY','Chứng từ đã có dữ liệu phụ thuộc; không được xóa.');throw error;}
  });
  res.status(result.status).json(result.body);
 };
 return handlers;
}
module.exports={definitions,createDraftDeletionHandlers};
