import { useReadRequest, readError } from './useReadRequest';
import { usePage } from './usePage';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import api from '../services/apiClient';
import { formatQuantity, isQuantityField } from '../utils/formatNumber';
import { formatBusinessValue } from '../utils/formatDate';
import { useReferenceNames } from './referenceNames';
function cell(value, key) {
	if (value && typeof value === 'object' && 'numerator' in value) {
		const number = (Number(value.numerator) / Number(value.denominator)) * 100;
		return (
			new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4, useGrouping: false }).format(
				number
			) + '%'
		);
	}
	return isQuantityField(key) ? formatQuantity(value) : formatBusinessValue(value);
}
const labels = {
	varianceRatio: 'Tỷ lệ chênh lệch',
	openingBase: 'Tồn đầu kỳ',
	increasesBase: 'Tăng trong kỳ',
	decreasesBase: 'Giảm trong kỳ',
	closingBase: 'Tồn cuối kỳ',
	warehouseId: 'Kho',
	locationId: 'Vị trí',
	lotKind: 'Loại lô',
	lotId: 'Lô',
	lotCode: 'Mã lô',
	itemCode: 'Mã hàng',
	itemName: 'Tên hàng',
	itemKind: 'Loại hàng',
	itemId: 'Mặt hàng',
	qualityBucket: 'Chất lượng',
	onHand: 'Tồn thực tế',
	reserved: 'Đang giữ',
	available: 'Khả dụng',
	unitId: 'Đơn vị',
	expiresOn: 'HSD',
	daysRemaining: 'Số ngày còn lại',
	quantityDelta: 'Biến động',
	qtyBefore: 'Trước',
	qtyAfter: 'Sau',
	createdAt: 'Thời điểm (giờ Việt Nam)',
	reason: 'Lý do',
	postingId: 'Bút toán',
	receiptId: 'Phiếu nhập',
	issueId: 'Phiếu xuất',
	returnReceptionId: 'Tiếp nhận trả',
	adjustmentId: 'Điều chỉnh',
	dispositionId: 'Xử lý lỗi',
	stocktakeCode: 'Biên bản',
	qtySystem: 'Sổ sách',
	qtyCounted: 'Thực đếm',
	delta: 'Chênh lệch',
	status: 'Trạng thái',
	type: 'Cảnh báo',
	quantityBase: 'Số lượng',
	thresholdBase: 'Ngưỡng tồn',
	availableBase: 'Khả dụng',
	idleDays: 'Ngày không biến động',
	thresholdDays: 'Ngưỡng ngày'
};
const alertTypes = {
	LOW_STOCK: 'Tồn dưới ngưỡng',
	NEAR_EXPIRY: 'Lô cận hạn',
	EXPIRED: 'Lô hết hạn',
	SLOW_MOVING: 'Chậm luân chuyển'
};
export default function DataPage({ title, views, initialView = 0 }) {
	const { resolve } = useReferenceNames();
	const renderCell = (row, key) =>
		key.endsWith('Id') ||
		['qualityBucket', 'itemKind', 'lotKind', 'status', 'type'].includes(key)
			? resolve(key, row[key], row)
			: cell(row[key], key);
	const [params, setParams] = useSearchParams();
	const index = views.findIndex((v, i) => (v.key || String(i)) === params.get('view'));
	const view = index < 0 ? initialView : index;
	const config = views[view];
	const type =
		config.key === 'alerts' && Object.hasOwn(alertTypes, params.get('type'))
			? params.get('type')
			: '';
	const search = config.search ? (params.get('q') || '').trim().slice(0, 100) : '';
	const paging = usePage(JSON.stringify([view, search, type]));
	const page = Number(paging.page);
	const { setPage } = paging;
	const [warehouses, setWarehouses] = useState([]),
		[warehouseId, setWarehouse] = useState(''),
		[from, setFrom] = useState(''),
		[to, setTo] = useState(''),
		[lookupError, setError] = useState('');
	useEffect(() => {
		let live = true;
		api.get('/v1/lookups/warehouses')
			.then((r) => {
				if (live) setWarehouses(r.data.data);
			})
			.catch((e) => {
				if (live)
					setError(e.response?.data?.error?.message || 'Không tải được danh sách kho.');
			});
		return () => {
			live = false;
		};
	}, []);
	const datesMissing = config.requireDates && (!from || !to);
	const fetchData = useCallback(
		async (signal) => {
			if (config.requireDates && (!from || !to)) return { data: [], meta: { total: 0 } };
			return (
				await api.get('/v1' + config.endpoint, {
					signal,
					params: {
						page,
						pageSize: 20,
						...config.params,
						...(type ? { type } : {}),
						...(warehouseId ? { warehouseId } : {}),
						...(config.dates && from ? { from } : {}),
						...(config.dates && to ? { to } : {}),
						...(config.search && search ? { q: search } : {})
					}
				})
			).data;
		},
		[config, page, warehouseId, from, to, search, type]
	);
	const request = useReadRequest([view, page, warehouseId, from, to, search, type], fetchData),
		rows = request.data?.data || [],
		total = request.data?.meta?.total ?? rows.length,
		missing = request.data?.configurationRequired || [],
		loading = !datesMissing && request.loading,
		error = datesMissing
			? 'Chọn đủ ngày bắt đầu và kết thúc để xem tồn theo kỳ.'
			: lookupError || readError(request, 'Không tải được dữ liệu.');
	return (
		<AppLayout title={title}>
			<div className="space-y-5">
				<div className="flex gap-2 flex-wrap">
					{views.map((v, i) => (
						<button
							key={v.endpoint + v.label}
							onClick={() => {
								setParams((current) => {
									const next = new URLSearchParams(current);
									next.set('view', v.key || String(i));
									return next;
								});
								setPage(1);
							}}
							aria-pressed={i === view}
							className={`wms-button ${i === view ? 'wms-button--primary' : ''}`}
						>
							{v.label}
						</button>
					))}
				</div>
				<div className="wms-toolbar justify-start">
					{config.key === 'alerts' && (
						<select
							aria-label="Loại cảnh báo"
							value={type}
							onChange={(e) => {
								const next = new URLSearchParams(params);
								if (e.target.value) next.set('type', e.target.value);
								else next.delete('type');
								setPage(1);
								setParams(next);
							}}
							className="wms-input w-auto max-w-full"
						>
							<option value="">Tất cả loại cảnh báo</option>
							{Object.entries(alertTypes).map(([key, label]) => (
								<option key={key} value={key}>
									{label}
								</option>
							))}
						</select>
					)}
					<select
						aria-label="Kho"
						value={warehouseId}
						onChange={(e) => {
							setWarehouse(e.target.value);
							setPage(1);
						}}
						className="wms-input w-auto max-w-full"
					>
						<option value="">Tất cả kho được phân quyền</option>
						{warehouses.map((w) => (
							<option key={w.id} value={w.id}>
								{w.name}
							</option>
						))}
					</select>
					{config.dates && (
						<>
							<label className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-700">
								Từ ngày{' '}
								<input
									type="date"
									value={from}
									onChange={(e) => {
										setFrom(e.target.value);
										setPage(1);
									}}
									className="wms-input w-auto max-w-full"
								/>
							</label>
							<label className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-700">
								Đến ngày{' '}
								<input
									type="date"
									value={to}
									onChange={(e) => {
										setTo(e.target.value);
										setPage(1);
									}}
									className="wms-input w-auto max-w-full"
								/>
							</label>
						</>
					)}
					{config.search && (
						<form
							onSubmit={(e) => {
								e.preventDefault();
								const q = new FormData(e.currentTarget).get('q').trim();
								setParams((current) => {
									const next = new URLSearchParams(current);
									if (q) next.set('q', q);
									else next.delete('q');
									return next;
								});
								setPage(1);
							}}
							className="flex w-full max-w-md min-w-0 gap-2"
						>
							<input
								aria-label="Tìm lô / mặt hàng"
								key={search}
								name="q"
								defaultValue={search}
								maxLength={100}
								placeholder="Mã hàng, tên hoặc mã lô"
								className="wms-input"
							/>
							<button className="wms-button shrink-0">Tìm</button>
						</form>
					)}
				</div>
				{error && (
					<p role="alert" className="wms-notice wms-tone-danger">
						{error}
					</p>
				)}
				{missing.length > 0 && (
					<p className="wms-notice wms-tone-warning">
						Có {missing.length} mặt hàng/kho chưa được cấu hình ngưỡng cảnh báo. Quản lý
						kho cần đặt ngưỡng tại “Cấu hình cảnh báo”; không có ngưỡng mặc định.
					</p>
				)}
				<div className="wms-panel">
					<div className="overflow-x-auto">
						<table className="wms-table responsive-records" role="table" aria-label={config.label}>
							<thead role="rowgroup">
								<tr role="row">
									{config.columns.map((c) => (
										<th key={c} scope="col" role="columnheader" className={isQuantityField(c) ? 'wms-table-number' : undefined}>
											{labels[c] || c}
										</th>
									))}
								</tr>
							</thead>
							<tbody role="rowgroup">
								{loading ? (
									<tr role="row">
										<td
											role="cell"
											colSpan={config.columns.length}
											className="wms-table-message"
										>
											<span role="status">Đang tải dữ liệu…</span>
										</td>
									</tr>
								) : rows.length ? (
									rows.map((r, i) => (
										<tr
											key={r.id || i}
											role="row"
											className="responsive-record hover:bg-slate-50/60"
										>
											{config.columns.map((c, index) => (
												<td
													key={c}
													role="cell"
													data-label={labels[c] || c}
													className={index === 0 ? 'responsive-key font-semibold' : isQuantityField(c) ? 'wms-table-number' : undefined}
												>
													{renderCell(r, c)}
												</td>
											))}
										</tr>
									))
								) : (
									<tr role="row">
										<td
											role="cell"
											colSpan={config.columns.length}
											className="wms-table-message"
										>
											{error ? (
												<button type="button" className="wms-button" onClick={request.reload}>
													Thử tải lại báo cáo
												</button>
											) : datesMissing ? (
												'Chọn ngày bắt đầu và ngày kết thúc để xem dữ liệu.'
											) : (
												'Không có bản ghi trong phạm vi đang xem.'
											)}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
					<div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-sm text-slate-600">
						<span>{total} bản ghi</span>
						<div className="flex items-center gap-2">
							<button className="wms-button wms-button--compact" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
								Trước
							</button>
							<span>Trang {page}</span>
							<button
								className="wms-button wms-button--compact"
								disabled={page * 20 >= total}
								onClick={() => setPage((p) => p + 1)}
							>
								Sau
							</button>
						</div>
					</div>
				</div>
			</div>
		</AppLayout>
	);
}
