import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

function StockStructureChart({ data = [],totalStockFormatted='—',unitLabel='' }) {

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between h-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Cơ cấu tồn kho
          </h2>
        </div>
      </div>

      {/* Chart Body */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1 my-auto">
        {/* Donut Chart Canvas with Center Text */}
        <div className="sm:col-span-6 relative h-52 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={84}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(_val,_name,item) => item.payload.formattedValue}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-base font-black text-slate-900 leading-tight">
              {totalStockFormatted}
            </span>
            <span className="text-xs font-bold text-blue-600">{unitLabel}</span>
            <span className="text-[10px] text-slate-400 font-medium">
              Tổng cộng
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="sm:col-span-6 space-y-3 pl-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {item.name}
                </span>
                <span className="text-xs text-slate-500">
                  {item.formattedValue}{' '}
                  <span className="font-semibold text-slate-600">
                    ({item.percentage}%)
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StockStructureChart;
