import { formatQuantity } from '../../utils/formatNumber';
import React from 'react';
import { Link } from 'react-router-dom';
import { Warehouse, Building2, AlertTriangle, ArrowRight } from 'lucide-react';

const iconMap = {
	Warehouse,
	Building2,
	AlertTriangle
};

const barColorMap = {
	blue: {
		bg: 'bg-blue-50 text-blue-600',
		bar: 'bg-blue-600',
		text: 'text-blue-600'
	},
	emerald: {
		bg: 'bg-emerald-50 text-emerald-600',
		bar: 'bg-emerald-500',
		text: 'text-emerald-600'
	},
	rose: {
		bg: 'bg-rose-50 text-rose-600',
		bar: 'bg-rose-500',
		text: 'text-rose-600'
	}
};

function WarehouseCapacity({ data = [], showLocationsLink = true }) {
	return (
		<div className="wms-panel min-w-0 p-4 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Warehouse className="w-5 h-5 text-blue-600" />
					<h2 className="wms-section-title">
						Công suất lưu kho
					</h2>
				</div>
				{showLocationsLink && (
					<Link
						to="/storage-locations"
						className="group flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
					>
						<span>Xem chi tiết</span>
						<ArrowRight aria-hidden="true" className="size-3.5" />
					</Link>
				)}
			</div>

			{/* Progress Bars */}
			<div className="space-y-4">
				{data.map((item) => {
					const IconComponent = iconMap[item.iconName] || Warehouse;
					const colorStyle = barColorMap[item.color] || barColorMap.blue;

					return (
						<div key={item.id} className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<div
										className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorStyle.bg}`}
									>
										<IconComponent className="w-4 h-4" />
									</div>
									<span className="text-xs font-bold text-slate-800">
										{item.title}
									</span>
								</div>

								<div className="flex items-center gap-2">
									<span className="text-xs text-slate-500 font-medium">
										{formatQuantity(item.used)} / {formatQuantity(item.total)}{' '}
										{item.unit}
									</span>
									<span className={`text-xs font-bold ${colorStyle.text}`}>
										{item.percentage}%
									</span>
								</div>
							</div>

							{/* Bar track */}
							<div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
								<div
									className={`h-full rounded-full transition-all duration-500 ${colorStyle.bar}`}
									style={{ width: `${item.percentage}%` }}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default WarehouseCapacity;
