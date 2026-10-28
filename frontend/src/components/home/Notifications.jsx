import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowRight, ChevronRight, AlertTriangle, Clock, Calendar } from 'lucide-react';
import Badge from '../common/Badge';

const badgeTypeStyles = {
  danger: {
    badge: 'danger',
    bg: 'bg-rose-50/70 hover:bg-rose-50 border-rose-100',
    iconBg: 'bg-rose-100 text-rose-600',
    icon: AlertTriangle,
  },
  warning: {
    badge: 'warning',
    bg: 'bg-amber-50/70 hover:bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
    icon: Clock,
  },
  info: {
    badge: 'info',
    bg: 'bg-blue-50/70 hover:bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
    icon: Calendar,
  },
};

function Notifications({ items = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Thông báo
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
      <div className="space-y-3">
        {items.map((item) => {
          const style = badgeTypeStyles[item.badgeType] || badgeTypeStyles.info;
          const IconComp = style.icon;

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border ${style.bg} transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer group`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                  <IconComp className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={style.badge}>{item.badge}</Badge>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  {item.time}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Notifications;
