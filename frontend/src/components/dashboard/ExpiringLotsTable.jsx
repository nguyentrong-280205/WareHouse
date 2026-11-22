import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';
import Table from '../common/Table';

function ExpiringLotsTable({ data = [], emptyMessage }) {
	const columns = [
		{ header: 'Mã lô' },
		{ header: 'Mặt hàng' },
		{ header: 'Hạn dùng' },
		{ header: 'Số ngày còn lại', className: 'wms-table-number' },
		{ header: 'Trạng thái' }
	];

	return (
		<section className="wms-panel min-w-0">
			{/* Table Header */}
			<div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
						<Clock className="w-4 h-4" />
					</div>
					<h2 className="wms-section-title">
						Cảnh báo hạn sử dụng
					</h2>
				</div>
				<Link
					to="/reports?view=expiry"
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
				label="Cảnh báo hạn sử dụng"
				emptyMessage={emptyMessage || 'Không có cảnh báo hạn sử dụng trong phạm vi đang xem.'}
				className="rounded-none border-0"
				renderRow={(item, idx) => (
					<tr key={idx} role="row" className="responsive-record hover:bg-slate-50/70">
						<td role="cell" data-label="Mã lô" className="font-semibold">
							{item.code}
						</td>
						<td role="cell" data-label="Mặt hàng" className="font-medium">
							{item.item}
						</td>
						<td role="cell" data-label="Hạn dùng" className="tabular-nums">
							{item.expiryDate}
						</td>
						<td role="cell" data-label="Số ngày còn lại" className="wms-table-number">
							{item.daysLeft}
						</td>
						<td role="cell" data-label="Trạng thái">
							<Badge variant={item.status === 'Sắp hết hạn' ? 'warning' : 'danger'}>
								{item.status}
							</Badge>
						</td>
					</tr>
				)}
			/>
		</section>
	);
}

export default ExpiringLotsTable;
