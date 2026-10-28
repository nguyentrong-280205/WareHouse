import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';
import Table from '../common/Table';

function ExpiringLotsTable({ data = [] }) {
  const columns = [
    { header: 'Mã lô', className: 'w-32 font-bold text-blue-600' },
    { header: 'Mặt hàng', className: 'font-bold text-slate-800' },
    { header: 'Hạn dùng', className: '' },
    { header: 'Số ngày còn lại', className: 'text-center font-bold' },
    { header: 'Trạng thái', className: 'text-center' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Lô sắp hết hạn
          </h2>
        </div>
        <Link
          to="/lots"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={data}
        renderRow={(item, idx) => (
          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
            <td className="px-4 py-3 text-xs font-bold text-blue-600 cursor-pointer hover:underline">
              {item.code}
            </td>
            <td className="px-4 py-3 text-xs font-medium text-slate-800">
              {item.item}
            </td>
            <td className="px-4 py-3 text-xs text-slate-600 font-medium">
              {item.expiryDate}
            </td>
            <td className="px-4 py-3 text-xs text-center font-bold text-slate-800">
              {item.daysLeft}
            </td>
            <td className="px-4 py-3 text-xs text-center">
              <Badge variant={item.status === 'Sắp hết hạn' ? 'warning' : 'info'}>
                {item.status}
              </Badge>
            </td>
          </tr>
        )}
      />
    </div>
  );
}

export default ExpiringLotsTable;
