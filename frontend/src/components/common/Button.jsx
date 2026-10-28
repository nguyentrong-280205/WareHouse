import React from 'react';

function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}) {
  const baseStyle =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white',
    ghost: 'hover:bg-slate-100 text-slate-600',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}

export default Button;
