import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, ClipboardList, AlertTriangle, Plus, ChevronRight } from 'lucide-react';
import { quickActionsData } from '../../data/homeMockData';
import { useAuth } from '../../auth/useAuth';
import { canAccessPath } from '../../auth/access';

const iconMap = {
  Download,
  Upload,
  ClipboardList,
  AlertTriangle,
};

const colorStyles = {
  blue: {
    bg: 'bg-blue-50/70 hover:bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
    badgeBg: 'bg-blue-600 text-white',
    title: 'text-blue-900',
    arrow: 'text-blue-400 group-hover:text-blue-600',
  },
  green: {
    bg: 'bg-emerald-50/70 hover:bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-600',
    badgeBg: 'bg-emerald-600 text-white',
    title: 'text-emerald-900',
    arrow: 'text-emerald-400 group-hover:text-emerald-600',
  },
  orange: {
    bg: 'bg-amber-50/70 hover:bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
    badgeBg: 'bg-amber-600 text-white',
    title: 'text-amber-900',
    arrow: 'text-amber-400 group-hover:text-amber-600',
  },
  red: {
    bg: 'bg-rose-50/70 hover:bg-rose-50 border-rose-100',
    iconBg: 'bg-rose-100 text-rose-600',
    badgeBg: 'bg-rose-600 text-white',
    title: 'text-rose-900',
    arrow: 'text-rose-400 group-hover:text-rose-600',
  },
};

function QuickActions({ actions = quickActionsData }) {
  const navigate = useNavigate();
  const { session } = useAuth();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.filter(action => canAccessPath(session, action.path)).map((action) => {
        const IconComponent = iconMap[action.iconName] || Download;
        const style = colorStyles[action.colorScheme] || colorStyles.blue;

        return (
          <div
            key={action.id}
            onClick={() => navigate(action.path)}
            className={`group flex items-center justify-between p-4 rounded-2xl border ${style.bg} transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-xl ${style.iconBg} flex items-center justify-center font-bold`}>
                  <IconComponent className="w-6 h-6 stroke-[2]" />
                </div>
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${style.badgeBg} flex items-center justify-center ring-2 ring-white text-[10px]`}>
                  <Plus className="w-3 h-3 stroke-[3]" />
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <h3 className={`text-sm font-bold truncate ${style.title}`}>
                  {action.title}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {action.subtitle}
                </p>
              </div>
            </div>

            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${style.arrow}`} />
          </div>
        );
      })}
    </div>
  );
}

export default QuickActions;
