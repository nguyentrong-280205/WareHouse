import { useEffect, useState } from 'react';
import api from '../services/apiClient';
import { useAuth } from '../auth/useAuth';
import Fields from './Fields';
import { empty, payload } from './formModel';
import EvidencePicker from './EvidencePicker';
import { formatQuantity } from '../utils/formatNumber';
import { displayLabel } from './referenceNames';
const f = (name, label, type = 'text', extra = {}) => ({ name, label, type, ...extra });
const verificationLabels = {
	CHO_XAC_MINH: 'Chờ xác minh',
	DA_XAC_MINH: 'Đã xác minh',
	KHONG_DIEU_CHINH: 'Không điều chỉnh',
	VO_HIEU: 'Đã vô hiệu'
};
function EvidenceLinks({ ids = [] }) {
	return (
		<div className="flex gap-3 flex-wrap">
			{ids.map((id) => (
				<a
					key={id}
					href={(api.defaults.baseURL || '/api') + '/v1/evidence/' + id}
					target="_blank"
					rel="noreferrer"
					className="text-blue-600 underline"
				>
					Tải bằng chứng #{id}
				</a>
			))}
		</div>
	);
}
const countFields = [
	f('round', 'Vòng đếm', 'integer'),
	f('emptyLocationIds', 'Xác nhận vị trí trống', 'multi', {
		lookup: '/count-locations',
		optional: true
	}),
	f('lines', 'Kết quả đếm thực tế', 'array', {
		fields: [
			f('locationId', 'Vị trí', 'select', { lookup: '/count-locations' }),
			f('lotKind', 'Loại hàng', 'select', { options: ['MATERIAL', 'PRODUCT', 'UNKNOWN'] }),
			f('lotId', 'Lô đã đăng ký', 'select', {
				lookup: '/count-lots',
				filterLocalFrom: { lotKind: 'lotKind' },
				optional: true
			}),
			f('reportedLotCode', 'Mã lô khai báo nếu chưa định danh', 'text', { optional: true }),
			f('qualityBucket', 'Chất lượng thực tế', 'select', {
				options: ['DAT', 'QUARANTINE', 'FAILED', 'EXPIRED', 'UNKNOWN']
			}),
			f('packagingVersionId', 'Phiên bản quy cách khi đếm TP', 'text', { optional: true }),
			f('pallets', 'Pallet nguyên, không đếm lại các thùng bên trong', 'decimal', {
				optional: true
			}),
			f('cartons', 'Thùng lẻ ngoài pallet', 'decimal', { optional: true }),
			f('packs', 'Lốc lẻ ngoài thùng', 'decimal', { optional: true }),
			f('looseUnits', 'Chai/lon lẻ', 'decimal', { optional: true }),
			f('materialQuantityBase', 'Lượng NL / hàng chưa định danh', 'decimal', {
				optional: true
			}),
			f('condition', 'Tình trạng', 'textarea')
		]
	})
];
export default function StocktakePanel({ record }) {
	const { session } = useAuth(),
		[data, setData] = useState(record),
		[lookups, setLookups] = useState({}),
		[form, setForm] = useState(null),
		[error, setError] = useState(''),
		[notice, setNotice] = useState(''),
		[busy, setBusy] = useState(false),
		[verification, setVerification] = useState(null),
		[reason, setReason] = useState(''),
		[evidence, setEvidence] = useState([]),
		[propose, setPropose] = useState(false);
	const allowed = (p) => session.permissions.includes(p),
		headers = () => ({
			'X-CSRF-Token': session.csrfToken,
			'Idempotency-Key': crypto.randomUUID()
		});
	const canCount = session.permissions.includes('stocktakes.count');
	useEffect(() => {
		let live = true;
		if (canCount)
			api.get('/v1/lookups/count-lots')
				.then((r) => {
					if (live) setLookups((v) => ({ ...v, '/count-lots': r.data.data }));
				})
				.catch((e) => {
					if (live) setError(e.response?.data?.error?.message || 'Không tải được lô.');
				});
		return () => {
			live = false;
		};
	}, [canCount]);
	const locationRows = data.locations.map((l) => ({
			id: String(l.locationId),
			name: 'Vị trí ' + l.locationId
		})),
		sources = { ...lookups, '/count-locations': locationRows };
	async function refresh() {
		const r = await api.get('/v1/stocktakes/' + data.id);
		setData(r.data);
	}
	async function command(path, body) {
		setBusy(true);
		setError('');
		try {
			await api.post('/v1' + path, body, { headers: headers() });
			await refresh();
			setNotice('Đã ghi nhận thao tác.');
			return true;
		} catch (e) {
			setError(e.response?.data?.error?.message || 'Thao tác thất bại.');
			return false;
		} finally {
			setBusy(false);
		}
	}
	function startCount() {
		setForm({
			...empty(countFields),
			round: data.counts.length + 1,
			lines: data.snapshots.length
				? data.snapshots.map((s) => {
						const lot = lookups['/count-lots']?.find(
							(l) =>
								l.lotKind === (s.materialLotId ? 'MATERIAL' : 'PRODUCT') &&
								String(l.id) === String(s.materialLotId || s.productLotId)
						);
						return {
							...empty(countFields[2].fields),
							locationId: String(s.locationId),
							lotKind: s.materialLotId ? 'MATERIAL' : 'PRODUCT',
							lotId: String(s.materialLotId || s.productLotId),
							qualityBucket: s.qualityBucket,
							packagingVersionId: lot?.packagingVersionId || ''
						};
					})
				: []
		});
	}
	async function saveCount(event) {
		event.preventDefault();
		if (
			await command('/stocktakes/' + data.id + '/counts', {
				...payload(countFields, form),
				expectedVersion: data.version,
				scopeGeneration: data.scopeGeneration
			})
		)
			setForm(null);
	}
	async function verify(event) {
		event.preventDefault();
		const count = data.counts.find(
			(c) => String(c.id) === String(verification.acceptedCountId)
		);
		if (
			await command('/stocktake-variances/' + verification.id + '/verify', {
				expectedVersion: verification.version,
				reason,
				evidenceIds: evidence,
				acceptedCountRound: count.sequence,
				proposeAdjustment: propose
			})
		) {
			setVerification(null);
			setReason('');
			setEvidence([]);
		}
	}
	return (
		<section className="space-y-4 border-y border-slate-100 py-4">
			{error && (
				<p role="alert" className="wms-notice wms-tone-danger">
					{error}
				</p>
			)}
			{notice && (
				<p role="status" className="wms-notice wms-tone-success">
					{notice}
				</p>
			)}
			<div className="flex flex-wrap gap-3">
				{allowed('stocktakes.count') &&
					['DANG_DEM', 'CHO_XAC_NHAN'].includes(data.status) &&
					!data.counts.some((c) => c.status === 'NHAP') && (
						<button
							onClick={startCount}
							className="wms-button wms-button--primary"
						>
							Nhập kết quả đếm vòng {data.counts.length + 1}
						</button>
					)}
				{allowed('stocktakes.confirm') && data.status === 'CHO_XAC_NHAN' && (
					<button
						disabled={busy}
						onClick={() =>
							command('/stocktakes/' + data.id + '/confirm', {
								expectedVersion: data.version
							})
						}
						className="wms-button"
					>
						Hội đồng xác nhận biên bản
					</button>
				)}
			</div>
			<div className="space-y-2">
				{data.counts.map((c) => (
					<div
						key={c.id}
						className="border border-slate-200 rounded-xl p-3 text-sm space-y-3"
					>
						<div className="flex justify-between gap-3">
							<span>
								Vòng {c.sequence} · người đếm #{c.counterId} ·{' '}
								{c.status === 'DA_NOP' ? 'Đã nộp' : 'Nháp'}
							</span>
							{c.status === 'NHAP' &&
								String(c.counterId) === String(session.accountId) &&
								allowed('stocktakes.count') && (
									<button
										disabled={busy}
										onClick={() =>
											command(
												'/stocktakes/' +
													data.id +
													'/counts/' +
													c.id +
													'/submit',
												{ expectedVersion: c.version }
											)
										}
										className="text-blue-600"
									>
										Nộp kết quả đếm
									</button>
								)}
						</div>
						<details>
							<summary className="cursor-pointer text-blue-600">
								Xem kết quả đã ghi
							</summary>
							<div className="space-y-2 pt-3">
								{c.lines?.map((l) => (
									<div key={l.id} className="border-t border-slate-100 py-2">
										Vị trí #{l.locationId} · lô{' '}
										{l.materialLotId || l.productLotId || l.reportedLotCode} ·{' '}
										{displayLabel(l.qualityBucket)} · thực đếm{' '}
										{formatQuantity(l.qtyCounted)}
										<p className="text-slate-500">{l.conditionNote}</p>
										<EvidenceLinks ids={l.evidenceIds || []} />
									</div>
								))}
								{c.emptyLocationIds?.length > 0 && (
									<p>Đã xác nhận trống: {c.emptyLocationIds.join(', ')}</p>
								)}
							</div>
						</details>
					</div>
				))}
			</div>
			{form && (
				<form
					onSubmit={saveCount}
					className="wms-panel space-y-4 p-4"
				>
					<h3 className="wms-section-title">Kết quả đếm thực tế</h3>
					<p className="text-sm text-slate-600">
						Nhập số đếm thực tế; xác nhận riêng mọi vị trí trống. Mỗi chai/lon chỉ nằm
						trong một cấp đóng gói.
					</p>
					<Fields
						fields={countFields}
						value={form}
						onChange={setForm}
						lookups={sources}
					/>
					<div className="wms-dialog-footer">
						<button
							type="button"
							onClick={() => setForm(null)}
							className="wms-button"
						>
							Đóng
						</button>
						<button
							disabled={busy}
							className="wms-button wms-button--primary"
						>
							Lưu phiên đếm
						</button>
					</div>
				</form>
			)}
			<div className="wms-panel overflow-x-auto">
				<table className="wms-table responsive-records" role="table" aria-label="Chênh lệch kiểm kê">
					<thead role="rowgroup">
						<tr role="row">
							{[
								'Vị trí / lô',
								'Sổ sách',
								'Đếm xác nhận',
								'Chênh lệch',
								'Xác minh'
							].map((t, index) => (
								<th key={t} scope="col" role="columnheader" className={index > 0 && index < 4 ? 'wms-table-number' : undefined}>
									{t}
								</th>
							))}
						</tr>
					</thead>
					<tbody role="rowgroup">
						{!data.variances.length && (
							<tr role="row">
								<td role="cell" colSpan={5} className="wms-table-message">
									Chưa có bản ghi chênh lệch.
								</td>
							</tr>
						)}
						{data.variances.map((v) => (
							<tr key={v.id} role="row" className="responsive-record">
								<td role="cell" data-label="Vị trí / lô" className="responsive-key font-semibold">
									#{v.locationId} /{' '}
									{v.materialLotId || v.productLotId || 'Chưa định danh'} ·{' '}
									{displayLabel(v.qualityBucket)}
								</td>
								<td role="cell" data-label="Sổ sách" className="wms-table-number">
									{formatQuantity(v.qtySystem)}
								</td>
								<td role="cell" data-label="Đếm xác nhận" className="wms-table-number">
									{formatQuantity(v.qtyCounted)}
								</td>
								<td role="cell" data-label="Chênh lệch" className="wms-table-number">
									{formatQuantity(v.delta)}
								</td>
								<td role="cell" data-label="Xác minh">
									{allowed('variances.verify') && v.status === 'CHO_XAC_MINH' ? (
										<button
											onClick={() => {
												setVerification(v);
												setReason('');
												setEvidence([]);
												setPropose(false);
											}}
											className="wms-button wms-button--compact"
										>
											Xác minh
										</button>
									) : (
										verificationLabels[v.status] || displayLabel(v.status)
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{verification && (
				<form
					onSubmit={verify}
					className="border border-slate-200 rounded-xl p-4 space-y-3"
				>
					<h3 className="font-semibold">Xác minh chênh lệch #{verification.id}</h3>
					<label className="block space-y-1 text-sm">
						<span>Lý do và kết quả xác minh</span>
						<textarea
							required
							maxLength={1000}
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							className="wms-input"
						/>
					</label>
					<EvidencePicker
						value={evidence}
						onChange={setEvidence}
						stocktakeId={data.id}
						warehouseId={data.warehouseId}
					/>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={propose}
							onChange={(e) => setPropose(e.target.checked)}
						/>
						Đề nghị Ban giám đốc điều chỉnh tồn theo lượng đã đếm
					</label>
					<button
						disabled={busy || !evidence.length}
						className="wms-button wms-button--primary"
					>
						Lưu xác minh
					</button>
				</form>
			)}
			{(data.verifications || []).map((v) => (
				<div key={v.id} className="bg-slate-50 rounded-xl p-3 text-sm space-y-2">
					<p>
						Xác minh #{v.id} · vòng đếm {v.acceptedCountRound} · người xác minh #
						{v.verifierId}
					</p>
					<p>{v.reason}</p>
					<EvidenceLinks ids={v.evidenceIds} />
				</div>
			))}
			{data.adjustments.map((a) => (
				<div
					key={a.id}
					className="border border-slate-200 rounded-xl p-3 text-sm space-y-2"
				>
					<p>
						Đề nghị #{a.id}: điều chỉnh {formatQuantity(a.qtySigned)} ·{' '}
						{displayLabel(a.status)}
					</p>
					{allowed('adjustments.decide') && a.status === 'CHO_DUYET' && (
						<div className="flex flex-wrap gap-2">
							{['REJECT', 'APPROVE'].map((decision) => (
								<button
									key={decision}
									disabled={busy}
									className={
										decision === 'APPROVE'
											? 'wms-button wms-button--primary'
											: 'wms-button wms-button--danger'
									}
									onClick={() => {
										const why = window.prompt('Lý do quyết định');
										if (decision === 'REJECT' && !why?.trim()) return;
										void command('/adjustments/' + a.id + '/decision', {
											expectedVersion: a.version,
											scopeGeneration: data.scopeGeneration,
											decision,
											...(why ? { reason: why } : {})
										});
									}}
								>
									{decision === 'APPROVE' ? 'Phê duyệt và ghi sổ' : 'Từ chối'}
								</button>
							))}
						</div>
					)}
				</div>
			))}
		</section>
	);
}
