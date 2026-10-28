import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp, ChevronDown } from 'lucide-react';

function InventoryTrendChart({ data = [],unitLabel='' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Tồn theo sổ 7 ngày gần đây
          </h2>
        </div>

        {/* Filter dropdown pill */}
        <div className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-200/80 transition-colors">
          <span>Tổng tồn kho</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Line Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => `${val / 1000}k`}
            />
            <Tooltip
              formatter={(_val,_name,item) => `${item.payload.stockRaw} ${unitLabel}`}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                border: 'none',
              }}
            />
            <Line
              type="monotone"
              dataKey="stock"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ fill: '#2563eb', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#1d4ed8' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default InventoryTrendChart;
