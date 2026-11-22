import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';
import Table from '../common/Table';

function LowStockTable({ data = [], emptyMessage }) {
	const columns = [
		{ header: 'Mặt hàng / Kho' },
		{ header: 'Khả dụng', className: 'wms-table-number' },
		{ header: 'Mức tối thiểu', className: 'wms-table-number' },
		{ header: 'Trạng thái' }
	];

	return (
		<section className="wms-panel min-w-0">
			{/* Table Header */}
			<div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
						<AlertTriangle className="w-4 h-4" />
					</div>
					<h2 className="wms-section-title">
						Mặt hàng tồn thấp
					</h2>
				</div>
				<Link
					to="/reports?view=alerts&type=LOW_STOCK"
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
				label="Mặt hàng tồn thấp"
				emptyMessage={emptyMessage || 'Không có cảnh báo tồn thấp trong phạm vi đang xem.'}
				className="rounded-none border-0"
				renderRow={(item, idx) => (
					<tr key={idx} role="row" className="responsive-record hover:bg-slate-50/70">
						<td
							role="cell"
							data-label="Mặt hàng / Kho"
							className="responsive-key font-medium"
						>
							<span className="block font-semibold">{item.name}</span>
							<span className="block text-slate-600">
								{item.code} · {item.warehouse}
							</span>
						</td>
						<td role="cell" data-label="Khả dụng" className="wms-table-number">
							{item.currentStock}
						</td>
						<td role="cell" data-label="Mức tối thiểu" className="wms-table-number">
							{item.minStock}
						</td>
						<td role="cell" data-label="Trạng thái">
							<Badge variant="danger">{item.status}</Badge>
						</td>
					</tr>
				)}
			/>
		</section>
	);
}

export default LowStockTable;
