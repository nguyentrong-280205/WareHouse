import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ArrowUpDown } from 'lucide-react';

function CustomTooltip({ active, payload, label,unitLabel }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 text-white p-3 rounded-xl text-xs shadow-lg backdrop-blur-xs space-y-1">
        <p className="font-bold text-slate-200">Ngày {label}</p>
        <p className="text-blue-400">
          Tăng sổ: {payload[0]?.payload?.importRaw} {unitLabel}
        </p>
        <p className="text-emerald-400">
          Giảm sổ: {payload[1]?.payload?.exportRaw} {unitLabel}
        </p>
      </div>
    );
  }
  return null;
}

function InventoryChart({ data = [],unitLabel='' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Biến động sổ kho 7 ngày gần đây
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
            <span className="text-slate-600">Tăng sổ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            <span className="text-slate-600">Giảm sổ</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => `${val / 1000}k`}
            />
            <Tooltip content={<CustomTooltip unitLabel={unitLabel}/>} />
            <Bar dataKey="importQty" name="Nhập kho" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="exportQty" name="Xuất kho" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default InventoryChart;
