import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Bell} from 'lucide-react';
import api from '../../services/apiClient';

export default function WorkshopNoticeBell(){
 const[open,setOpen]=useState(false),[plans,setPlans]=useState([]),[total,setTotal]=useState(0),[error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();let pending=false;
  async function load(){if(pending||document.hidden||controller.signal.aborted)return;pending=true;try{const r=await api.get('/v1/production-plans/receiving-queue',{params:{audience:'WORKSHOP',page:1,pageSize:5},signal:controller.signal});if(!controller.signal.aborted){setPlans(r.data.data);setTotal(r.data.meta.total);setError('');}}catch(e){if(!controller.signal.aborted)setError(e.response?.data?.error?.message||'Không tải được kế hoạch xưởng tiếp nhận.');}finally{pending=false;}}
  void load();
  window.addEventListener('focus',load);document.addEventListener('visibilitychange',load);window.addEventListener('warehouse:workshop-notices-refresh',load);
  return()=>{controller.abort();window.removeEventListener('focus',load);document.removeEventListener('visibilitychange',load);window.removeEventListener('warehouse:workshop-notices-refresh',load);};
 },[]);
 return <div className="relative"><button type="button" aria-label="Kế hoạch xưởng tiếp nhận" aria-expanded={open} onClick={()=>{if(!open)window.dispatchEvent(new Event('warehouse:workshop-notices-refresh'));setOpen(v=>!v);}} className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100"><Bell className="w-5 h-5"/>{total>0&&<span className="absolute top-0 right-0 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">{total>99?'99+':total}</span>}</button>
  {open&&<div className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-2xl border border-slate-200 bg-white shadow-xl z-50 p-4 space-y-3 text-sm"><p className="font-semibold">Kế hoạch đã duyệt cho xưởng</p><p className="text-xs text-slate-500">{total} kế hoạch đủ vật tư trong phạm vi được cấp. Đây là số phiếu tiếp nhận, không phải số thông báo chưa đọc.</p>{error&&<p role="alert" className="text-rose-700">{error}</p>}{!error&&!plans.length&&<p className="text-slate-500">Chưa có kế hoạch đủ điều kiện tiếp nhận.</p>}{plans.map(plan=><Link key={plan.id} to="/workshop-assignments" onClick={()=>setOpen(false)} className="block rounded-xl bg-blue-50 p-3 text-blue-900"><span className="block font-medium">{plan.lines.map(l=>l.productName).join('; ')}</span><span className="block text-xs break-words mt-1">{plan.code}</span></Link>)}<Link to="/workshop-assignments" onClick={()=>setOpen(false)} className="block font-medium text-blue-600">Mở danh sách xưởng tiếp nhận</Link></div>}
 </div>;
}
