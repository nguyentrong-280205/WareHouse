const repo=require('./repository'),d=require('../../shared/decimal');
const {requireRow,expectState,fail}=require('../../shared/business-context');
async function planningContext(c,req){
 const {startDate,endDate}=req.query;
 if(!startDate||!endDate)fail(422,'SCHEDULE_REQUIRED','Cần chọn ngày bắt đầu và kết thúc sản xuất.');
 if(startDate>endDate)fail(422,'SCHEDULE_INVALID','Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
 const order=requireRow(await repo.one(c,'DonHang',{id:req.params.id}));expectState(order,['XAC_NHAN','DANG_GIAO']);
 const excludePlanId=req.query.editPlanId||'0';
 if(excludePlanId!=='0'){
  const plan=requireRow(await repo.one(c,'KeHoachSanXuat',{id:excludePlanId,order_id:order.id}));expectState(plan,['CHO_DUYET']);
  for(const line of await repo.find(c,'ChiTietKeHoachSanXuat',{plan_id:plan.id}))if(!req.principal.workshopIds.includes(String(line.workshop_id)))fail(403,'WORKSHOP_SCOPE','Không được cấp phạm vi xưởng của kế hoạch này.');
 }
 const customer=requireRow(await repo.one(c,'KhachHang',{id:order.customer_id}));
 const stocks=new Map(),lines=[];
 for(const item of await repo.find(c,'NguyenLieu',{})){
  const unit=requireRow(await repo.one(c,'DonViTinh',{id:item.base_unit_id}));
  const snapshot=await require('./forecast-repository').planningAvailability(c,item.id,req.principal);
  const[[physical]]=await c.execute('SELECT COALESCE(SUM(t.qty_on_hand),0) AS on_hand,COALESCE(SUM(t.qty_reserved),0) AS reserved FROM TonKho t JOIN LoNguyenLieu l ON l.id=t.material_lot_id JOIN ViTriLuuKho v ON v.id=t.location_id JOIN TaiKhoan_Kho s ON s.warehouse_id=v.warehouse_id WHERE s.account_id=? AND l.material_id=?',[req.principal.accountId,item.id]);
  stocks.set(item.id,{materialId:item.id,code:item.code,name:item.name,status:item.status,unitId:unit.id,unitName:unit.name,discrete:!!unit.discrete,...snapshot,onHandBase:physical.on_hand,reservedBase:physical.reserved});
 }
 for(const line of await require('../orders/repository').displayLines(c,order.id,false)){
  const planned=await repo.planned(c,line.id,excludePlanId),rest=d.parse(line.qty_base)-d.parse(planned),boms=[];
  for(const bom of await repo.find(c,'DinhMuc',{product_id:line.product_id,is_plan_override:false})){
   if(bom.effective_from>startDate||bom.effective_to&&bom.effective_to<endDate)continue;
   const materials=[];
   for(const b of await repo.find(c,'ChiTietDinhMuc',{bom_id:bom.id})){
    const item=requireRow(await repo.one(c,'NguyenLieu',{id:b.material_id})),unit=requireRow(await repo.one(c,'DonViTinh',{id:b.unit_id}));
    materials.push({materialId:item.id,code:item.code,name:item.name,status:item.status,unitId:unit.id,unitName:unit.name,discrete:!!unit.discrete,quantityPerOutputBase:b.qty_per_output,unitValid:String(item.base_unit_id)===String(b.unit_id),...stocks.get(item.id)});
   }
   boms.push({id:bom.id,revision:bom.revision,effectiveFrom:bom.effective_from,effectiveTo:bom.effective_to,outputQuantityBase:bom.output_qty_base,materials});
  }
  const[workshops]=await c.execute("SELECT x.id,x.code,x.name,COALESCE(SUM(CASE WHEN c.capacity_base>COALESCE(used.quantity,0) THEN c.capacity_base-COALESCE(used.quantity,0) ELSE 0 END),0) AS free_capacity FROM XuongSanXuat x JOIN TaiKhoan_Xuong a ON a.workshop_id=x.id AND a.account_id=? JOIN LichNangLucXuong c ON c.workshop_id=x.id AND c.product_id=? AND c.business_date BETWEEN ? AND ? OUTER APPLY(SELECT SUM(s.qty_base) AS quantity FROM PhanBoLichSanXuat s JOIN ChiTietKeHoachSanXuat l ON l.id=s.plan_line_id JOIN KeHoachSanXuat p ON p.id=l.plan_id WHERE s.calendar_id=c.id AND p.id<>? AND p.status NOT IN ('TU_CHOI','HUY')) used WHERE x.status='ACTIVE' GROUP BY x.id,x.code,x.name HAVING SUM(CASE WHEN c.capacity_base>COALESCE(used.quantity,0) THEN c.capacity_base-COALESCE(used.quantity,0) ELSE 0 END)>0 ORDER BY x.code",[req.principal.accountId,line.product_id,startDate,endDate,excludePlanId]);
  const product=requireRow(await repo.one(c,'ThanhPham',{id:line.product_id})),baseUnit=requireRow(await repo.one(c,'DonViTinh',{id:product.base_unit_id}));
  const preferred=['TP011','TP012','TP013','TP014'].includes(product.code)?'XSX003':product.code==='TP015'?'XSX004':'XSX002';
  workshops.sort((a,b)=>Number(b.code===preferred)-Number(a.code===preferred)||a.code.localeCompare(b.code));
  lines.push({id:line.id,productId:line.product_id,productCode:line.product_code,productName:line.product_name,productStatus:product.status,baseUnitName:baseUnit.name,quantity:line.qty_input,unitName:line.unit_name,factorSnapshot:line.factor_snapshot,quantityBase:line.qty_base,plannedBase:planned,remainingBase:d.format(rest>0n?rest:0n),unitPrice:line.unit_price,amount:line.amount,boms:boms.sort((a,b)=>Number(a.revision)-Number(b.revision)),workshops:workshops.map(w=>({id:w.id,code:w.code,name:w.name,freeCapacityBase:w.free_capacity,preferred:w.code===preferred}))});
 }
 return{order:{id:order.id,code:order.code,status:order.status,customerName:customer.name,dueDate:order.due_date,deliveryAddress:order.delivery_address,recipient:order.recipient,recipientPhone:order.recipient_phone,totalAmount:order.total_amount,lines},materials:[...stocks.values()].filter(m=>m.status==='ACTIVE'),startDate,endDate,observedAt:new Date().toISOString(),warehouseScopeIds:req.principal.warehouseIds};
}
module.exports={planningContext};
