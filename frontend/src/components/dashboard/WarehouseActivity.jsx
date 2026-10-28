import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Download, Upload, ShieldCheck, ClipboardCheck, PackageCheck, User, ArrowRight } from 'lucide-react';

const iconMap = {
  Download,
  Upload,
  ShieldCheck,
  ClipboardCheck,
  PackageCheck,
};

const badgeStyles = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-amber-100 text-amber-600',
};

function WarehouseActivity({ activities = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Hoạt động kho hôm nay
          </h2>
        </div>
        <Link
          to="/reports"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {activities.map((act) => {
          const IconComponent = iconMap[act.iconName] || Download;
          const style = badgeStyles[act.colorScheme] || badgeStyles.blue;

          return (
            <div
              key={act.id}
              className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style}`}>
                  <IconComponent className="w-4 h-4 stroke-[2]" />
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                      {act.code}
                    </span>
                    <span className="text-xs font-medium text-slate-700 truncate">
                      {act.description}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0 text-slate-500 font-medium">
                <span className="hidden sm:inline">{act.time}</span>
                <div className="flex items-center gap-1 text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{act.user}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WarehouseActivity;
