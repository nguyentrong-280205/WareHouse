const {randomUUID}=require('node:crypto');
const repo=require('./repository');
const d=require('../../shared/decimal');
const policy=require('../../shared/business-policy');
const {fail,requireRow,expectVersion,expectState,businessDate,now}=require('../../shared/business-context');
function createOrderService(context){
  async function customer(c,principal){
    if(!principal.customerId)fail(403,'CUSTOMER_REQUIRED','Chức năng này yêu cầu tài khoản khách hàng.');
    const row=requireRow(await repo.one(c,'KhachHang',{id:principal.customerId}));
    if(row.status!=='ACTIVE')fail(403,'CUSTOMER_LOCKED','Hồ sơ khách hàng đã khóa.');
    return row;
  }
  async function result(c,row){
    const draft=row.status==='NHAP',lines=await repo.displayLines(c,row.id,draft);
    let estimatedTotal=0n,complete=true;
    const display=lines.map(l=>{
      const line={id:String(l.id),productId:String(l.product_id),productCode:l.product_code,productName:l.product_name,unitId:String(l.unit_id),unitName:l.unit_name,packagingVersionId:String(l.packaging_id),quantity:l.qty_input,...(l.unit_price!==null?{unitPrice:l.unit_price,amount:l.amount}:{})};
      if(draft){
        if(l.estimated_unit_price===null||l.estimated_unit_price===undefined){complete=false;line.estimateUnavailableReason='PRICE_NOT_CONFIGURED';}
        else try{line.estimatedUnitPrice=l.estimated_unit_price;line.estimatedAmount=d.money(l.qty_input,l.estimated_unit_price);estimatedTotal+=BigInt(line.estimatedAmount);}
        catch(error){if(error.code!=='DECIMAL_INVALID')throw error;complete=false;line.estimateUnavailableReason='AMOUNT_OUT_OF_RANGE';}
      }
      return line;
    });
    if(draft&&complete)try{d.parse(estimatedTotal.toString(),0);}catch(error){if(error.code!=='DECIMAL_INVALID')throw error;complete=false;}
    return{id:String(row.id),version:row.version,status:row.status,customerId:String(row.customer_id),currency:'VND',dueDate:row.due_date,deliveryAddress:row.delivery_address,recipient:row.recipient,recipientPhone:row.recipient_phone,
      ...(row.total_amount!==null?{totalAmount:row.total_amount}:{}),...(draft?{pricingStatus:complete?'ESTIMATED':'UNAVAILABLE',...(complete?{estimatedTotalAmount:estimatedTotal.toString()}:{})}:{pricingStatus:row.total_amount!==null?'CONFIRMED':'UNAVAILABLE'}),lines:display};
  }
  async function list(req){return context.read(async c=>{await customer(c,req.principal);const page=req.query.page||1,pageSize=req.query.pageSize||20;const{rows,total}=await repo.customerOrders(c,req.principal.customerId,{...req.query,page,pageSize});return{data:await Promise.all(rows.map(r=>result(c,r))),meta:{page,pageSize,total}};});}
  async function read(req){return context.read(async c=>{await customer(c,req.principal);return result(c,requireRow(await repo.one(c,'DonHang',{id:req.params.id,customer_id:req.principal.customerId})));});}
  async function create(req){return context.write(req,'orders.create',async c=>{
    await customer(c,req.principal);const b=req.body;
    if(b.dueDate<businessDate())fail(422,'DUE_DATE_INVALID','Ngày giao không được trước ngày hiện tại.');
    const id=await repo.insert(c,'DonHang',{code:'DH-'+randomUUID(),customer_id:req.principal.customerId,due_date:b.dueDate,delivery_address:b.deliveryAddress,recipient:b.recipient,recipient_phone:b.recipientPhone,created_by_id:req.principal.accountId});
    for(const[index,line]of b.lines.entries()){
      const product=requireRow(await repo.one(c,'ThanhPham',{id:line.productId},{lock:true}));expectState(product,['ACTIVE']);
      const pack=requireRow(await repo.one(c,'QuyCachDongGoi',{id:line.packagingVersionId,product_id:line.productId,unit_id:line.unitId}));
      const unit=requireRow(await repo.one(c,'DonViTinh',{id:line.unitId}));
      require('../../shared/product-packaging').validatePackaging(product,unit.code,d.positive(pack.units_per_pack,9));
      if(pack.effective_from>businessDate())fail(422,'PACKAGING_NOT_EFFECTIVE','Quy cách chưa hiệu lực.');
      const qty=d.convert(line.quantity,pack.units_per_pack,true);
      await repo.insert(c,'ChiTietDonHang',{order_id:id,line_no:index+1,product_id:product.id,unit_id:line.unitId,packaging_id:pack.id,qty_input:line.quantity,factor_snapshot:pack.units_per_pack,qty_base:qty});
    }
    const after=requireRow(await repo.one(c,'DonHang',{id}));await repo.audit(c,req.principal,'orders.create','DonHang',id,null,after,req.correlationId);return result(c,after);
  },201);}
  async function submit(req){return context.write(req,'orders.submit',async c=>{
    await customer(c,req.principal);const row=requireRow(await repo.one(c,'DonHang',{id:req.params.id,customer_id:req.principal.customerId},{lock:true}));expectVersion(row,req.body.expectedVersion);expectState(row,['NHAP']);
    if(row.due_date<businessDate())fail(422,'DUE_DATE_INVALID','Ngày giao của đơn nháp đã qua; cần lập đơn với ngày giao hợp lệ.');
    const lines=await repo.find(c,'ChiTietDonHang',{order_id:row.id},{lock:true});let total=0n;
    for(const line of lines){
      const p=requireRow(await repo.one(c,'ThanhPham',{id:line.product_id},{lock:true}));expectState(p,['ACTIVE']);
      const price=await repo.currentPrice(c,p.id,line.unit_id);if(!price)fail(409,'PRICE_NOT_CONFIGURED','SKU/đơn vị chưa có giá bán hiệu lực.');
      const amount=d.money(line.qty_input,price.unit_price);total+=BigInt(amount);
      await repo.update(c,'ChiTietDonHang',{id:line.id},{price_id:price.id,unit_price:price.unit_price,amount});
    }
    d.parse(total.toString(),0);await repo.update(c,'DonHang',{id:row.id},{status:'XAC_NHAN',total_amount:total.toString(),rounding_revision:policy.revision,version:row.version+1,updated_at:now()});
    const after=await repo.one(c,'DonHang',{id:row.id});await repo.audit(c,req.principal,'orders.submit','DonHang',row.id,row,after,req.correlationId);return result(c,after);
  });}
  return{list,read,create,submit};
}
module.exports={createOrderService};
