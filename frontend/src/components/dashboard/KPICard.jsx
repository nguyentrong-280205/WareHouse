import React from 'react';
import { Boxes, Download, Upload, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const iconMap = {
  Boxes,
  Download,
  Upload,
  Clock,
  AlertTriangle,
};

const colorStyles = {
  blue: {
    iconBg: 'bg-blue-50 text-blue-600',
    accentBorder: 'hover:border-blue-200',
  },
  green: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    accentBorder: 'hover:border-emerald-200',
  },
  orange: {
    iconBg: 'bg-amber-50 text-amber-600',
    accentBorder: 'hover:border-amber-200',
  },
  red: {
    iconBg: 'bg-rose-50 text-rose-600',
    accentBorder: 'hover:border-rose-200',
  },
  amber: {
    iconBg: 'bg-orange-50 text-orange-600',
    accentBorder: 'hover:border-orange-200',
  },
};

function KPICard({ title, value, trend, trendText, trendType = 'positive', iconName, colorScheme = 'blue' }) {
  const IconComponent = iconMap[iconName] || Boxes;
  const style = colorStyles[colorScheme] || colorStyles.blue;
  const isPositive = trendType === 'positive';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-all duration-200 ${style.accentBorder} flex flex-col justify-between`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-500 truncate">
            {title}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            {value}
          </div>
        </div>

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
          <IconComponent className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {trend&&<div className="flex items-center gap-1.5 mt-3 text-[11px]">
        <span
          className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
            isPositive
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : 'bg-rose-50 text-rose-600 border border-rose-100'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3 stroke-[2.5] mr-0.5" />
          ) : (
            <ArrowUpRight className="w-3 h-3 stroke-[2.5] mr-0.5" />
          )}
          {trend}
        </span>
        <span className="text-slate-400 font-medium truncate">{trendText}</span>
      </div>}
    </div>
  );
}

export default KPICard;
