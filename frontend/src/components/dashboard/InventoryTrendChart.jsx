import React from 'react';
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatQuantity } from '../../utils/formatNumber';

function InventoryTrendChart({ data = [], unitLabel = '' }) {
	return (
		<div className="wms-panel min-w-0 p-4 flex flex-col justify-between h-full">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<TrendingUp className="w-5 h-5 text-blue-600" />
					<h2 className="wms-section-title">
						Tồn theo sổ 7 ngày gần đây
					</h2>
				</div>
			</div>

			{/* Line Chart Canvas */}
			<div className="h-64 w-full">
				{data.length ? (
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={data}
							margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="#f1f5f9"
							/>
							<XAxis
								dataKey="month"
								axisLine={false}
								tickLine={false}
								tick={{ fill: '#64748b', fontSize: 11 }}
							/>
							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{ fill: '#64748b', fontSize: 11 }}
								tickFormatter={(val) => formatQuantity(val)}
							/>
							<Tooltip
								formatter={(_val, _name, item) =>
									`${item.payload.stockRaw} ${unitLabel}`
								}
								contentStyle={{
									backgroundColor: '#0f172a',
									borderRadius: '12px',
									color: '#fff',
									fontSize: '12px',
									border: 'none'
								}}
							/>
							<Line
								type="monotone"
								dataKey="stock"
								stroke="var(--wms-primary)"
								strokeWidth={3}
								dot={{ fill: '#2563eb', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
								activeDot={{ r: 6, fill: '#1d4ed8' }}
							/>
						</LineChart>
					</ResponsiveContainer>
				) : (
					<p className="grid h-full place-items-center text-center text-sm text-slate-600">
						Chọn đơn vị để xem tồn theo sổ.
					</p>
				)}
			</div>
		</div>
	);
}

export default InventoryTrendChart;
