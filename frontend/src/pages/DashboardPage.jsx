import {formatQuantity} from '../utils/formatNumber';
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import KPICard from '../components/dashboard/KPICard';
import InventoryChart from '../components/dashboard/InventoryChart';
import StockStructureChart from '../components/dashboard/StockStructureChart';
import InventoryTrendChart from '../components/dashboard/InventoryTrendChart';
import LowStockTable from '../components/dashboard/LowStockTable';
import ExpiringLotsTable from '../components/dashboard/ExpiringLotsTable';
import WarehouseActivity from '../components/dashboard/WarehouseActivity';
import WarehouseCapacity from '../components/dashboard/WarehouseCapacity';
import {useDashboardData,quantityInt,quantityText,scaledInt,vnDate,utcDate,activityRows} from '../features/live-overview';

function DashboardPage() {
  const live=useDashboardData(),[unitId,setUnitId]=useState(''),today=vnDate();
  const unitLabel=live.units.find(u=>String(u.id)===unitId)?.name||'';
  const inventory=live.inventory.filter(r=>r.unitId===unitId),movements=live.movements.filter(r=>r.unitId===unitId);
  const total=inventory.reduce((n,r)=>n+quantityInt(r.onHand),0n),buckets=new Map();for(const r of inventory)buckets.set(r.qualityBucket,(buckets.get(r.qualityBucket)||0n)+quantityInt(r.onHand));
  const bucketNames={DAT:'Đạt QC',QUARANTINE:'Cách ly',FAILED:'Không đạt',EXPIRED:'Hết hạn'},colors=['#2563eb','#f59e0b','#f43f5e','#64748b'];
  const structure=[...buckets].map(([kind,n],i)=>({name:bucketNames[kind],value:Number(quantityText(n)),formattedValue:formatQuantity(quantityText(n))+' '+unitLabel,percentage:total?String(Number(n*10000n/total)/100):'0',color:colors[i]}));
  const dates=Array.from({length:7},(_,i)=>new Date(Date.parse(today+'T00:00:00Z')-(6-i)*86400000).toISOString().slice(0,10));
  const dayOf=r=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(utcDate(r.createdAt));
  const inOut=unitId?dates.map(day=>{const rows=movements.filter(r=>dayOf(r)===day),up=rows.reduce((n,r)=>n+(quantityInt(r.quantityDelta)>0n?quantityInt(r.quantityDelta):0n),0n),down=rows.reduce((n,r)=>n+(quantityInt(r.quantityDelta)<0n?-quantityInt(r.quantityDelta):0n),0n);return{date:day.slice(5),importQty:Number(quantityText(up)),exportQty:Number(quantityText(down)),importRaw:formatQuantity(quantityText(up)),exportRaw:formatQuantity(quantityText(down))};}):[];
  let balance=total;const trend=[];if(unitId)for(const day of [...dates].reverse()){trend.unshift({month:day.slice(5),stock:Number(quantityText(balance)),stockRaw:formatQuantity(quantityText(balance))});balance-=movements.filter(r=>dayOf(r)===day).reduce((n,r)=>n+quantityInt(r.quantityDelta),0n);}
  const low=live.alerts.filter(r=>r.type==='LOW_STOCK'),expiry=live.alerts.filter(r=>['NEAR_EXPIRY','EXPIRED'].includes(r.type));
  const countToday=field=>new Set(live.movements.filter(r=>r[field]&&dayOf(r)===today).map(r=>r[field])).size;
  const kpiCardsData=[{id:'items',title:'Mặt hàng có tồn',value:new Set(live.inventory.filter(r=>quantityInt(r.onHand)>0n).map(r=>r.itemKind+':'+r.itemId)).size,iconName:'Boxes',colorScheme:'blue'},{id:'receipts',title:'Phiếu nhập hôm nay',value:countToday('receiptId'),iconName:'Download',colorScheme:'green'},{id:'issues',title:'Phiếu xuất hôm nay',value:countToday('issueId'),iconName:'Upload',colorScheme:'orange'},{id:'expiry',title:'Cảnh báo hạn sử dụng',value:expiry.length,iconName:'Clock',colorScheme:'red'},{id:'low',title:'Cảnh báo tồn thấp',value:low.length,iconName:'AlertTriangle',colorScheme:'amber'}].map(c=>({...c,value:live.loading?'…':live.error?'—':String(c.value)}));
  const capacity=live.warehouses.map(w=>({id:w.id,title:w.name,used:w.occupiedCapacity,total:w.capacity,unit:w.capacityUnitCode,percentage:quantityInt(w.capacity)>0n?Number(scaledInt(w.occupiedCapacity,15)*10000n/(quantityInt(w.capacity)*1000000000n))/100:0,iconName:'Warehouse',color:'blue'}));

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Theo dõi tình hình tồn kho và hoạt động kho theo thời gian thực"
    >
      <div className="space-y-6">
        {live.error&&<p role="alert" className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl">{live.error}</p>}
        {live.configurationRequired.length>0&&<p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-xl">{live.configurationRequired.length} mặt hàng/kho chưa đặt ngưỡng cảnh báo.</p>}
        {/* Top bar filter right aligned */}
        <div className="flex justify-end -mt-2">
          <div className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs text-xs font-semibold text-slate-700 hover:border-slate-300 transition-colors cursor-pointer">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{dates[0]} — {today} · ngày Việt Nam</span><select aria-label="Đơn vị của biểu đồ" value={unitId} onChange={e=>setUnitId(e.target.value)} className="bg-white outline-none"><option value="">Chọn đơn vị để xem biểu đồ</option>{live.units.filter(u=>u.dimension!=='CAPACITY_VOLUME').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
          </div>
        </div>

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiCardsData.map((card) => (
            <KPICard key={card.id} {...card} />
          ))}
        </div>

        {/* 3 Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 min-h-[340px]">
            <InventoryChart data={inOut} unitLabel={unitLabel}/>
          </div>
          <div className="lg:col-span-3 min-h-[340px]">
            <StockStructureChart data={structure} totalStockFormatted={unitId?formatQuantity(quantityText(total)):'—'} unitLabel={unitLabel}/>
          </div>
          <div className="lg:col-span-4 min-h-[340px]">
            <InventoryTrendChart data={trend} unitLabel={unitLabel}/>
          </div>
        </div>

        {/* 2 Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LowStockTable data={low.map(r=>({code:(r.itemKind==='MATERIAL'?'NL':'TP')+' #'+r.itemId,name:'Kho #'+r.warehouseId,currentStock:r.availableBase,minStock:r.thresholdBase,status:'Dưới ngưỡng'}))}/>
          <ExpiringLotsTable data={expiry.map(r=>({code:'#'+r.lotId,item:(r.itemKind==='MATERIAL'?'NL':'TP')+' #'+r.itemId,expiryDate:r.expiresOn,daysLeft:r.daysRemaining,status:r.type==='EXPIRED'?'Đã hết hạn':'Sắp hết hạn'}))}/>
        </div>

        {/* Bottom Row: Activity + Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <WarehouseActivity activities={activityRows(live.movements)}/>
          </div>
          <div className="lg:col-span-5">
            <WarehouseCapacity data={capacity}/>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default DashboardPage;
