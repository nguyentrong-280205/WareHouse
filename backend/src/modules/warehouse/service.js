const repo = require('./repository');
const d = require('../../shared/decimal');
const { fail, requireRow, expectVersion, scope, businessDate, now } = require('../../shared/business-context');
function serialize(row, entity) {
  const result = { id:String(row.id),version:Number(row.version),status:row.status };
  for (const [key,column] of Object.entries(entity.fields)) if (row[column] !== null && row[column] !== undefined) result[key] = key === 'requiresExpiry' ? Boolean(row[column]) : key.endsWith('Id') ? String(row[column]) : row[column];
  if (entity.itemColumn) result.itemKind = entity.itemColumn === 'material_id' ? 'MATERIAL' : 'PRODUCT';
  return result;
}
function createWarehouseService(context) {
  async function result(c, kind, row) {
    const value = serialize(row, repo.entities[kind]);
    if(kind==='materialLots'||kind==='productLots')value.itemName=(await repo.one(c,kind==='materialLots'?'NguyenLieu':'ThanhPham',{id:value.itemId}))?.name;
    if (kind === 'products') {
      value.packaging = (await repo.packaging(c,row.id)).map(p => ({ id:String(p.id), unitId:String(p.unit_id),unitCode:p.unit_code,unitsPerPack:p.units_per_pack,revision:p.revision,effectiveFrom:p.effective_from,
        ...(p.cartons_per_pallet!==null?{cartonsPerPallet:Number(p.cartons_per_pallet),cartonFactorSnapshot:p.carton_factor_snapshot}:{}) }));
      value.salesPrices = (await repo.prices(c,row.id)).map(p => ({id:String(p.id),unitId:String(p.unit_id),unitPrice:p.unit_price,revision:p.revision,effectiveAt:String(p.effective_at).replace(' ','T')+'Z'}));
    }
    return value;
  }
  async function list(kind, req) {
    return context.read(async c => {
      const entity = repo.entities[kind], page = req.query.page || 1, pageSize = req.query.pageSize || 20;
      const {rows,total} = await repo.page(c,entity.table,{...req.query,page,pageSize},{scopeIds:entity.scoped ? req.principal.warehouseIds : undefined,itemColumn:entity.itemColumn,search:entity.itemColumn?['code']:['code','name']});
      return {data:await Promise.all(rows.map(r=>result(c,kind,r))),meta:{page,pageSize,total}};
    });
  }
  async function validate(c, kind, data, before) {
    if (data.code !== undefined && !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,49}$/.test(data.code)) fail(422,'CODE_INVALID','Mã chỉ gồm chữ/số, dấu gạch, chấm hoặc gạch dưới.');
    if (data.name !== undefined && !data.name.trim()) fail(422,'NAME_REQUIRED','Tên không được trống.');
    if (data.baseUnitId) {
      const unit = requireRow(await repo.one(c,'DonViTinh',{id:data.baseUnitId}));
      if (kind === 'products' && (!unit.discrete || unit.dimension !== 'COUNT')) fail(422,'UNIT_INVALID','Thành phẩm phải có đơn vị cơ sở rời.');
    }
    if(kind==='products'){
      const containerType=data.containerType||before?.container_type;
      const unit=requireRow(await repo.one(c,'DonViTinh',{id:data.baseUnitId||before?.base_unit_id}));
      if(unit.code!==require('../../shared/product-packaging').baseCode(containerType))fail(422,'PRODUCT_BASE_UNIT_INVALID','Thành phẩm dạng lon dùng đơn vị Lon; chai PET/thủy tinh dùng Chai.');
    }
    if (['warehouses','locations'].includes(kind)) {
      if (data.capacity !== undefined) d.parse(data.capacity);
      if (data.capacityUnitId) { const u=requireRow(await repo.one(c,'DonViTinh',{id:data.capacityUnitId})); if (!['MASS','CAPACITY_VOLUME'].includes(u.dimension)) fail(422,'CAPACITY_UNIT_INVALID','FS05 chỉ cho KG/M3 tương thích.'); }
      // Updating a warehouse with locations cannot silently invalidate child units/capacity.
      if (before && ((data.capacityUnitId && String(data.capacityUnitId)!==String(before.capacity_unit_id)) || (data.type && data.type!==before.type)) && await repo.used(c,repo.entities[kind],before.id))
        fail(409,'CAPACITY_IN_USE','Kho đã có vị trí/lịch sử: không sửa đơn vị, loại hoặc sức chứa hồi tố.');
      if(before && data.capacity!==undefined && await repo.occupancy(c,before.warehouse_id||before.id,before.warehouse_id?before.id:undefined)>d.parse(data.capacity)*d.ten(9))fail(409,'CAPACITY_BELOW_OCCUPIED','Không được giảm sức chứa thấp hơn phần chiếm chỗ thực tế.');
    }
    if (data.volumeMl) d.positive(data.volumeMl);
    if (kind.endsWith('Lots')) {
      const product = kind === 'productLots', itemId = data.itemId || before?.[product?'product_id':'material_id'];
      const item=requireRow(await repo.one(c,product?'ThanhPham':'NguyenLieu',{id:itemId}));
      if (item.status !== 'ACTIVE') fail(409,'ITEM_LOCKED','Danh mục đã khóa.');
      const manufactured=data.manufacturedOn || before?.manufactured_on, expires=data.expiresOn === undefined ? before?.expires_on : data.expiresOn;
      if ((product || item.requires_expiry) && !expires) fail(422,'EXPIRY_REQUIRED','Lô phải có hạn sử dụng.');
      if (expires && expires < manufactured) fail(422,'EXPIRY_INVALID','HSD phải từ ngày sản xuất trở đi.');
      if (manufactured > businessDate()) fail(422,'MANUFACTURE_DATE_INVALID','Ngày sản xuất không được ở tương lai.');
      if (product) { const p=requireRow(await repo.one(c,'QuyCachDongGoi',{id:data.packagingVersionId || before?.packaging_version_id,product_id:itemId})); if (p.effective_from > manufactured) fail(422,'PACKAGING_NOT_EFFECTIVE','Quy cách chưa hiệu lực ở ngày sản xuất.'); }
    }
  }
  async function extras(c, kind, id, data, principal) {
    if (kind !== 'products') return;
    const product=requireRow(await repo.one(c,'ThanhPham',{id}));
    if (data.packaging) for (const p of [...data.packaging].sort((a,b)=>Number(a.unitCode==='PALLET')-Number(b.unitCode==='PALLET'))) {
      const unit = requireRow(await repo.one(c,'DonViTinh',{code:p.unitCode}));
      const factor=d.positive(p.unitsPerPack,9); if (unit.dimension !== 'COUNT' || factor % d.ten(9)) fail(422,'PACKAGING_INVALID','Quy cách chai/lon phải là số nguyên dương.');
      require('../../shared/product-packaging').validatePackaging(product,unit.code,factor,p.cartonsPerPallet);
      const existing=await repo.one(c,'QuyCachDongGoi',{product_id:id,unit_id:unit.id,revision:p.revision});
      if(existing){if(d.parse(existing.units_per_pack,9)!==factor || existing.effective_from!==p.effectiveFrom || p.cartonsPerPallet!==undefined&&(existing.cartons_per_pallet===null||Number(existing.cartons_per_pallet)!==p.cartonsPerPallet))fail(409,'PACKAGING_IMMUTABLE','Quy cách đã lưu là bất biến; hãy thêm phiên bản mới.');continue;}
      let pallet={};
      if(unit.code==='PALLET'){
        if(!p.cartonsPerPallet)fail(422,'PALLET_CARTONS_REQUIRED','Cần cấu hình số thùng trên một pallet cho phiên bản mới.');
        const cartonUnit=requireRow(await repo.one(c,'DonViTinh',{code:'CARTON'}));
        const carton=(await repo.find(c,'QuyCachDongGoi',{product_id:id,unit_id:cartonUnit.id},{order:'revision'})).filter(r=>r.effective_from<=p.effectiveFrom).at(-1);
        if(!carton)fail(422,'CARTON_PACKAGING_REQUIRED','Cần lưu quy cách Thùng có hiệu lực trước khi tạo quy cách Pallet.');
        require('../../shared/product-packaging').validatePackaging(product,unit.code,factor,p.cartonsPerPallet,d.positive(carton.units_per_pack,9));
        pallet={cartons_per_pallet:p.cartonsPerPallet,carton_factor_snapshot:carton.units_per_pack};
      }
      await repo.insert(c,'QuyCachDongGoi',{product_id:id,unit_id:unit.id,revision:p.revision,units_per_pack:p.unitsPerPack,effective_from:p.effectiveFrom,created_by_id:principal.accountId,...pallet});
    }
    if (data.salesPrices) for (const price of data.salesPrices) {
      d.parse(price.unitPrice);
      const product=requireRow(await repo.one(c,'ThanhPham',{id}));
      const allowed=String(price.unitId)===String(product.base_unit_id) || (await repo.find(c,'QuyCachDongGoi',{product_id:id,unit_id:price.unitId})).length;
      if (!allowed) fail(422,'PRICE_UNIT_INVALID','Đơn vị giá phải thuộc SKU/quy cách.');
      await repo.insert(c,'GiaBanThanhPham',{product_id:id,unit_id:price.unitId,revision:await repo.latestPriceRevision(c,id,price.unitId)+1,unit_price:price.unitPrice,effective_at:now(),created_by_id:principal.accountId});
    }
  }
  async function mutate(kind, action, req) {
    const entity=repo.entities[kind], operation=kind+'.'+action;
    return context.write(req,operation,async c=>{
      let before, id=req.params.id;
      if (action !== 'create') { before=requireRow(await repo.one(c,entity.table,{id},{lock:true})); expectVersion(before,req.body.expectedVersion); if (entity.scoped) scope(req.principal,id); }
      if (action === 'lock') {
        await repo.update(c,entity.table,{id},{status:'LOCKED',version:Number(before.version)+1,updated_at:now()});
      } else {
        const data={...req.body};
        if(kind==='materialLots'){
          if(before&&data.itemId!==undefined&&String(data.itemId)!==String(before.material_id))fail(409,'MATERIAL_LOT_IMMUTABLE','Một lô chỉ thuộc một nguyên liệu và không được đổi nguyên liệu sau khi tạo.');
          if(before&&data.code!==undefined&&data.code!==before.code)fail(409,'MATERIAL_LOT_CODE_IMMUTABLE','Mã lô được tạo theo nguyên liệu và không được sửa.');
          if(!before){const material=requireRow(await repo.one(c,'NguyenLieu',{id:data.itemId}));data.code=await require('./material-lot-codes').next(c,material);}
        }
        if(kind==='productLots'&&!before&&data.expiresOn===undefined){
          const product=requireRow(await repo.one(c,'ThanhPham',{id:data.itemId}));
          const expiry=require('../../shared/lot-expiry').defaultExpiry(data.manufacturedOn,Number(product.shelf_life_days));
          if(expiry)data.expiresOn=expiry;
        }
        await validate(c,kind,data,before);
        if (before) {
          const immutable=kind.endsWith('Lots')?['itemId','manufacturedOn','expiresOn','packagingVersionId']:['baseUnitId','containerType','volumeMl'];
          if (immutable.some(k=>data[k]!==undefined && String(data[k])!==String(before[entity.fields[k]])) && await repo.used(c,entity,before.id)) fail(409,'HISTORY_IMMUTABLE','Không sửa định danh/quy đổi đã phát sinh lịch sử.');
        }
        const values=Object.fromEntries(Object.entries(entity.fields).filter(([key])=>data[key]!==undefined).map(([key,col])=>[col,typeof data[key]==='string'?data[key].trim():data[key]]));
        if (action === 'create') {
          id=await repo.insert(c,entity.table,{...values,created_by_id:req.principal.accountId});
          if (entity.scoped) await repo.insert(c,'TaiKhoan_Kho',{account_id:req.principal.accountId,warehouse_id:id});
        } else await repo.update(c,entity.table,{id},{...values,version:Number(before.version)+1,updated_at:now()});
        await extras(c,kind,id,data,req.principal);
      }
      const after=requireRow(await repo.one(c,entity.table,{id}));
      await repo.audit(c,req.principal,operation,entity.table,id,before,after,req.correlationId);
      return result(c,kind,after);
    },action==='create'?201:200);
  }
  async function locations(req) {
    scope(req.principal,req.params.id);
    return context.read(async c=>{const data=[];for(const r of await repo.find(c,'ViTriLuuKho',{warehouse_id:req.params.id})){const occupied=await repo.occupancy(c,r.warehouse_id,r.id),remaining=d.parse(r.capacity)*d.ten(9)-occupied;if(remaining<0n)fail(409,'CAPACITY_INCONSISTENT','Vị trí đang vượt sức chứa, cần đối soát.');data.push({...serialize(r,repo.entities.locations),warehouseId:String(r.warehouse_id),occupiedCapacity:d.format(occupied,15),heldCapacity:'0.000000000000000',remainingCapacity:d.format(remaining,15)});}return{data};});
  }
  async function createLocation(req) {
    scope(req.principal,req.params.id);
    return context.write(req,'warehouses.createLocation',async c=>{
      scope(req.principal,req.params.id);
      const warehouse=requireRow(await repo.one(c,'Kho',{id:req.params.id},{lock:true}));
      if (warehouse.status!=='ACTIVE') fail(409,'WAREHOUSE_LOCKED','Kho đã khóa.');
      await validate(c,'locations',req.body);
      if (String(req.body.capacityUnitId)!==String(warehouse.capacity_unit_id)) fail(422,'CAPACITY_UNIT_MISMATCH','Vị trí và kho phải cùng đơn vị sức chứa.');
      const values=Object.fromEntries(Object.entries(repo.entities.locations.fields).filter(([k])=>req.body[k]!==undefined).map(([k,col])=>[col,req.body[k]]));
      const id=await repo.insert(c,'ViTriLuuKho',{...values,warehouse_id:warehouse.id,created_by_id:req.principal.accountId});
      const after=requireRow(await repo.one(c,'ViTriLuuKho',{id}));
      await repo.audit(c,req.principal,'warehouses.createLocation','ViTriLuuKho',id,null,after,req.correlationId);
      return {...serialize(after,repo.entities.locations),warehouseId:String(warehouse.id),occupiedCapacity:'0.000000000000000',heldCapacity:'0.000000000000000',remainingCapacity:d.format(d.parse(after.capacity)*d.ten(9),15)};
    },201);
  }
  async function read(kind,req) {
    if(repo.entities[kind].scoped)scope(req.principal,req.params.id);
    return context.read(async c=>result(c,kind,requireRow(await repo.one(c,repo.entities[kind].table,{id:req.params.id}))));
  }
  async function updateLocation(req){return context.write(req,'warehouses.updateLocation',async c=>{
    scope(req.principal,req.params.id);const warehouse=requireRow(await repo.one(c,'Kho',{id:req.params.id},{lock:true})),before=requireRow(await repo.one(c,'ViTriLuuKho',{id:req.params.locationId,warehouse_id:warehouse.id},{lock:true}));expectVersion(before,req.body.expectedVersion);await validate(c,'locations',req.body,before);
      await require('../stocktake/lifecycle').recover(c,req,warehouse.id);if(await repo.one(c,'KhoaViTriKiemKe',{location_id:before.id}))fail(409,'STOCKTAKE_LOCKED','Chưa được sửa vị trí trong phạm vi đang kiểm kê.');
      if(req.body.storageRule!==undefined&&(await repo.storedConditions(c,before.id)).some(m=>m.storage_condition?.trim()&&m.storage_condition.trim().toUpperCase()!==req.body.storageRule.trim().toUpperCase()))fail(422,'STORAGE_CONDITION_MISMATCH','Điều kiện mới không phù hợp nguyên liệu đang lưu tại vị trí.');
    if(req.body.capacityUnitId&&String(req.body.capacityUnitId)!==String(warehouse.capacity_unit_id))fail(422,'CAPACITY_UNIT_MISMATCH','Vị trí và kho phải cùng đơn vị sức chứa.');
    const values=Object.fromEntries(Object.entries(repo.entities.locations.fields).filter(([k])=>req.body[k]!==undefined).map(([k,col])=>[col,req.body[k]]));if(req.body.status)values.status=req.body.status;
    await repo.update(c,'ViTriLuuKho',{id:before.id},{...values,version:before.version+1,updated_at:now()});const after=await repo.one(c,'ViTriLuuKho',{id:before.id});await repo.audit(c,req.principal,'warehouses.updateLocation','ViTriLuuKho',before.id,before,after,req.correlationId);const occupied=await repo.occupancy(c,warehouse.id,after.id);return{...serialize(after,repo.entities.locations),warehouseId:String(warehouse.id),occupiedCapacity:d.format(occupied,15),heldCapacity:'0.000000000000000',remainingCapacity:d.format(d.parse(after.capacity)*d.ten(9)-occupied,15)};
  });}
  return { list,read,mutate,locations,createLocation,updateLocation };
}
module.exports = { createWarehouseService, serialize };
