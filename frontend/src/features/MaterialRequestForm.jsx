import {useEffect,useState} from 'react';
import api from '../services/apiClient';
import {formatQuantity} from '../utils/formatNumber';
const style='w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';
export default function MaterialRequestForm({value,onChange}){
 const[sources,setSources]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();api.get('/v1/lookups/plan-lines',{signal:controller.signal}).then(r=>setSources(r.data.data)).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.error?.message||'Không tải được phân công đã duyệt.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[]);
 const source=sources.find(s=>String(s.id)===String(value.planLineId));
 const suggestions=s=>s.demands.map(d=>({demandId:d.id,materialId:d.materialId,quantityBase:d.qtyRequired}));
 function choose(id){const selected=sources.find(s=>String(s.id)===id);onChange({...value,planLineId:id,lines:selected?suggestions(selected):[]});}
 return <div className="space-y-4">
  <label className="block space-y-2 text-sm font-medium">Phân công đủ điều kiện cấp nguyên liệu *<select required disabled={loading||!!error} className={style} value={value.planLineId||''} onChange={e=>choose(e.target.value)}><option value="">{loading?'Đang tải phân công…':'Chọn kế hoạch — thành phẩm — xưởng'}</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
  {!loading&&!error&&!sources.length&&<p className="text-sm text-amber-700">Chưa có phân công đủ điều kiện cấp nguyên liệu. Kế hoạch thiếu vật tư phải có đơn mua bổ sung đã được duyệt đủ lượng.</p>}
  {source&&<>
   <div className="rounded-xl bg-blue-50 p-4 space-y-1 text-sm text-blue-950"><p className="font-semibold">{source.productName}</p><p>Kế hoạch: {source.planCode}</p><p>Xưởng: {source.workshopName}</p><p>Sản lượng: {formatQuantity(source.qtyBase)} {source.unitName}</p><p>Lịch sản xuất: {source.startDate} → {source.endDate}</p></div>
   <div className="rounded-xl border border-slate-200 p-4 space-y-3"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-sm">Nguyên vật liệu theo kế hoạch</h3></div><p className="text-xs text-slate-500">Số lượng cố định theo kế hoạch đã duyệt. Không được sửa lượng hoặc thêm, xóa nguyên liệu. Lưu phiếu chưa trừ tồn kho.</p>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Nguyên liệu','Đơn vị','Nhu cầu','Đã yêu cầu','Còn chưa yêu cầu','Lượng theo kế hoạch'].map((s,i)=><th key={i} className="p-2 border-b border-slate-200">{s}</th>)}</tr></thead><tbody>{(value.lines||[]).map((line,i)=>{const demand=source.demands.find(d=>String(d.id)===String(line.demandId));return <tr key={line.demandId}><td className="p-2">{demand?.materialName}</td><td className="p-2">{demand?.unitName}</td><td className="p-2">{formatQuantity(demand?.qtyRequired)}</td><td className="p-2">{formatQuantity(demand?.requestedBase)}</td><td className="p-2">{formatQuantity(demand?.remainingBase)}</td><td className="p-2 min-w-32"><input readOnly aria-readonly="true" value={formatQuantity(line.quantityBase)} className={style+" bg-slate-50"}/></td></tr>;})}</tbody></table></div>
    {!value.lines?.length&&<p className="text-sm text-amber-700">Không có dòng vật tư để lưu. Nhu cầu có thể đã được yêu cầu hết; hãy kiểm tra các phiếu đã lập hoặc tải lại phân công.</p>}
   </div>
  </>}
  <label className="block space-y-2 text-sm font-medium">Ghi chú<textarea maxLength={2000} rows={3} value={value.notes||''} onChange={e=>onChange({...value,notes:e.target.value})} placeholder="Xưởng ghi thêm thông tin cần lưu ý…" className={style}/><span className="block text-xs font-normal text-slate-500">Tối đa 2000 ký tự.</span></label>
 </div>;
}
