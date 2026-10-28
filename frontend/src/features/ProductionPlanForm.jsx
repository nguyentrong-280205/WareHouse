import {useEffect,useMemo,useRef,useState} from 'react';
import api from '../services/apiClient';
import ActionButton from '../components/ActionButton';
import {moneyText} from './money';
import {formatQuantity} from '../utils/formatNumber';
import QuantityInput from '../components/QuantityInput';
const input='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';
const materialMinimumMessage='Cần ít nhất một nguyên vật liệu để lưu phân công.';
function number(value){if(!/^\d{1,14}(\.\d{1,6})?$/.test(String(value||'')))return null;const[w,f='']=String(value).split('.');return BigInt(w)*1000000n+BigInt(f.padEnd(6,'0'));}
function decimal(value){return formatQuantity((value/1000000n)+'.'+(value%1000000n).toString().padStart(6,'0'),'.');}
function need(output,input,batch,discrete){const a=number(output),b=number(input),c=number(batch);if(a===null||b===null||!c)return null;const quantum=discrete?1000000n:1n;return((a*b+c*quantum-1n)/(c*quantum))*quantum;}
function suggestedMaterials(bom,quantity){return(bom?.materials||[]).map(m=>({materialId:m.materialId,unitId:m.unitId,quantityBase:decimal(need(quantity,m.quantityPerOutputBase,bom.outputQuantityBase,m.discrete)||0n)}));}
export default function ProductionPlanForm({value,onChange,lookups,onReadyChange,editingPlanId}){
 const[context,setContext]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const latest=useRef(value);latest.current=value;
 const orders=lookups['/lookups/orders']||[];
 const sources=context?.order.lines||[],rows=value.lines||[];
 const sourceFor=row=>sources.find(s=>s.id===row.orderLineId);
 const bomFor=row=>sourceFor(row)?.boms.find(b=>b.id===row.bomVersionId);
 const remainingFor=source=>(number(source.remainingBase)||0n)-rows.filter(r=>r.orderLineId===source.id).reduce((sum,r)=>sum+(number(r.quantityBase)||0n),0n);
 function freeFor(row,workshop){let free=number(workshop.freeCapacityBase)||0n;for(const other of rows)if(other!==row&&other.productId===row.productId&&other.workshopId===workshop.id)free-=number(other.quantityBase)||0n;return free>0n?free:0n;}
 function readyWorkshops(row){const qty=number(row.quantityBase);return(sourceFor(row)?.workshops||[]).filter(w=>qty!==null&&qty>0n&&qty<=freeFor(row,w));}
 useEffect(()=>{
  const controller=new AbortController();setContext(null);setError('');
  if(!value.orderId||!value.startDate||!value.endDate){setLoading(false);return()=>controller.abort();}
  if(value.startDate>value.endDate){setLoading(false);setError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');return()=>controller.abort();}
  setLoading(true);
  api.get('/v1/production-plans/order-context/'+value.orderId,{params:{startDate:value.startDate,endDate:value.endDate,...(editingPlanId?{editPlanId:editingPlanId}:{})},signal:controller.signal}).then(r=>{
   if(controller.signal.aborted)return;
   const data=r.data,current=latest.current,lines=[];
   for(const source of data.order.lines){
    if((number(source.remainingBase)||0n)<=0n)continue;
    const previous=current.lines?.filter(l=>l.orderLineId===source.id)||[];
    if(editingPlanId&&!previous.length)continue;
    for(const old of previous.length?previous:[{}]){
     const bom=source.boms.find(b=>b.id===old.bomVersionId)||source.boms.at(-1),quantity=old.quantityBase||source.remainingBase;
     const free=w=>(number(w.freeCapacityBase)||0n)-lines.filter(l=>l.productId===source.productId&&l.workshopId===w.id).reduce((n,l)=>n+(number(l.quantityBase)||0n),0n);
     const candidate=source.workshops.find(w=>w.id===old.workshopId&&free(w)>=(number(quantity)||0n))||source.workshops.find(w=>free(w)>=(number(quantity)||0n));
     lines.push({orderLineId:source.id,productId:source.productId,quantityBase:quantity,workshopId:candidate?.id||'',bomVersionId:bom?.id||'',materials:old.materials||suggestedMaterials(bom,quantity),startDate:current.startDate,endDate:current.endDate});
    }
   }
   setContext(data);onChange({...current,lines});
  }).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.error?.message||'Không tải được thông tin lập kế hoạch.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[value.orderId,value.startDate,value.endDate,editingPlanId]);
 const materials=useMemo(()=>{
  const all=new Map();
  for(const row of rows)for(const item of row.materials||[]){const material=context?.materials.find(m=>m.materialId===item.materialId),quantity=number(item.quantityBase);if(!material||quantity===null)continue;const found=all.get(material.materialId);if(found)found.required+=quantity;else all.set(material.materialId,{...material,required:quantity});}
  return[...all.values()];
 },[rows,context]);
 const hasShortage=materials.some(m=>m.required>(number(m.availableBase)||0n));
 const valid=!!context&&context.order.id===value.orderId&&context.startDate===value.startDate&&context.endDate===value.endDate&&!loading&&!error&&rows.length>0&&rows.every(row=>{
  const source=sourceFor(row),bom=bomFor(row),qty=number(row.quantityBase);
  const total=rows.filter(r=>r.orderLineId===row.orderLineId).reduce((n,r)=>n+(number(r.quantityBase)||0n),0n);
  return source?.productStatus==='ACTIVE'&&qty!==null&&qty>0n&&qty%1000000n===0n&&total<=(number(source.remainingBase)||0n)&&!!bom&&row.materials?.length>0&&new Set(row.materials.map(m=>m.materialId)).size===row.materials.length&&row.materials.every(m=>{const item=context.materials.find(x=>x.materialId===m.materialId),n=number(m.quantityBase);return item&&item.unitId===m.unitId&&n!==null&&n>0n&&(!item.discrete||n%1000000n===0n);})&&readyWorkshops(row).some(w=>w.id===row.workshopId);
 });
 useEffect(()=>{onReadyChange(valid);return()=>onReadyChange(false);},[valid,onReadyChange]);
 function changeRow(index,key,next){onChange({...value,lines:rows.map((r,i)=>{
  if(i!==index)return r;const patch={...r,[key]:next};
  if(key==='bomVersionId')patch.materials=suggestedMaterials(sourceFor(r)?.boms.find(b=>b.id===next),r.quantityBase);
  if(key==='quantityBase'){
   const n=number(next),basis=r._materialQuantityBase||r.quantityBase,bom=bomFor(r);
   if(n!==null&&n>0n){
    patch.materials=(r.materials||[]).map(m=>{const item=context.materials.find(x=>x.materialId===m.materialId),source=bom?.materials.find(x=>x.materialId===m.materialId),unchanged=source&&number(m.quantityBase)===need(basis,source.quantityPerOutputBase,bom.outputQuantityBase,item?.discrete),calculated=unchanged?need(next,source.quantityPerOutputBase,bom.outputQuantityBase,item?.discrete):need(next,m.quantityBase,basis,item?.discrete);return{...m,quantityBase:calculated===null?m.quantityBase:decimal(calculated)};});
    patch._materialQuantityBase=next;
   }
   patch.workshopId=sourceFor(r)?.workshops.find(w=>n!==null&&n>0n&&freeFor(r,w)>=n)?.id||'';
  }
  return patch;
 })});}
 function materialEditor(row,index){return <section className="space-y-2 rounded-xl bg-blue-50/40 p-3"><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-semibold">Vật tư gợi ý — có thể thêm, xóa hoặc sửa số lượng</h4><ActionButton onClick={()=>changeRow(index,'materials',suggestedMaterials(bomFor(row),row.quantityBase))}>Khôi phục gợi ý</ActionButton></div><p className="text-xs text-slate-500">Dữ liệu mẫu đồ án, không phải công thức nhà sản xuất. Thay đổi chỉ áp dụng cho kế hoạch này.</p>{!row.materials?.length&&<p role="alert" className="text-xs text-rose-700">{materialMinimumMessage}</p>}<div className="overflow-auto"><table className="w-full text-sm"><thead><tr>{['Nguyên vật liệu','Đơn vị','Số lượng cần','Tồn vật lý','Khả dụng','Thao tác'].map(h=><th key={h} className="p-2 text-left whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{(row.materials||[]).map((m,j)=>{const item=context.materials.find(x=>x.materialId===m.materialId);return <tr key={m.materialId} className="border-t border-blue-100"><td className="p-2">{item?.name}</td><td className="p-2">{item?.unitName}</td><td className="p-2"><QuantityInput required aria-label={'Số lượng '+item?.name} className={input+' min-w-28'} inputMode="decimal" value={m.quantityBase} onChange={next=>changeRow(index,'materials',row.materials.map((x,k)=>k===j?{...x,quantityBase:next}:x))}/></td><td className="p-2">{formatQuantity(item?.onHandBase)}</td><td className="p-2">{formatQuantity(item?.availableBase)}</td><td className="p-2"><ActionButton variant="danger" onClick={()=>changeRow(index,'materials',row.materials.filter((_,k)=>k!==j))}>Xóa</ActionButton></td></tr>;})}</tbody></table></div><label className="block text-sm"><span>Thêm nguyên vật liệu</span><select className={input} value="" onChange={e=>{const item=context.materials.find(m=>m.materialId===e.target.value);if(item)changeRow(index,'materials',[...(row.materials||[]),{materialId:item.materialId,unitId:item.unitId,quantityBase:'1'}]);}}><option value="">Chọn vật tư trong danh mục</option>{context.materials.filter(m=>!row.materials?.some(x=>x.materialId===m.materialId)).map(m=><option key={m.materialId} value={m.materialId}>{m.name} ({m.unitName}) — tồn {formatQuantity(m.onHandBase)}</option>)}</select></label></section>;}
 return <div className="space-y-5">
  <div className="grid sm:grid-cols-2 gap-4"><label className="sm:col-span-2 text-sm space-y-1"><span>Đơn hàng cần sản xuất *</span><select required disabled={!!editingPlanId} className={input} value={value.orderId||''} onChange={e=>{const order=orders.find(o=>o.id===e.target.value),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());onChange({...value,orderId:e.target.value,startDate:value.startDate||today,endDate:order?.dueDate>=today?order.dueDate:today,lines:[]});}}><option value="">Chọn đơn hàng đã xác nhận</option>{orders.map(o=><option key={o.id} value={o.id}>{o.code} — Giao {o.dueDate}</option>)}</select></label>{[['startDate','Bắt đầu sản xuất'],['endDate','Kết thúc sản xuất']].map(([key,label])=><label key={key} className="text-sm space-y-1"><span>{label} *</span><input required type="date" className={input} value={value[key]||''} onChange={e=>onChange({...value,[key]:e.target.value})}/></label>)}</div>
  {loading&&<p role="status" className="text-sm text-blue-600">Đang tải đơn hàng, định mức, tồn kho và năng lực xưởng…</p>}
  {error&&<p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  {context&&sources.some(s=>remainingFor(s)>0n)&&<label className="block text-sm space-y-1"><span>Thêm phân công cho phần sản lượng chưa phân</span><select className={input} value="" onChange={e=>{const source=sources.find(s=>s.id===e.target.value);if(source)onChange({...value,lines:[...rows,{orderLineId:source.id,productId:source.productId,quantityBase:decimal(remainingFor(source)),bomVersionId:source.boms.at(-1)?.id||'',materials:suggestedMaterials(source.boms.at(-1),decimal(remainingFor(source))),workshopId:'',startDate:value.startDate,endDate:value.endDate}]});}}><option value="">Chọn mặt hàng từ đơn hàng</option>{sources.filter(s=>remainingFor(s)>0n).map(s=><option key={s.id} value={s.id}>{s.productName} — chưa phân {formatQuantity(decimal(remainingFor(s)))} {s.baseUnitName}</option>)}</select></label>}
  {context&&<>
   <p role="status" className={'rounded-xl p-3 text-sm font-semibold '+(hasShortage?'bg-amber-50 text-amber-800':'bg-emerald-50 text-emerald-800')}>{hasShortage?'Thiếu nguyên vật liệu':'Đủ nguyên vật liệu'}<span className="block text-xs font-normal mt-1">Tình trạng theo khả dụng hiện tại. Thiếu vật tư vẫn lưu chờ duyệt để tiếp tục lập nhu cầu mua bổ sung; chưa giữ hoặc trừ tồn kho.</span></p>
   <section className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm"><h3 className="font-semibold">Thông tin đơn hàng {context.order.code}</h3><div className="grid sm:grid-cols-2 gap-2"><p>Khách hàng: {context.order.customerName}</p><p>Ngày giao: {context.order.dueDate}</p><p>Người nhận: {context.order.recipient}</p><p>Điện thoại: {context.order.recipientPhone}</p><p className="sm:col-span-2">Địa chỉ giao: {context.order.deliveryAddress}</p><p>Tổng tiền đã chốt: {moneyText(context.order.totalAmount)} VND</p></div><div className="overflow-auto"><table className="w-full text-sm"><thead><tr>{['Thành phẩm','Lượng đặt','Quy đổi cơ sở','Đã lập kế hoạch','Còn cần lập','Đơn giá','Thành tiền'].map(h=><th key={h} className="text-left p-2 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{sources.map(s=><tr key={s.id} className="border-t border-slate-200"><td className="p-2">{s.productName}</td><td className="p-2 whitespace-nowrap">{formatQuantity(s.quantity)} {s.unitName}</td><td className="p-2 whitespace-nowrap">{formatQuantity(s.quantityBase)} {s.baseUnitName}</td><td className="p-2">{formatQuantity(s.plannedBase)}</td><td className="p-2">{formatQuantity(s.remainingBase)}</td><td className="p-2">{moneyText(s.unitPrice)}</td><td className="p-2">{moneyText(s.amount)}</td></tr>)}</tbody></table></div></section>
   <fieldset className="space-y-4"><legend className="font-semibold text-sm">Phân công sản xuất</legend>{!rows.length&&<p className="text-sm text-amber-700">Đơn hàng đã được lập đủ kế hoạch; không còn sản lượng để phân công.</p>}{rows.map((row,index)=>{const source=sourceFor(row),bom=bomFor(row),workshops=readyWorkshops(row);return <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3"><div className="grid sm:grid-cols-2 gap-3"><label className="text-sm space-y-1"><span>Thành phẩm từ đơn hàng</span><input className={input+' bg-slate-50'} readOnly value={source?source.productName:''}/></label><label className="text-sm space-y-1"><span>Sản lượng {source?.baseUnitName?.toLowerCase()} cơ sở *</span><QuantityInput required className={input} value={row.quantityBase} onChange={next=>changeRow(index,'quantityBase',next)}/></label><label className="text-sm space-y-1"><span>Phiên bản định mức *</span><select required className={input} value={row.bomVersionId} onChange={e=>changeRow(index,'bomVersionId',e.target.value)}><option value="">Chọn định mức</option>{source?.boms.map(b=><option key={b.id} value={b.id}>v{b.revision} — đầu ra {formatQuantity(b.outputQuantityBase)} {source.baseUnitName}</option>)}</select></label><label className="text-sm space-y-1"><span>Xưởng sẵn sàng *</span><select required className={input} value={row.workshopId} onChange={e=>changeRow(index,'workshopId',e.target.value)}><option value="">Chọn xưởng đủ năng lực trong lịch</option>{workshops.map(w=><option key={w.id} value={w.id}>{w.name} — Sẵn sàng: {formatQuantity(decimal(freeFor(row,w)))} {source?.baseUnitName}</option>)}</select></label></div>
   {materialEditor(row,index)}
   {!source?.boms.length&&<p className="text-sm text-amber-700">Thành phẩm chưa có định mức hiệu lực trong lịch này. Cần cấu hình BOM trước khi lưu kế hoạch.</p>}
   {bom&&(!bom.materials.length||bom.materials.some(m=>m.status!=='ACTIVE'||!m.unitValid))&&<p className="text-sm text-amber-700">Định mức chưa có nguyên liệu hợp lệ hoặc nguyên liệu đã khóa. Cần cập nhật cấu hình.</p>}
   {!workshops.length&&<p className="text-sm text-amber-700">Không có xưởng sẵn sàng cho sản lượng này: kiểm tra lịch năng lực, phần đã phân công và phạm vi được cấp.</p>}
   <div className="flex gap-2"><ActionButton onClick={()=>{const used=rows.filter(r=>r.orderLineId===row.orderLineId).reduce((n,r)=>n+(number(r.quantityBase)||0n),0n),remaining=(number(source.remainingBase)||0n)-used;if(remaining>0n)onChange({...value,lines:[...rows,{...row,quantityBase:decimal(remaining),materials:suggestedMaterials(bomFor(row),decimal(remaining)),workshopId:''}]});}} disabled={rows.filter(r=>r.orderLineId===row.orderLineId).reduce((n,r)=>n+(number(r.quantityBase)||0n),0n)>=(number(source?.remainingBase)||0n)}>Thêm phân công cùng thành phẩm</ActionButton><ActionButton variant="danger" onClick={()=>onChange({...value,lines:rows.filter((_,i)=>i!==index)})}>Xóa phân công</ActionButton></div></div>;})}</fieldset>
   <section className="space-y-2"><h3 className="font-semibold text-sm">Nguyên vật liệu và tồn kho phục vụ kế hoạch</h3><p className="text-xs text-slate-500">Nhu cầu cộng theo các phân công và BOM đã chọn. Khả dụng đã loại hàng không đạt QC, hết hạn, bị giữ, phạm vi kiểm kê và phần dự kiến cho kế hoạch khác. Đây là tham khảo, không giữ hoặc trừ tồn.</p>{!materials.length?<p className="text-sm text-amber-700">Chưa thể tính nguyên liệu khi chưa có định mức hợp lệ.</p>:<div className="overflow-auto"><table className="w-full text-sm"><thead><tr>{['Nguyên vật liệu','Đơn vị','Cần sản xuất','Tồn vật lý','Đang giữ','Khả dụng lập kế hoạch','Còn thiếu'].map(h=><th key={h} className="p-2 text-left whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{materials.map(m=>{const free=number(m.availableBase)||0n,shortage=m.required>free?m.required-free:0n;return <tr key={m.materialId} className="border-t border-slate-200"><td className="p-2">{m.name}</td><td className="p-2">{m.unitName}</td><td className="p-2">{formatQuantity(decimal(m.required))}</td><td className="p-2">{formatQuantity(m.onHandBase)}</td><td className="p-2">{formatQuantity(m.reservedBase)}</td><td className="p-2">{formatQuantity(m.availableBase)}</td><td className={'p-2 '+(shortage?'text-rose-700 font-semibold':'text-emerald-700')}>{formatQuantity(decimal(shortage))}</td></tr>;})}</tbody></table></div>}</section>
   {!valid&&rows.length>0&&<p className="text-sm text-amber-700">Chọn BOM hợp lệ và xưởng sẵn sàng; tổng sản lượng mỗi mặt hàng phải là số nguyên dương và không vượt phần đơn hàng còn cần lập kế hoạch.</p>}
  </>}
 </div>;
}
