import {useCallback,useEffect,useState} from 'react';
import api from '../services/apiClient';
import ActionButton from '../components/ActionButton';
import ProductionPlanDetail from './ProductionPlanDetail';
import RecordSummary from './RecordSummary';
import PurchaseRequirementDetail from './PurchaseRequirementDetail';
import {formatQuantity} from '../utils/formatNumber';

export default function PlanInbox({audience,onPurchase}){
 const[data,setData]=useState([]),[detail,setDetail]=useState(null),[error,setError]=useState(''),[page,setPage]=useState(1),[total,setTotal]=useState(0),[loading,setLoading]=useState(false);
 const load=useCallback(async()=>{setLoading(true);try{const r=await api.get('/v1/production-plans/receiving-queue',{params:{audience,page,pageSize:10}});setData(r.data.data);setTotal(r.data.meta.total);setDetail(null);setError('');}catch(e){setError(e.response?.data?.error?.message||'Không tải được danh sách tiếp nhận.');}finally{setLoading(false);}},[audience,page]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{
  if(detail)return;
  const refresh=()=>{if(!document.hidden)void load();};
  window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
  return()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
 },[load,detail]);
 const title={PURCHASING:'Yêu cầu mua nguyên liệu thiếu từ kế hoạch đã duyệt',WORKSHOP:'Kế hoạch đủ điều kiện yêu cầu cấp nguyên liệu — xưởng tiếp nhận',PLANNING:'Kế hoạch bị từ chối — phản hồi từ ban giám đốc'}[audience];
 return <section className="rounded-2xl border border-blue-100 bg-white p-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><h2 className="font-semibold">{title}</h2><ActionButton disabled={loading} onClick={()=>void load()}>Tải lại</ActionButton></div>
  <p className="text-xs text-slate-500">{audience==='PURCHASING'?'Nhận danh sách nguyên vật liệu thiếu để lập đơn mua, không phụ thuộc phạm vi xưởng.':'Chỉ hiển thị phiếu trong phạm vi xưởng được cấp. Với kế hoạch thiếu nguyên liệu, phải có đơn mua bổ sung đã được duyệt đủ lượng; xuất kho vẫn kiểm tồn thực tế.'}</p>
  {error&&<p role="alert" className="text-rose-700">{error}</p>}
  {!loading&&!data.length&&<p className="text-slate-500">Chưa có phiếu thuộc phạm vi của bạn cần tiếp nhận.</p>}
  {data.map(plan=><div key={plan.id} className="border-t border-slate-100 pt-3 space-y-2"><p className="font-medium break-words">{plan.code}</p>{audience!=='PURCHASING'&&<p>{plan.lines.map(l=>l.productName).join('; ')}</p>}{audience==='PLANNING'?<p className="text-rose-700 whitespace-pre-wrap">Lý do từ chối: {plan.rejectionReason}</p>:audience==='PURCHASING'&&<ul className="list-disc pl-5">{plan.materialShortages.map(m=><li key={m.materialId}>{m.materialName}: thiếu {formatQuantity(m.shortageBase)} {m.unitName}</li>)}</ul>}<div className="flex gap-2"><ActionButton onClick={()=>setDetail(plan)}>Chi tiết</ActionButton>{audience==='PURCHASING'&&onPurchase&&<ActionButton variant="primary" disabled={!plan.lines.some(l=>l.materialDemands.some(m=>/[1-9]/.test(m.purchaseRequiredBase||'')))} onClick={()=>onPurchase(plan)}>Lập đơn mua phần còn thiếu</ActionButton>}</div></div>)}
  {total>10&&<div className="flex gap-3"><ActionButton disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}>Trước</ActionButton><span>Trang {page}</span><ActionButton disabled={page*10>=total||loading} onClick={()=>setPage(p=>p+1)}>Sau</ActionButton></div>}
  {detail&&<div className="fixed inset-0 z-[60] overflow-auto bg-slate-900/40 p-6"><div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 space-y-4"><div className="flex justify-between gap-3"><h3 className="font-semibold">{audience==='PURCHASING'?'Chi tiết yêu cầu nguyên vật liệu':'Chi tiết kế hoạch tiếp nhận'}</h3><ActionButton onClick={()=>setDetail(null)}>Đóng</ActionButton></div>{audience==='PURCHASING'?<PurchaseRequirementDetail record={detail}/>:<><RecordSummary kind="plans" record={detail}/><ProductionPlanDetail record={detail}/></>}</div></div>}
 </section>;
}
