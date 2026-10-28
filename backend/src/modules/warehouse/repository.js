const base = require('../../shared/business-repository');
const entities = {
 materials: { table: 'NguyenLieu', fields: { code:'code',name:'name',baseUnitId:'base_unit_id',requiresExpiry:'requires_expiry',storageCondition:'storage_condition',status:'status' } },
 products: { table: 'ThanhPham', fields: { code:'code',name:'name',baseUnitId:'base_unit_id',containerType:'container_type',volumeMl:'volume_ml',shelfLifeDays:'shelf_life_days',description:'description' } },
 warehouses: { table: 'Kho', fields: { code:'code',name:'name',type:'type',capacity:'capacity',capacityUnitId:'capacity_unit_id' }, scoped: true },
 materialLots: { table: 'LoNguyenLieu', fields: { code:'code',itemId:'material_id',manufacturedOn:'manufactured_on',expiresOn:'expires_on' }, itemColumn:'material_id' },
 productLots: { table: 'LoThanhPham', fields: { code:'code',itemId:'product_id',manufacturedOn:'manufactured_on',expiresOn:'expires_on',packagingVersionId:'packaging_version_id' }, itemColumn:'product_id' },
 locations: { table: 'ViTriLuuKho', fields: { code:'code',name:'name',area:'area',capacity:'capacity',capacityUnitId:'capacity_unit_id',storageRule:'storage_rule' } },
};
async function packaging(c, productId) {
  const [rows] = await c.execute('SELECT p.id,p.unit_id,p.units_per_pack,p.revision,p.effective_from,p.cartons_per_pallet,p.carton_factor_snapshot,u.code AS unit_code FROM QuyCachDongGoi p JOIN DonViTinh u ON u.id=p.unit_id WHERE p.product_id=? ORDER BY p.revision,p.id', [productId]);
  return rows;
}
async function prices(c, productId) { return (await c.execute('SELECT id,unit_id,unit_price,revision,effective_at FROM GiaBanThanhPham WHERE product_id=? ORDER BY revision,id', [productId]))[0]; }
async function latestPriceRevision(c, product, unit) { return Number((await c.execute('SELECT COALESCE(MAX(revision),0) AS revision FROM GiaBanThanhPham WHERE product_id=? AND unit_id=?', [product,unit]))[0][0].revision); }
async function used(c, entity, id) {
  // Immutable FK-backed downstream references. No table can be edited into a different identity.
  const [rows] = await c.execute('SELECT OBJECT_NAME(f.parent_object_id) AS TABLE_NAME,COL_NAME(f.parent_object_id,f.parent_column_id) AS COLUMN_NAME FROM sys.foreign_key_columns f WHERE OBJECT_NAME(f.referenced_object_id)=? AND COL_NAME(f.referenced_object_id,f.referenced_column_id)=?', [entity.table,'id']);
  for (const r of rows) {
    if(entity.table==='Kho'&&r.TABLE_NAME==='TaiKhoan_Kho')continue;
    if (!/^[A-Za-z_]+$/.test(r.TABLE_NAME) || !/^[A-Za-z_]+$/.test(r.COLUMN_NAME)) throw new Error('INVALID_METADATA_IDENTIFIER');
    const [refs] = await c.execute('SELECT TOP (1) 1 AS present FROM dbo.[' + r.TABLE_NAME + '] WHERE [' + r.COLUMN_NAME + ']=?', [id]);
    if (refs.length) return true;
  }
  return false;
}
async function occupancy(c,warehouseId,locationId){
 const[[schema]]=await c.execute("SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_CATALOG=DB_NAME() AND TABLE_SCHEMA='dbo' AND TABLE_NAME IN ('TonKho','TiepNhanChuaDinhDanh')");
 if(Number(schema.n)===0)return 0n;if(Number(schema.n)!==2)throw new (require('../../shared/http').AppError)(503,'MIGRATION_REQUIRED','Schema sức chứa chưa đầy đủ.');
 return require('../inventory/repository').occupied(c,warehouseId,locationId);
}
async function storedConditions(c,locationId){return(await c.execute('SELECT DISTINCT n.storage_condition FROM TonKho t JOIN LoNguyenLieu l ON l.id=t.material_lot_id JOIN NguyenLieu n ON n.id=l.material_id WHERE t.location_id=? AND t.qty_on_hand>0',[locationId]))[0];}
for(const entity of Object.values(entities))entity.fields.status='status';
module.exports = { ...base, entities, packaging, prices, latestPriceRevision, used, occupancy,storedConditions };
