import React from 'react';

function Badge({ children, variant = 'info', className = '' }) {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    danger: 'bg-rose-50 text-rose-600 border-rose-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const style = variantStyles[variant] || variantStyles.info;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
