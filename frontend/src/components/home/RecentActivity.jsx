import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

const iconMap = {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
};

const badgeStyles = {
  blue: 'bg-blue-100 text-blue-600',
  orange: 'bg-amber-100 text-amber-600',
  green: 'bg-emerald-100 text-emerald-600',
  red: 'bg-rose-100 text-rose-600',
};

function RecentActivity({ activities = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Hoạt động gần đây
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
          const IconComponent = iconMap[act.iconName] || FileText;
          const iconStyle = badgeStyles[act.badgeColor] || badgeStyles.blue;

          return (
            <div
              key={act.id}
              className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5 hover:bg-slate-50/60 p-2 rounded-xl transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconStyle} mt-0.5`}>
                <IconComponent className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    <span className="text-blue-600 font-bold">{act.code}</span>{' '}
                    <span>{act.actionText}</span>
                  </p>
                  <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                    {act.time}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {act.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentActivity;
