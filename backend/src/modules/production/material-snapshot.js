const repo=require('./repository'),d=require('../../shared/decimal');
const {fail,requireRow}=require('../../shared/business-context');
async function snapshot(c,source,productId,quantity,materials,actor){
 if(source.is_plan_override)fail(422,'BOM_PRIVATE','Không dùng định mức riêng của kế hoạch khác làm gợi ý.');
 if(materials===undefined)return source;
 if(!Array.isArray(materials)||materials.length<1||materials.length>100)fail(422,'PLAN_MATERIALS_REQUIRED','Cần ít nhất một vật tư và không quá100dòng.');
 const unique=new Set();
 for(const m of materials){
  if(unique.has(m.materialId))fail(422,'DUPLICATE_PLAN_MATERIAL','Mỗi vật tư chỉ được xuất hiện một lần trong một phân công.');unique.add(m.materialId);
  const item=requireRow(await repo.one(c,'NguyenLieu',{id:m.materialId},{lock:true}));
  if(item.status!=='ACTIVE'||String(item.base_unit_id)!==String(m.unitId))fail(422,'PLAN_MATERIAL_INVALID','Vật tư phải hoạt động và dùng đúng đơn vị cơ sở.');
  const unit=requireRow(await repo.one(c,'DonViTinh',{id:m.unitId})),qty=d.positive(m.quantityBase);
  if(unit.discrete&&qty%d.ten(6))fail(422,'DISCRETE_QUANTITY','Vật tư theo cái/chai/lon phải là số nguyên.');
 }
 await repo.one(c,'ThanhPham',{id:productId},{lock:true});
 const[[revision]]=await c.execute('SELECT COALESCE(MAX(revision),0)+1 AS next_revision FROM DinhMuc WITH(UPDLOCK,HOLDLOCK) WHERE product_id=?',[productId]);
 const id=await repo.insert(c,'DinhMuc',{product_id:productId,revision:revision.next_revision,output_qty_base:quantity,effective_from:source.effective_from,effective_to:source.effective_to,created_by_id:actor,source_bom_id:source.id,is_plan_override:true});
 for(const m of materials)await repo.insert(c,'ChiTietDinhMuc',{bom_id:id,material_id:m.materialId,unit_id:m.unitId,qty_per_output:m.quantityBase});
 return repo.one(c,'DinhMuc',{id});
}
module.exports={snapshot};
