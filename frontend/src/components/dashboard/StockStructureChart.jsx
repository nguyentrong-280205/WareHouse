import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

function StockStructureChart({ data, totalStockFormatted, unitLabel, loading }) {
	const emptyMessage = loading
		? 'Đang tải cơ cấu tồn kho…'
		: unitLabel
			? 'Không có tồn kho theo đơn vị đã chọn.'
			: 'Chọn đơn vị để xem cơ cấu tồn kho.';

	return (
		<section className="flex h-full min-w-0 flex-col wms-panel p-4">
			<h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
				<PieIcon aria-hidden="true" className="size-5 shrink-0 text-blue-600" />
				Cơ cấu tồn kho
			</h2>

			{data.length > 0 ? (
				<div className="flex min-w-0 flex-1 flex-col justify-center gap-4 pt-4">
					<div className="relative mx-auto aspect-square w-full max-w-44">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
								<Pie
									data={data}
									dataKey="value"
									innerRadius="74%"
									outerRadius="96%"
									startAngle={90}
									endAngle={-270}
									paddingAngle={data.length > 1 ? 3 : 0}
									isAnimationActive={false}
								>
									{data.map((item) => (
										<Cell key={item.name} fill={item.color} stroke="none" />
									))}
								</Pie>
								<Tooltip
									formatter={(_value, name, item) => [
										item.payload.formattedValue,
										name
									]}
									contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
								/>
							</PieChart>
						</ResponsiveContainer>

						<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
							<span className="text-xs font-medium text-slate-500">Tổng tồn</span>
							<span
								className="max-w-[69%] truncate text-lg font-bold leading-tight text-slate-900 tabular-nums"
								title={totalStockFormatted}
							>
								{totalStockFormatted}
							</span>
							<span className="max-w-[65%] truncate text-xs text-slate-500">
								{unitLabel}
							</span>
						</div>
					</div>

					<ul aria-label="Tồn kho theo tình trạng" className="divide-y divide-slate-100">
						{data.map((item) => (
							<li
								key={item.name}
								className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 py-2 text-xs"
							>
								<div className="flex min-w-0 items-center gap-2">
									<span
										aria-hidden="true"
										className="size-2.5 shrink-0 rounded-full"
										style={{ backgroundColor: item.color }}
									/>
									<span className="font-semibold text-slate-700">
										{item.name}
									</span>
								</div>
								<div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right tabular-nums">
									<span className="text-slate-600">{item.formattedValue}</span>
									<span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
										{item.percentage}%
									</span>
								</div>
							</li>
						))}
					</ul>
				</div>
			) : (
				<div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
					<div
						aria-hidden="true"
						className="size-24 rounded-full border-[10px] border-slate-100"
					/>
					<p role="status" className="text-sm text-slate-500">
						{emptyMessage}
					</p>
				</div>
			)}
		</section>
	);
}

export default StockStructureChart;
