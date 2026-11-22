import { formatQuantity } from '../utils/formatNumber';
import { formatBusinessValue } from '../utils/formatDate';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { canAccessPath } from '../auth/access';
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import KPICard from '../components/dashboard/KPICard';
import InventoryChart from '../components/dashboard/InventoryChart';
import StockStructureChart from '../components/dashboard/StockStructureChart';
import InventoryTrendChart from '../components/dashboard/InventoryTrendChart';
import LowStockTable from '../components/dashboard/LowStockTable';
import ExpiringLotsTable from '../components/dashboard/ExpiringLotsTable';
import WarehouseActivity from '../components/dashboard/WarehouseActivity';
import WarehouseCapacity from '../components/dashboard/WarehouseCapacity';
import {
	useDashboardData,
	quantityInt,
	quantityText,
	scaledInt,
	vnDate,
	utcDate,
	activityRows
} from '../features/live-overview';

const stockStatuses = [
	{ key: 'DAT', name: 'Đạt QC', color: '#2563eb' },
	{ key: 'QUARANTINE', name: 'Cách ly', color: '#d97706' },
	{ key: 'FAILED', name: 'Không đạt', color: '#e11d48' },
	{ key: 'EXPIRED', name: 'Hết hạn', color: '#64748b' }
];

function DashboardPage() {
	const live = useDashboardData(),
		[unitId, setUnitId] = useState(''),
		today = vnDate();
	const { session } = useAuth();
	const unitLabel = live.units.find((u) => String(u.id) === unitId)?.name || '';
	const inventory = live.inventory.filter((r) => r.unitId === unitId),
		movements = live.movements.filter((r) => r.unitId === unitId);
	const total = inventory.reduce((n, r) => n + quantityInt(r.onHand), 0n),
		buckets = new Map();
	for (const r of inventory)
		buckets.set(r.qualityBucket, (buckets.get(r.qualityBucket) || 0n) + quantityInt(r.onHand));
	const structure = stockStatuses.flatMap(({ key, name, color }) => {
		const quantity = buckets.get(key) || 0n;
		if (!quantity) return [];
		const share = Number((quantity * 10000n) / total) / 100;
		return [
			{
				name,
				value: Number(quantityText(quantity)),
				formattedValue: `${formatQuantity(quantityText(quantity))} ${unitLabel}`,
				percentage: share === 0 ? '< 0,01' : formatQuantity(String(share)),
				color
			}
		];
	});
	const dates = Array.from({ length: 7 }, (_, i) =>
		new Date(Date.parse(today + 'T00:00:00Z') - (6 - i) * 86400000).toISOString().slice(0, 10)
	);
	const dayOf = (r) =>
		new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Asia/Ho_Chi_Minh',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(utcDate(r.createdAt));
	const inOut = unitId
		? dates.map((day) => {
				const rows = movements.filter((r) => dayOf(r) === day),
					up = rows.reduce(
						(n, r) =>
							n +
							(quantityInt(r.quantityDelta) > 0n ? quantityInt(r.quantityDelta) : 0n),
						0n
					),
					down = rows.reduce(
						(n, r) =>
							n +
							(quantityInt(r.quantityDelta) < 0n
								? -quantityInt(r.quantityDelta)
								: 0n),
						0n
					);
				return {
					date: day.slice(5).split('-').reverse().join('/'),
					importQty: Number(quantityText(up)),
					exportQty: Number(quantityText(down)),
					importRaw: formatQuantity(quantityText(up)),
					exportRaw: formatQuantity(quantityText(down))
				};
			})
		: [];
	let balance = total;
	const trend = [];
	if (unitId)
		for (const day of [...dates].reverse()) {
			trend.unshift({
				month: day.slice(5).split('-').reverse().join('/'),
				stock: Number(quantityText(balance)),
				stockRaw: formatQuantity(quantityText(balance))
			});
			balance -= movements
				.filter((r) => dayOf(r) === day)
				.reduce((n, r) => n + quantityInt(r.quantityDelta), 0n);
		}
	const low = live.alerts.filter((r) => r.type === 'LOW_STOCK'),
		expiry = live.alerts.filter((r) => ['NEAR_EXPIRY', 'EXPIRED'].includes(r.type));
	const alertMessage = live.loading
		? 'Đang tải cảnh báo…'
		: live.error
			? 'Dữ liệu cảnh báo chưa tải được.'
			: undefined;
	const countToday = (field) =>
		new Set(live.movements.filter((r) => r[field] && dayOf(r) === today).map((r) => r[field]))
			.size;
	const kpiCardsData = [
		{
			id: 'items',
			title: 'Mặt hàng có tồn',
			value: new Set(
				live.inventory
					.filter((r) => quantityInt(r.onHand) > 0n)
					.map((r) => r.itemKind + ':' + r.itemId)
			).size,
			iconName: 'Boxes',
			colorScheme: 'blue'
		},
		{
			id: 'receipts',
			title: 'Phiếu nhập hôm nay',
			value: countToday('receiptId'),
			iconName: 'Download',
			colorScheme: 'green'
		},
		{
			id: 'issues',
			title: 'Phiếu xuất hôm nay',
			value: countToday('issueId'),
			iconName: 'Upload',
			colorScheme: 'orange'
		},
		{
			id: 'expiry',
			title: 'Cảnh báo hạn sử dụng',
			value: expiry.length,
			iconName: 'Clock',
			colorScheme: 'red'
		},
		{
			id: 'low',
			title: 'Cảnh báo tồn thấp',
			value: low.length,
			iconName: 'AlertTriangle',
			colorScheme: 'amber'
		}
	].map((c) => ({ ...c, value: live.loading ? '…' : live.error ? '—' : String(c.value) }));
	const capacity = live.warehouses.map((w) => ({
		id: w.id,
		title: w.name,
		used: w.occupiedCapacity,
		total: w.capacity,
		unit: w.capacityUnitCode,
		percentage:
			quantityInt(w.capacity) > 0n
				? Number(
						(scaledInt(w.occupiedCapacity, 15) * 10000n) /
							(quantityInt(w.capacity) * 1000000000n)
					) / 100
				: 0,
		iconName: 'Warehouse',
		color: 'blue'
	}));

	return (
		<AppLayout
			title="Tổng quan kho"
			subtitle="Tồn kho, cảnh báo và biến động trong phạm vi được cấp"
		>
			<div className="space-y-6">
				{live.error && (
					<p role="alert" className="wms-notice wms-tone-danger">
						{live.error}
					</p>
				)}
				{live.configurationRequired.length > 0 && (
					<p className="wms-notice wms-tone-warning">
						{live.configurationRequired.length} mặt hàng/kho chưa đặt ngưỡng cảnh báo.
						{session.permissions.includes('reports.configureAlerts') && (
							<Link to="/reports/alert-rules" className="ml-2 underline">
								Cấu hình cảnh báo
							</Link>
						)}
					</p>
				)}
				<div className="wms-toolbar text-sm">
					<div className="flex items-center gap-2 text-slate-600">
						<Calendar aria-hidden="true" className="size-4 shrink-0" />
						<span className="tabular-nums">
							{formatBusinessValue(dates[0])} – {formatBusinessValue(today)} (giờ Việt
							Nam)
						</span>
					</div>
					<label className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
						<span className="font-medium">Đơn vị biểu đồ</span>
						<select
							value={unitId}
							onChange={(e) => setUnitId(e.target.value)}
							className="wms-input max-w-full sm:w-auto"
						>
							<option value="">Chọn đơn vị</option>
							{live.units
								.filter((u) => u.dimension !== 'CAPACITY_VOLUME')
								.map((u) => (
									<option key={u.id} value={u.id}>
										{u.name}
									</option>
								))}
						</select>
					</label>
				</div>

				{/* 5 KPI Cards */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
					{kpiCardsData.map((card) => (
						<KPICard key={card.id} {...card} />
					))}
				</div>

				{/* 2 Tables Grid */}
				<div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
					<LowStockTable
						emptyMessage={alertMessage}
						data={low.map((r) => ({
							code: r.itemCode || '—',
							name: r.itemName || '—',
							warehouse: r.warehouseName || '—',
							currentStock: formatQuantity(r.availableBase),
							minStock: formatQuantity(r.thresholdBase),
							status: 'Dưới ngưỡng'
						}))}
					/>
					<ExpiringLotsTable
						emptyMessage={alertMessage}
						data={expiry.map((r) => ({
							code: r.lotCode || '—',
							item: r.itemName || '—',
							expiryDate: formatBusinessValue(r.expiresOn),
							daysLeft: r.daysRemaining,
							status: r.type === 'EXPIRED' ? 'Đã hết hạn' : 'Sắp hết hạn'
						}))}
					/>
				</div>

				{unitId && !live.error && !live.loading && (
					<section
						aria-label="Biểu đồ tồn và biến động"
						className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-12"
					>
						<div className="min-w-0 xl:col-span-5">
							<InventoryChart data={inOut} unitLabel={unitLabel} />
						</div>
						<div className="min-w-0 xl:col-span-3">
							<StockStructureChart
								data={structure}
								totalStockFormatted={formatQuantity(quantityText(total))}
								unitLabel={unitLabel}
							/>
						</div>
						<div className="min-w-0 xl:col-span-4">
							<InventoryTrendChart data={trend} unitLabel={unitLabel} />
						</div>
					</section>
				)}

				{/* Bottom Row: Activity + Capacity */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
					<div className="lg:col-span-7">
						<WarehouseActivity activities={activityRows(live.movements)} />
					</div>
					<div className="lg:col-span-5">
						<WarehouseCapacity
							data={capacity}
							showLocationsLink={canAccessPath(session, '/storage-locations')}
						/>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}

export default DashboardPage;
