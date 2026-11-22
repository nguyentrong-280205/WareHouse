import { useEffect, useRef, useState } from 'react';
import api from '../services/apiClient';
import Fields from './Fields';
import { empty } from './formModel';
import { resources } from './resources';
import { formatQuantity } from '../utils/formatNumber';

const config = resources.saleIssues;
const lineField = { ...config.fields.find((f) => f.name === 'lines') };
lineField.fields = lineField.fields.map((f) =>
	f.name === 'lotId' ? { ...f, type: 'stock-lot-readonly' } : f
);

export default function SaleIssueForm({
	value,
	onChange,
	lookups,
	onReadyChange,
	editing = false
}) {
	const [suggestion, setSuggestion] = useState(null),
		[revision, setRevision] = useState(0);
	const latest = useRef(value);
	useEffect(() => {
		latest.current = value;
	}, [value]);
	const selected = (lookups['/lookups/allocation-sources'] || []).find(
		(s) => s.family === 'ISSUE' && s.kind === 'SALE' && String(s.id) === String(value.sourceId)
	);
	const sourceId = value.sourceId,
		warehouseId = value.warehouseId,
		hasSource = !!selected;
	const key = sourceId + ':' + warehouseId + ':' + revision;
	const requested = hasSource && !!warehouseId && (!editing || revision > 0);
	const current = suggestion?.key === key ? suggestion : null;
	const currentPreview = current?.data,
		loading = requested && !current,
		error = current?.error;
	useEffect(() => {
		if (!requested) return;
		const controller = new AbortController();
		api.get(`/v1/orders/${sourceId}/issue-suggestions`, {
			params: { warehouseId },
			signal: controller.signal
		})
			.then((r) => {
				if (
					controller.signal.aborted ||
					latest.current.sourceId !== sourceId ||
					latest.current.warehouseId !== warehouseId
				)
					return;
				const data = r.data.data;
				const lines = data.lines.map((l) => ({
					sourceLineId: l.sourceLineId,
					lotKind: 'PRODUCT',
					_balance: l.balanceId,
					lotId: l.lotId,
					locationId: l.locationId,
					unitId: l.unitId,
					quantity: l.quantity
				}));
				for (const shortage of data.shortages)
					if (!shortage.hasPartial) {
						const source = selected.lines.find(
							(l) => String(l.id) === String(shortage.sourceLineId)
						);
						lines.push({
							...empty(lineField.fields),
							sourceLineId: shortage.sourceLineId,
							unitId: source?.unitId || ''
						});
					}
				setSuggestion({ key, data });
				onChange({ ...latest.current, lines });
			})
			.catch((e) => {
				if (!controller.signal.aborted)
					setSuggestion({
						key,
						error:
							e.response?.data?.error?.message ||
							'Không tải được gợi ý. Hãy tải lại hoặc chọn lô thủ công.'
					});
			});
		return () => controller.abort();
	}, [sourceId, warehouseId, key, requested, selected, onChange]);
	useEffect(() => {
		onReadyChange(hasSource && !!warehouseId && !loading && !!value.lines?.length);
	}, [hasSource, warehouseId, loading, value.lines, onReadyChange]);
	function select(next) {
		if (next.sourceId !== sourceId || next.warehouseId !== warehouseId) {
			setSuggestion(null);
			onChange({ ...next, lines: [empty(lineField.fields)] });
		} else onChange(next);
	}
	const productIds = new Set(selected?.lines.map((l) => String(l.productId)) || []);
	const balances = currentPreview
		? [
				...(lookups['/inventory'] || []).filter(
					(b) =>
						String(b.warehouseId) !== String(warehouseId) ||
						!productIds.has(String(b.itemId)) ||
						b.lotKind !== 'PRODUCT'
				),
				...currentPreview.balances
			]
		: lookups['/inventory'] || [];
	const formLookups = { ...lookups, '/inventory': balances };
	return (
		<div className="space-y-4">
			<Fields
				fields={config.fields.filter((f) => f.name !== 'lines')}
				value={value}
				onChange={select}
				lookups={formLookups}
			/>
			{selected && (
				<>
					<section className="space-y-2 rounded-xl border border-slate-200 p-4">
						<h3 className="text-sm font-semibold">Thành phẩm theo đơn hàng</h3>
						<p className="text-xs text-slate-500">
							Số lượng nguồn theo đơn vị cơ sở. Gợi ý bên dưới chỉ lấy phần còn cần
							xuất sau khi trừ lượng đã xuất hoặc đang giữ.
						</p>
						<div className="overflow-x-auto">
							<table className="wms-table">
								<thead>
									<tr className="border-b text-slate-500">
										<th className="p-2">Mã thành phẩm</th>
										<th className="p-2">Tên đầy đủ</th>
										<th className="p-2">Số lượng nguồn</th>
										<th className="p-2">Đơn vị</th>
									</tr>
								</thead>
								<tbody>
									{selected.lines.map((l) => (
										<tr key={l.id} className="border-b border-slate-100">
											<td className="p-2">{l.productCode}</td>
											<td className="p-2 whitespace-normal font-medium">
												{l.productName}
											</td>
											<td className="p-2 tabular-nums">
												{formatQuantity(l.quantityBase)}
											</td>
											<td className="p-2">{l.unitName}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-xs text-slate-500">
							Tự gợi ý lô, vị trí và số lượng theo FEFO khi chọn đơn hàng và kho. Có
							thể chỉnh trước khi lưu.
						</p>
						<button
							type="button"
							disabled={!warehouseId || loading}
							onClick={() => setRevision((v) => v + 1)}
							className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
						>
							Tải lại gợi ý
						</button>
					</div>
				</>
			)}
			{loading && (
				<p role="status" className="text-sm text-slate-500">
					Đang gợi ý thành phẩm theo lô và vị trí…
				</p>
			)}
			{error && (
				<p role="alert" className="text-sm text-rose-700">
					{error}
				</p>
			)}
			{currentPreview?.shortages.length > 0 && (
				<div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
					<p className="font-medium">Chưa đủ tồn khả dụng:</p>
					<ul className="mt-1 list-disc pl-5">
						{currentPreview.shortages.map((s) => (
							<li key={s.sourceLineId}>
								{s.productCode} — {s.productName}: còn thiếu{' '}
								{formatQuantity(s.remainingBase)} {s.unitName}
							</li>
						))}
					</ul>
				</div>
			)}
			{currentPreview && !currentPreview.lines.length && !currentPreview.shortages.length && (
				<p className="text-sm text-slate-500">
					Các dòng đã được xuất hoặc giữ đủ theo đơn hàng.
				</p>
			)}
			<fieldset disabled={loading}>
				<Fields
					fields={[lineField]}
					value={value}
					onChange={onChange}
					lookups={formLookups}
				/>
			</fieldset>
		</div>
	);
}
