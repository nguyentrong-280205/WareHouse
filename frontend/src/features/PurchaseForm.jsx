import {useEffect,useMemo,useRef} from 'react';
import {Fields} from './ResourcePage';
import {resources} from './resources';
import {moneyText} from './money';
function scaled(value){if(!/^\d{1,14}(\.\d{1,6})?$/.test(String(value??'')))return null;const[w,f='']=String(value).split('.');return BigInt(w)*1000000n+BigInt(f.padEnd(6,'0'));}
const quoteFor=(supplier,line)=>supplier?.quotes?.find(q=>q.materialId===line.materialId&&q.unitId===line.unitId);
export default function PurchaseForm({value,onChange,lookups}){
 const lines=value.lines||[],materials=lookups['/lookups/materials']||[];
 const ready=lines.length>0&&lines.every(l=>l.materialId&&l.unitId&&materials.some(m=>m.id===l.materialId&&m.baseUnitId===l.unitId));
 const unitsSignature=JSON.stringify(lines.map(l=>[l.materialId,l.unitId]));
 useEffect(()=>{
  const normalized=lines.map(l=>{const material=materials.find(m=>m.id===l.materialId);return material&&l.unitId!==material.baseUnitId?{...l,unitId:material.baseUnitId}:l;});
  if(normalized.some((l,i)=>l!==lines[i]))onChange({...value,lines:normalized});
 },[unitsSignature,materials]);
 const candidates=useMemo(()=>ready?(lookups['/lookups/suppliers']||[]).filter(s=>lines.every(l=>quoteFor(s,l))).map(s=>({...s,total:lines.reduce((sum,l)=>sum+(scaled(l.quantity)||0n)*(scaled(quoteFor(s,l).unitPrice)||0n),0n)})).sort((a,b)=>a.total<b.total?-1:a.total>b.total?1:a.code.localeCompare(b.code)):[],[lookups,lines,ready]);
 const signature=JSON.stringify([value.supplierId,lines.map(l=>[l.demandId,l.materialId,l.unitId])]),previous=useRef(null);
 useEffect(()=>{
  if(!ready||!candidates.length||previous.current===signature)return;
  const chosen=candidates.find(s=>s.id===value.supplierId)||candidates[0];
  const old=previous.current?JSON.parse(previous.current):null;
  const nextLines=lines.map((l,i)=>{const unchanged=old?.[0]===chosen.id&&JSON.stringify(old[1][i])===JSON.stringify([l.demandId,l.materialId,l.unitId]);return unchanged?l:{...l,unitPrice:quoteFor(chosen,l).unitPrice};});
  previous.current=JSON.stringify([chosen.id,nextLines.map(l=>[l.demandId,l.materialId,l.unitId])]);
  onChange({...value,supplierId:chosen.id,lines:nextLines});
 },[signature,candidates,ready]);
 const sources=lookups['/lookups/approved-plans']||[];
 function change(next){
  const source=sources.find(s=>s.id===next.planId),changedSource=next.planId!==value.planId;
  const nextLines=(next.lines||[]).map((l,i)=>{const demand=source?.demands.find(d=>d.id===l.demandId);return demand&&(changedSource||l.demandId!==lines[i]?.demandId)?{...l,materialId:demand.materialId,unitId:demand.unitId,quantity:demand.purchaseRequiredBase??demand.shortageBase,unitPrice:''}:changedSource?{...l,demandId:'',materialId:'',unitId:'',quantity:'',unitPrice:''}:l;});
  const fixedUnits=nextLines.map(l=>{const material=materials.find(m=>m.id===l.materialId);return material?{...l,unitId:material.baseUnitId}:l.materialId?l:{...l,unitId:''};});
  onChange({...next,lines:fixedUnits});
 }
 const total=lines.reduce((sum,l)=>{const qty=scaled(l.quantity),price=scaled(l.unitPrice);return sum===null||qty===null||price===null?null:sum+(qty*price+500000000000n)/1000000000000n;},0n);
 return <div className="space-y-4">
  {ready&&<p className={'rounded-xl p-3 text-sm '+(candidates.length?'bg-blue-50 text-blue-900':'bg-amber-50 text-amber-900')}>{candidates.length?<>Gợi ý: <strong>{candidates[0].name}</strong> — cung cấp đủ các vật tư đang chọn, tổng giá tham khảo thấp nhất. Bạn có thể đổi nhà cung cấp hoặc chỉnh đơn giá.</>:'Chưa có nhà cung cấp bao phủ toàn bộ các dòng. Hãy tách đơn theo nhóm vật tư hoặc cập nhật báo giá phù hợp.'}<span className="block text-xs mt-1">Nhà cung cấp và giá mẫu phục vụ đồ án, không phải báo giá thương mại xác nhận.</span></p>}
  <Fields fields={resources.purchases.fields} value={value} onChange={change} lookups={{...lookups,'/lookups/suppliers':ready?candidates:lookups['/lookups/suppliers']}}/>
  <p className="text-right text-sm font-semibold">Tổng tiền tạm tính: {total===null?'Chưa đủ số lượng/đơn giá':moneyText(total.toString())+' VND'}</p>
 </div>;
}
