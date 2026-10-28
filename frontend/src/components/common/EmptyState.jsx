import React from 'react';
import { PackageOpen } from 'lucide-react';

function EmptyState({
  title = 'Không tìm thấy dữ liệu',
  description = 'Hiện tại chưa có dữ liệu để hiển thị.',
  icon: Icon = PackageOpen,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

export default EmptyState;
