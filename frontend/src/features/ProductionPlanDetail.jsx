import {formatQuantity} from '../utils/formatNumber';

function PlanMaterials({line}){
 const approved=!!line.materialDemands?.length;
 const rows=approved?line.materialDemands:line.materials||[];
 const columns=[['materialName','Nguyên vật liệu'],['unitName','Đơn vị'],[approved?'requiredBase':'quantityBase','Số lượng cần'],...(approved?[
  ['issuedBase','Đã cấp'],['heldForDemandBase','Đang giữ'],['assignedFreeBase','Khả dụng dự kiến'],['shortageBase','Còn thiếu hiện tại'],['assignedFreeSnapshotBase','Tồn dự kiến lúc duyệt'],['shortageSnapshotBase','Thiếu lúc duyệt'],
 ]:[])];
 return <section className="space-y-2">{approved&&<p className="text-xs text-slate-500">Tồn dự kiến dùng để lập kế hoạch; việc giữ tồn thực tế được thực hiện khi xác nhận điều phối xuất.</p>}<div className="overflow-x-auto"><table className="w-full text-left"><caption className="text-left font-semibold mb-2">Nguyên vật liệu</caption><thead className="text-slate-500"><tr>{columns.map(([key,label])=><th key={key} className="p-2 whitespace-nowrap">{label}</th>)}</tr></thead><tbody>{rows.map(m=><tr key={m.id||m.materialId} className="border-t border-slate-100">{columns.map(([key],i)=><td key={key} className={'p-2 '+(i>1?'text-right tabular-nums whitespace-nowrap':'')}>{i>1?formatQuantity(m[key]):m[key]||'—'}</td>)}</tr>)}</tbody></table></div></section>;
}

export default function ProductionPlanDetail({record}){
 return <div className="space-y-5 text-sm">
  {record.workshopScoped&&<p className="rounded-xl bg-blue-50 p-3 text-blue-900">Chỉ hiển thị phần được phân công cho xưởng của bạn. Điều kiện đủ nguyên vật liệu được kiểm tra trên toàn bộ kế hoạch.</p>}
  <dl className="grid sm:grid-cols-2 gap-4">
   {[['Đơn hàng',record.orderCode],['Bắt đầu',record.startDate],['Kết thúc',record.endDate]].map(([label,text])=><div key={label}><dt className="font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words">{text||'Chưa có thông tin'}</dd></div>)}
  </dl>
  <section className="space-y-3"><h3 className="font-semibold text-slate-500">Phân công sản xuất</h3>
   {(record.lines||[]).map((line,index)=><article key={line.id} className="rounded-xl border border-slate-200 p-4 space-y-4">
    <h4 className="font-semibold">Phân công {index+1} — {line.productName}</h4>
    <dl className="grid sm:grid-cols-2 gap-3">
     <div><dt className="text-slate-500">Dòng đơn hàng</dt><dd>Dòng {line.orderLineNumber} — {line.productName}</dd></div>
     <div><dt className="text-slate-500">Xưởng sản xuất</dt><dd>{line.workshopName}</dd></div>
     <div><dt className="text-slate-500">Phiên bản định mức</dt><dd>Định mức {line.productName} — phiên bản {line.bomRevision}{line.bomIsPlanOverride&&<span> (riêng kế hoạch, từ định mức gợi ý phiên bản {line.sourceBomRevision})</span>}</dd></div>
     <div><dt className="text-slate-500">Sản lượng cơ sở</dt><dd>{formatQuantity(line.quantityBase)} {line.baseUnitName}</dd></div>
     <div><dt className="text-slate-500">Bắt đầu phân công</dt><dd>{line.startDate}</dd></div>
     <div><dt className="text-slate-500">Kết thúc phân công</dt><dd>{line.endDate}</dd></div>
    </dl>
    <PlanMaterials line={line}/>
   </article>)}
  </section>
 </div>;
}
