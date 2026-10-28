import React from 'react';

function Table({ columns = [], data = [], renderRow, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200/80 ${className}`}>
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data.length > 0 ? (
            data.map((item, index) => renderRow(item, index))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-slate-400">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
