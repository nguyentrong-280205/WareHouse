import {useEffect,useRef,useState} from 'react';
import api from '../services/apiClient';
import {Fields,empty} from './ResourcePage';
import {resources} from './resources';
import {formatQuantity} from '../utils/formatNumber';
const style='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';
export default function MaterialIssueCreate({value,onChange,lookups,onReadyChange}){
 const[requests,setRequests]=useState([]),[options,setOptions]=useState({warehouses:[],staff:[]}),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const[preview,setPreview]=useState(null),[suggesting,setSuggesting]=useState(false),[suggestionError,setSuggestionError]=useState(''),[suggestionRevision,setSuggestionRevision]=useState(0);
 const latest=useRef(value);latest.current=value;
 useEffect(()=>{let active=true;(async()=>{try{let page=1,items=[],result;do{result=await api.get('/v1/material-assignments',{params:{page,pageSize:100}});items.push(...result.data.data);page++;}while(items.length<result.data.meta.total&&result.data.data.length);const r=await api.get('/v1/material-assignment-options');if(active){setRequests(items.filter(x=>['DA_GUI','DANG_CAP'].includes(x.status)&&(x.canAssign||x.staff.length)));setOptions(r.data.data);}}catch(e){if(active)setError(e.response?.data?.error?.message||'Không tải được phiếu và nhân viên.');}finally{if(active)setLoading(false);}})();return()=>{active=false;};},[]);
 const selected=requests.find(r=>r.id===value.sourceId),assigned=selected&&!selected.canAssign;
 const staff=options.staff.filter(a=>a.warehouseId===value.warehouseId);
 const rawLineField=resources.materialIssues.fields.find(f=>f.name==='lines');
 const lineField={...rawLineField,fields:rawLineField.fields.map(f=>f.name==='lotId'?{...f,type:'stock-lot-readonly'}:f)};
 useEffect(()=>{onReadyChange(!!selected&&!!value.warehouseId&&!suggesting&&!!value.lines?.length&&(!selected.canAssign||value._staffIds?.length>0));},[selected,value.warehouseId,value._staffIds,value.lines,suggesting,onReadyChange]);
 useEffect(()=>{
  if(!selected||!value.warehouseId){setPreview(null);setSuggestionError('');setSuggesting(false);return;}
  const controller=new AbortController(),sourceId=selected.id,warehouseId=value.warehouseId;setPreview(null);setSuggesting(true);setSuggestionError('');
  api.get(`/v1/material-requests/${sourceId}/issue-suggestions`,{params:{warehouseId},signal:controller.signal}).then(r=>{
   if(controller.signal.aborted)return;const data=r.data.data;setPreview(data);
   const lines=data.lines.map(l=>({sourceLineId:l.sourceLineId,lotKind:l.lotKind,_balance:l.balanceId,lotId:l.lotId,locationId:l.locationId,unitId:l.unitId,quantity:l.quantity}));
   for(const shortage of data.shortages)if(!shortage.hasPartial){const source=selected.materials.find(m=>m.id===shortage.sourceLineId);lines.push({...empty(lineField.fields),sourceLineId:shortage.sourceLineId,unitId:source?.unitId||''});}
   if(latest.current.sourceId===sourceId&&latest.current.warehouseId===warehouseId)onChange({...latest.current,lines});
  }).catch(e=>{if(!controller.signal.aborted)setSuggestionError(e.response?.data?.error?.message||'Không tải được gợi ý lô. Hãy tải lại hoặc chọn lô thủ công.');}).finally(()=>{if(!controller.signal.aborted)setSuggesting(false);});
  return()=>controller.abort();
 },[selected?.id,value.warehouseId,suggestionRevision]);
 function select(id){const row=requests.find(r=>r.id===id);onChange({...value,sourceId:id,warehouseId:row?.warehouseId||'',_staffIds:row?.staff.map(s=>s.id)||[],_assignmentVersion:row?.version,_assignmentAllowed:row?.canAssign,lines:[empty(lineField.fields)]});}
 const fakeSource=selected?{id:selected.id,kind:'MATERIAL',family:'ISSUE',code:selected.code,lines:selected.materials.map(m=>({id:m.id,materialId:m.materialId,materialName:m.name,materialCode:m.code,quantityBase:m.quantityBase,unitId:m.unitId,unitName:m.unitName}))}:null;
 const sources=(lookups['/lookups/allocation-sources']||[]).filter(s=>s.id!==selected?.id||s.kind!=='MATERIAL');if(fakeSource)sources.push(fakeSource);
 const materialIds=new Set(selected?.materials.map(m=>m.materialId)||[]),balanceLookup=preview&&preview.requestId===selected?.id&&preview.warehouseId===value.warehouseId?[...(lookups['/inventory']||[]).filter(b=>String(b.warehouseId)!==value.warehouseId||!materialIds.has(String(b.itemId))),...preview.balances]:lookups['/inventory'];
 return <div className="space-y-4">
  <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">Lập và gửi phiếu sẽ giữ nguyên liệu theo phân bổ và chuyển cho nhân viên được chọn. Tồn thực tế được trừ khi nhân viên bấm Tiếp nhận phiếu.</p>
  <label className="block space-y-2 text-sm font-medium">Phiếu xưởng đã gửi *<select required disabled={loading} value={value.sourceId||''} onChange={e=>select(e.target.value)} className={style}><option value="">{loading?'Đang tải phiếu…':'Chọn phiếu yêu cầu'}</option>{requests.map(r=><option key={r.id} value={r.id}>{r.productName} — {r.workshopName} — {r.code}</option>)}</select></label>
  {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
  {!loading&&!requests.length&&<p className="text-sm text-amber-700">Chưa có phiếu xưởng đã gửi cần điều phối.</p>}
  {selected&&<>
   <p className="rounded-xl bg-blue-50 p-3 text-sm">Kế hoạch: {selected.planCode}{selected.notes&&<span className="block whitespace-pre-wrap">Ghi chú xưởng: {selected.notes}</span>}</p>
   <section className="rounded-xl border border-slate-200 p-4 space-y-3" aria-labelledby="requested-materials-heading">
    <div><h3 id="requested-materials-heading" className="text-sm font-semibold text-slate-900">Nguyên liệu xưởng yêu cầu</h3><p className="mt-1 text-xs text-slate-500">Toàn bộ vật tư và số lượng theo phiếu xưởng; có thể phân bổ thành nhiều dòng theo lô và vị trí.</p></div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-600"><th className="p-2">Mã nguyên liệu</th><th className="p-2">Tên nguyên liệu</th><th className="p-2">Số lượng yêu cầu</th><th className="p-2">Đơn vị</th></tr></thead><tbody>{selected.materials.map(m=><tr key={m.id} className="border-b border-slate-100 last:border-0"><td className="p-2">{m.code}</td><td className="p-2 font-medium">{m.name}</td><td className="p-2 tabular-nums">{formatQuantity(m.quantityBase)}</td><td className="p-2">{m.unitName}</td></tr>)}</tbody></table></div>
    {!selected.materials.length&&<p role="alert" className="text-sm text-amber-700">Phiếu này chưa có dòng nguyên liệu.</p>}
   </section>
   <label className="block space-y-2 text-sm font-medium">Kho xuất nguyên liệu *<select required disabled={assigned} value={value.warehouseId||''} onChange={e=>onChange({...value,warehouseId:e.target.value,_staffIds:[],lines:[empty(lineField.fields)]})} className={style}><option value="">Chọn kho</option>{options.warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
   <fieldset className="rounded-xl border border-slate-200 p-3 space-y-2"><legend className="px-1 text-sm font-medium">Nhân viên thực hiện *</legend>{staff.map(a=><label key={a.id} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={assigned} checked={(value._staffIds||[]).includes(a.id)} onChange={e=>onChange({...value,_staffIds:e.target.checked?[...(value._staffIds||[]),a.id]:(value._staffIds||[]).filter(id=>id!==a.id)})}/>{a.name.replace(/^demo\s+/i,'')}</label>)}{!staff.length&&<p className="text-xs text-slate-500">Chọn kho để xem nhân viên đủ quyền.</p>}{assigned&&<p className="text-xs text-slate-500">Phiếu đã điều phối, giữ nguyên nhân viên và kho đã giao.</p>}</fieldset>
   <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">Gợi ý lô theo FEFO tại thời điểm tải; có thể chỉnh trước khi lưu. Hệ thống kiểm tra lại khi xác nhận giữ tồn.</p><button type="button" disabled={!value.warehouseId||suggesting} onClick={()=>setSuggestionRevision(v=>v+1)} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50">Tải lại gợi ý</button></div>
   {suggesting&&<p role="status" className="text-sm text-slate-500">Đang gợi ý lô và vị trí theo nguyên liệu…</p>}
   {suggestionError&&<p role="alert" className="text-sm text-rose-700">{suggestionError}</p>}
   {preview?.shortages.length>0&&<div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><p className="font-medium">Chưa đủ tồn khả dụng cho:</p><ul className="mt-1 list-disc pl-5">{preview.shortages.map(s=><li key={s.sourceLineId}>{s.materialName}: còn thiếu {formatQuantity(s.remainingBase)} {s.unitName}</li>)}</ul></div>}
   {preview&&!preview.lines.length&&!preview.shortages.length&&<p className="text-sm text-slate-500">Các dòng nguyên liệu đã được cấp hoặc giữ đủ theo phiếu.</p>}
   <Fields fields={[lineField]} value={value} onChange={onChange} lookups={{...lookups,'/inventory':balanceLookup||[],'/lookups/allocation-sources':sources}}/>
  </>}
 </div>;
}
