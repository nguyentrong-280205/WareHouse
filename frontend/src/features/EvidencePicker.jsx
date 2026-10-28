import {useState} from 'react';
import api from '../services/apiClient';
import {useAuth} from '../auth/useAuth';
export default function EvidencePicker({value=[],onChange,stocktakeId,issueId,warehouseId}){
 const{session}=useAuth(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function upload(event){const file=event.target.files?.[0];if(!file)return;setError('');if(file.size>65536){setError('Chọn PNG/JPEG/PDF không quá 64 KiB.');return;}setBusy(true);try{
  const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});
  const r=await api.post('/v1/evidence',{warehouseId,stocktakeId,issueId,fileName:file.name,mediaType:file.type,contentBase64:encoded},{headers:{'X-CSRF-Token':session.csrfToken,'Idempotency-Key':crypto.randomUUID()}});onChange([...value,r.data.id]);
 }catch(e){setError(e.response?.data?.error?.message||'Không tải được bằng chứng.');}finally{setBusy(false);event.target.value='';}}
 return <div className="space-y-2"><input aria-label="Tải bằng chứng" type="file" accept="image/png,image/jpeg,application/pdf" disabled={busy||!warehouseId||!stocktakeId&&!issueId} onChange={upload} className="block text-sm max-w-full"/><p className="text-xs text-slate-500">{busy?'Đang tải…':'PNG/JPEG/PDF, tối đa 64 KiB mỗi tệp.'}</p><div className="flex gap-2 flex-wrap">{value.map(id=><span key={id} className="text-xs rounded-lg bg-blue-50 text-blue-700 px-2 py-1">Bằng chứng #{id}</span>)}</div>{error&&<p role="alert" className="text-sm text-rose-600">{error}</p>}</div>;
}
