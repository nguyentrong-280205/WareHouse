import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Warehouse,
  Building2,
  Settings,
  ShieldCheck,
  Package,
  BarChart2,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';
import { quickAccessData } from '../../data/homeMockData';
import { useAuth } from '../../auth/useAuth';
import { canAccessPath } from '../../auth/access';

const iconMap = {
  Warehouse,
  Building2,
  Settings,
  ShieldCheck,
  Package,
  BarChart2,
};

function QuickAccess({ items = quickAccessData }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const visibleItems = items.filter(item => canAccessPath(session, item.path));
  if (!visibleItems.length) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Truy cập nhanh
          </h2>
        </div>
        {canAccessPath(session, '/reports') && <Link
          to="/reports"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>}
      </div>

      {/* Grid 3 cols x 2 rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleItems.map((item) => {
          const IconComponent = iconMap[item.iconName] || Warehouse;

          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="group bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  <IconComponent className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuickAccess;
