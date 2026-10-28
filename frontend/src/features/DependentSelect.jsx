import {useEffect,useState} from 'react';
import api from '../services/apiClient';
export default function DependentSelect({productId,value,onChange,className}){
  const [items,setItems]=useState([]),[error,setError]=useState('');
  useEffect(()=>{const controller=new AbortController();if(productId)api.get('/v1/products/'+productId+'/bom-versions',{signal:controller.signal}).then(r=>{setItems(r.data.data);setError('');}).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.error?.message||'Không tải được định mức.');});return()=>controller.abort();},[productId]);
  return <><select required value={value||''} onChange={e=>onChange(e.target.value)} className={className}><option value="">Chọn phiên bản định mức</option>{productId&&items.filter(i=>String(i.productId)===String(productId)).map(i=><option key={i.id} value={i.id}>v{i.revision} — {i.effectiveFrom.slice(0,10)}</option>)}</select>{error&&<span role="alert" className="text-xs text-rose-600">{error}</span>}</>;
}
