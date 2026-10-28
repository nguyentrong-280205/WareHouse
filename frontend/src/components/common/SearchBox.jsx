import React from 'react';
import { Search } from 'lucide-react';

function SearchBox({
  value = '',
  onChange,
  placeholder = 'Tìm kiếm lệnh sản xuất, phiếu kho, mã hàng, lô hàng...',
  className = '',
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
      />
    </div>
  );
}

export default SearchBox;
