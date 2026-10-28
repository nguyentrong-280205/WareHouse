import {useEffect,useState} from 'react';
import api from '../services/apiClient';
import {useAuth} from '../auth/useAuth';
import {statusLabels} from './resources';

const labels={MATERIAL:'Nguyên liệu',PRODUCT:'Thành phẩm',FINISHED:'Thành phẩm',CONTROLLED:'Hàng lỗi',DAT:'Đạt',QUARANTINE:'Chờ kiểm tra',FAILED:'Không đạt',EXPIRED:'Hết hạn',UNKNOWN:'Chưa xác định',LOW_STOCK:'Tồn dưới ngưỡng',NEAR_EXPIRY:'Gần hết hạn',SLOW_MOVING:'Chậm luân chuyển',DRY:'Khô ráo',COUNT:'Số lượng',MASS:'Khối lượng',CAPACITY_VOLUME:'Thể tích',PET:'Chai nhựa PET',GLASS:'Chai thủy tinh',CAN:'Lon'};
export function displayLabel(value){return labels[value]||statusLabels[value]||value;}
export function recordName(row,fallback='Chưa có thông tin'){return row?.name||row?.displayName||row?.materialName||row?.productName||row?.code||fallback;}
async function all(path){let page=1,items=[],result;do{result=await api.get('/v1'+path,{params:['/materials','/products','/warehouses','/material-lots','/product-lots'].includes(path)?{page,pageSize:100}:{}});items.push(...result.data.data);page++;}while(result.data.meta&&items.length<result.data.meta.total&&result.data.data.length);return items;}

// Read only existing endpoints under the session's permissions; never widen scope.
export function useReferenceNames(){
 const{session}=useAuth(),[catalog,setCatalog]=useState({}),permissions=session.permissions;
 useEffect(()=>{let live=true;setCatalog({});const has=(...grants)=>grants.some(p=>permissions.includes(p));
  const paths=[];
  const add=(key,path)=>paths.push([key,path]);
  if(has('materials.read'))add('materials','/materials');else if(has('purchases.create','materialRequests.create','plans.create'))add('materials','/lookups/materials');
  if(has('products.read'))add('products','/products');else if(has('orders.create','plans.create','productRequests.create','returnReceptions.post'))add('products','/lookups/products');
  if(has('warehouses.read'))add('warehouses','/warehouses');else if(has('receipts.allocate','receipts.postMaterial','receipts.postProduct','receipts.postReturn','issues.allocate','issues.postMaterial','issues.postSale','stocktakes.create','returnReceptions.post','unknownReturns.resolve','reports.read','reports.configureAlerts','inventory.search'))add('warehouses','/lookups/warehouses');
  if(has('materials.read','products.write','warehouses.write','materialLots.write','productLots.write','orders.create','purchases.create','stocktakes.count','materialQc.write','productQc.write','returnQc.write','receipts.allocate','issues.allocate'))add('units','/lookups/units');
  if(has('materialLots.read'))add('materialLots','/material-lots');
  if(has('productLots.read'))add('productLots','/product-lots');
  if(has('plans.create','materialRequests.create','productRequests.create'))add('workshops','/lookups/workshops');
  if(has('purchases.create'))add('suppliers','/lookups/suppliers');
  Promise.allSettled(paths.map(async([key,path])=>{const rows=await all(path);if(key==='warehouses'&&has('warehouses.read','receipts.read','receipts.allocate','issues.read','issues.allocate'))await Promise.all(rows.map(async w=>{try{w.locations=await all('/warehouses/'+w.id+'/locations');}catch{ /* Retain permitted lookup names. */ }}));return[key,rows];})).then(results=>{if(live)setCatalog(Object.fromEntries(results.filter(r=>r.status==='fulfilled').map(r=>r.value)));});return()=>{live=false;};
 },[session.accountId,permissions]);
 function find(key,id){return(catalog[key]||[]).find(r=>String(r.id)===String(id));}
 function resolve(key,value,row={}){
  if(value===undefined||value===null||value==='')return '—';
  const direct=row[key.replace(/Id$/,'Name')];if(key.endsWith('Id')&&direct)return direct;
  if(key==='warehouseId')return recordName(find('warehouses',value),'Kho chưa có tên trong phạm vi được cấp');
  if(key==='locationId'){const location=(catalog.warehouses||[]).flatMap(w=>w.locations||[]).find(l=>String(l.id)===String(value));return recordName(location,'Vị trí chưa có tên trong phạm vi được cấp');}
  if(key==='unitId'||key==='baseUnitId'||key==='capacityUnitId')return recordName(find('units',value),'Đơn vị chưa có tên');
  if(key==='materialId')return recordName(find('materials',value),'Nguyên liệu chưa có tên');
  if(key==='productId')return recordName(find('products',value),'Thành phẩm chưa có tên');
  if(key==='workshopId')return recordName(find('workshops',value),'Xưởng chưa có tên');
  if(key==='supplierId')return recordName(find('suppliers',value),'Nhà cung cấp chưa có tên');
  if(key==='itemId'){const kind=row.itemKind||row.lotKind;return row.itemName||recordName(find(kind==='PRODUCT'?'products':'materials',value),'Mặt hàng chưa có tên');}
  if(['lotId','materialLotId','productLotId'].includes(key)){const product=key==='productLotId'||row.lotKind==='PRODUCT'||row.itemKind==='PRODUCT';return row.lotCode||find(product?'productLots':'materialLots',value)?.code||'Lô chưa có thông tin';}
  if(key.endsWith('Id'))return row[key.replace(/Id$/,'Code')]||'Chưa có thông tin';
  return displayLabel(value);
 }
 return{catalog,resolve};
}
