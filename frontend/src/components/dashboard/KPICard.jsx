import React from 'react';
import { Boxes, Download, Upload, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const iconMap = {
	Boxes,
	Download,
	Upload,
	Clock,
	AlertTriangle
};

const colorStyles = {
	blue: 'wms-tone-info',
	green: 'wms-tone-success',
	orange: 'wms-tone-warning',
	red: 'wms-tone-danger',
	amber: 'wms-tone-warning'
};

function KPICard({
	title,
	value,
	trend,
	trendText,
	trendType = 'positive',
	iconName,
	colorScheme = 'blue'
}) {
	const IconComponent = iconMap[iconName] || Boxes;
	const style = colorStyles[colorScheme] || colorStyles.blue;
	const isPositive = trendType === 'positive';

	return (
		<div
			className="wms-panel flex min-w-0 flex-col justify-between p-3 sm:p-4"
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex flex-col">
					<span className="text-sm font-medium text-slate-600">{title}</span>
					<div className="mt-1 break-words text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">
						{value}
					</div>
				</div>

				<div
					className={`hidden size-8 shrink-0 items-center justify-center rounded-lg sm:flex ${style}`}
				>
					<IconComponent aria-hidden="true" className="size-4" />
				</div>
			</div>

			{trend && (
				<div className="flex items-center gap-1.5 mt-3 text-[11px]">
					<span
						className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded-md ${
							isPositive
								? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
								: 'bg-rose-50 text-rose-600 border border-rose-100'
						}`}
					>
						{isPositive ? (
							<ArrowUpRight aria-hidden="true" className="mr-0.5 size-3" />
						) : (
							<ArrowDownRight aria-hidden="true" className="mr-0.5 size-3" />
						)}
						{trend}
					</span>
					<span className="text-slate-400 font-medium truncate">{trendText}</span>
				</div>
			)}
		</div>
	);
}

export default KPICard;
