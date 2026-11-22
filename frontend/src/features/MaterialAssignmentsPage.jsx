import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ActionButton from '../components/ActionButton';
import Modal from '../components/common/Modal';
import { useAuth } from '../auth/useAuth';
import api from '../services/apiClient';
import { formatQuantity } from '../utils/formatNumber';
import { statusLabels } from './resources';
import { useReadRequest, readError } from './useReadRequest';
const style = 'wms-input';
export default function MaterialAssignmentsPage({
	embedded = false,
	inline = false,
	onAllocate,
	readOnly = false
}) {
	const { session } = useAuth(),
		manager = session.permissions.includes('issues.allocate');
	const [page, setPage] = useState(1),
		[actionError, setError] = useState(''),
		[notice, setNotice] = useState('');
	const [dialog, setDialog] = useState(false),
		[requestId, setRequestId] = useState(''),
		[warehouseId, setWarehouseId] = useState(''),
		[staffIds, setStaffIds] = useState([]),
		[busy, setBusy] = useState(false),
		[detail, setDetail] = useState(null),
		pending = useRef(null);
	const fetchAssignments = useCallback(
		async (signal) => {
			const [r, o] = await Promise.all([
				api.get('/v1/material-assignments', { signal, params: { page, pageSize: 20 } }),
				manager ? api.get('/v1/material-assignment-options', { signal }) : null
			]);
			return { ...r.data, options: o?.data.data || { warehouses: [], staff: [] } };
		},
		[page, manager]
	);
	const request = useReadRequest([page, manager, session.accountId], fetchAssignments),
		rows = request.data?.data || [],
		options = request.data?.options || { warehouses: [], staff: [] },
		total = request.data?.meta.total || 0,
		loading = request.loading,
		error = actionError || readError(request, 'Không tải được phiếu cấp nguyên liệu.'),
		load = request.reload;
	useEffect(() => {
		if (dialog || detail) return;
		const reload = () => {
			if (!document.hidden) void load();
		};
		window.addEventListener('focus', reload);
		window.addEventListener('warehouse:pending-refresh', reload);
		return () => {
			window.removeEventListener('focus', reload);
			window.removeEventListener('warehouse:pending-refresh', reload);
		};
	}, [dialog, detail, load]);
	const selected = rows.find((r) => r.id === requestId),
		staff = options.staff.filter((a) => a.warehouseId === warehouseId);
	function open(row) {
		setRequestId(row?.id || '');
		setWarehouseId(row?.warehouseId || '');
		setStaffIds(row?.staff.map((a) => a.id) || []);
		setError('');
		setDialog(true);
	}
	function choose(id) {
		const row = rows.find((r) => r.id === id);
		setRequestId(id);
		setWarehouseId(row?.warehouseId || '');
		setStaffIds(row?.staff.map((a) => a.id) || []);
	}
	async function save(e) {
		e.preventDefault();
		if (busy || !selected || !staffIds.length) return;
		setBusy(true);
		setError('');
		const body = { expectedVersion: selected.version, warehouseId, staffIds };
		const fingerprint = JSON.stringify([selected.id, body]);
		if (pending.current?.fingerprint !== fingerprint)
			pending.current = { fingerprint, key: crypto.randomUUID() };
		try {
			await api.post('/v1/material-requests/' + selected.id + '/assign', body, {
				headers: {
					'X-CSRF-Token': session.csrfToken,
					'Idempotency-Key': pending.current.key
				}
			});
			pending.current = null;
			setDialog(false);
			setNotice(
				'Đã phân công nhân viên cấp nguyên liệu. Nhân viên nhận nhiệm vụ khi đăng nhập hoặc tải lại danh sách.'
			);
			await load();
		} catch (e) {
			setError(e.response?.data?.error?.message || 'Không lưu được phân công.');
		} finally {
			setBusy(false);
		}
	}
	const content = (
		<section className="wms-panel space-y-4 p-4">
			<div className="flex flex-wrap justify-between gap-3">
				<div>
					<h2 className="font-semibold">
						{manager
							? 'Phiếu xưởng gửi — phân công cấp nguyên liệu'
							: 'Nhiệm vụ cấp nguyên liệu của tôi'}
					</h2>
					<p className="text-xs text-slate-500 mt-1">
						{manager
							? 'Nhận phiếu sau khi xưởng bấm Gửi yêu cầu. Phân công nhân viên không trừ tồn kho.'
							: 'Chỉ hiển thị phiếu bạn được giao tại kho được cấp quyền.'}
					</p>
				</div>
				<div className="flex gap-2">
					<ActionButton disabled={loading} onClick={() => void load()}>
						Tải lại
					</ActionButton>
					{manager && !embedded && !readOnly && (
						<ActionButton variant="primary" onClick={() => open(null)}>
							Phân công
						</ActionButton>
					)}
				</div>
			</div>
			{notice && (
				<p role="status" className="wms-notice wms-tone-success">
					{notice}
				</p>
			)}
			{error && (
				<p role="alert" className="text-rose-700 text-sm">
					{error}
				</p>
			)}
			{embedded ? (
				<>
					<p className="text-sm">
						{total} phiếu{' '}
						{manager ? 'đã gửi trong phạm vi quản lý' : 'thuộc nhiệm vụ của bạn'}.
					</p>
					<Link
						className="inline-block rounded-xl border border-blue-200 px-4 py-2 text-blue-700 text-sm"
						to="/materials/issues"
					>
						{manager ? 'Mở Xuất kho nguyên liệu' : 'Xem nhiệm vụ xuất kho'}
					</Link>
				</>
			) : (
				<>
					<div className="overflow-x-auto">
						<table className="wms-table responsive-records">
							<thead>
								<tr>
									{[
										'Phiếu / Thành phẩm',
										'Xưởng',
										'Trạng thái',
										'Nhân viên được giao',
										'Thao tác'
									].map((x) => (
										<th key={x} className="p-3 bg-slate-50">
											{x}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr
										key={row.id}
										className="responsive-record border-t border-slate-100"
									>
										<td className="p-3" data-label="Phiếu / Thành phẩm">
											<p className="break-all">{row.code}</p>
											<p className="font-medium">{row.productName}</p>
										</td>
										<td className="p-3" data-label="Xưởng">
											{row.workshopName}
										</td>
										<td className="p-3" data-label="Trạng thái">
											{statusLabels[row.status] || row.status}
										</td>
										<td className="p-3" data-label="Nhân viên được giao">
											{row.staff.map((a) => a.name).join(', ') ||
												'Chưa phân công'}
										</td>
										<td className="p-3 responsive-actions">
											<div className="flex flex-wrap gap-2">
												<ActionButton onClick={() => setDetail(row)}>
													Chi tiết
												</ActionButton>
												{manager &&
													onAllocate &&
													row.staff.length > 0 &&
													['DA_GUI', 'DANG_CAP'].includes(row.status) && (
														<ActionButton
															onClick={() => void onAllocate(row)}
														>
															Điều phối xuất
														</ActionButton>
													)}
												{manager && !readOnly && row.canAssign && (
													<ActionButton
														variant="primary"
														onClick={() => open(row)}
													>
														{row.staff.length
															? 'Đổi phân công'
															: 'Phân công'}
													</ActionButton>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!loading && !rows.length && (
						<p className="text-sm text-slate-500">
							{manager
								? 'Chưa có phiếu xưởng đã gửi trong phạm vi quản lý.'
								: 'Bạn chưa được giao phiếu cấp nguyên liệu.'}
						</p>
					)}
					<div className="flex justify-between text-sm">
						<span>Tổng {total} phiếu</span>
						<div className="flex gap-3">
							<ActionButton
								disabled={page === 1 || loading}
								onClick={() => setPage((p) => p - 1)}
							>
								Trước
							</ActionButton>
							<span>Trang {page}</span>
							<ActionButton
								disabled={page * 20 >= total || loading}
								onClick={() => setPage((p) => p + 1)}
							>
								Sau
							</ActionButton>
						</div>
					</div>
					<p className="text-xs text-slate-500">
						Quản lý dùng Thêm mới để chọn phiếu, nhân viên, lô/vị trí và xác nhận phân
						bổ tại{' '}
						<Link className="text-blue-700 underline" to="/materials/issues">
							Xuất kho nguyên liệu
						</Link>
						. Nhân viên được giao thực hiện ghi sổ xuất khi phân bổ hợp lệ; vẫn kiểm đủ
						tồn, QC và FEFO.
					</p>
				</>
			)}
			{dialog && (
				<Modal
					labelledBy="assign-staff-title"
					onClose={() => {
						if (!busy) setDialog(false);
					}}
				>
					<form
						onSubmit={save}
						className="mx-auto max-w-2xl rounded-2xl bg-white p-6 space-y-4"
					>
						<h3 id="assign-staff-title" className="font-semibold">
							Phân công nhân viên kho
						</h3>
						<label className="block text-sm space-y-2">
							Nhiệm vụ
							<select className={style} value="MATERIAL" onChange={() => {}}>
								<option value="MATERIAL">Cung cấp nguyên vật liệu</option>
							</select>
						</label>
						<label className="block text-sm space-y-2">
							Phiếu xưởng đã gửi *
							<select
								required
								className={style}
								value={requestId}
								onChange={(e) => choose(e.target.value)}
							>
								<option value="">Chọn phiếu</option>
								{rows
									.filter((r) => r.canAssign)
									.map((r) => (
										<option key={r.id} value={r.id}>
											{r.productName} — {r.workshopName} — {r.code}
										</option>
									))}
							</select>
						</label>
						{selected && (
							<p className="rounded-xl bg-blue-50 p-3 text-sm break-all">
								Kế hoạch: {selected.planCode}
								{selected.notes && (
									<span className="block whitespace-pre-wrap">
										Ghi chú xưởng: {selected.notes}
									</span>
								)}
							</p>
						)}
						<label className="block text-sm space-y-2">
							Kho cấp nguyên liệu *
							<select
								required
								className={style}
								value={warehouseId}
								onChange={(e) => {
									setWarehouseId(e.target.value);
									setStaffIds([]);
								}}
							>
								<option value="">Chọn kho</option>
								{options.warehouses.map((w) => (
									<option key={w.id} value={w.id}>
										{w.name}
									</option>
								))}
							</select>
						</label>
						<fieldset className="rounded-xl border border-slate-200 p-3 space-y-2">
							<legend className="px-2 text-sm font-medium">
								Nhân viên thực hiện *
							</legend>
							{staff.map((a) => (
								<label key={a.id} className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={staffIds.includes(a.id)}
										onChange={(e) =>
											setStaffIds((prev) =>
												e.target.checked
													? [...prev, a.id]
													: prev.filter((id) => id !== a.id)
											)
										}
									/>
									{a.name}
								</label>
							))}
							{!staff.length && (
								<p className="text-xs text-slate-500">
									Chọn kho để xem nhân viên đủ quyền.
								</p>
							)}
						</fieldset>
						{error && (
							<p role="alert" className="text-sm text-rose-700">
								{error}
							</p>
						)}
						<div className="flex justify-end gap-2">
							<ActionButton disabled={busy} onClick={() => setDialog(false)}>
								Hủy
							</ActionButton>
							<button
								disabled={busy || !staffIds.length || !selected}
								className="wms-button wms-button--primary"
							>
								{busy ? 'Đang lưu…' : 'Xác nhận phân công'}
							</button>
						</div>
					</form>
				</Modal>
			)}
			{detail && (
				<Modal labelledBy="assign-request-title" onClose={() => setDetail(null)}>
					<div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 space-y-4">
						<div className="flex justify-between">
							<h3 id="assign-request-title" className="font-semibold">
								Phiếu yêu cầu cấp nguyên liệu
							</h3>
							<ActionButton onClick={() => setDetail(null)}>Đóng</ActionButton>
						</div>
						<p className="text-sm break-all">{detail.code}</p>
						<p className="font-medium">
							{detail.productName} — {detail.workshopName}
						</p>
						<p className="text-sm">
							Nhân viên:{' '}
							{detail.staff.map((a) => a.name).join(', ') || 'Chưa phân công'}
						</p>
						<p className="text-sm whitespace-pre-wrap">
							Ghi chú: {detail.notes || 'Không có'}
						</p>
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead>
									<tr>
										<th className="p-2">Nguyên liệu</th>
										<th className="p-2">Số lượng</th>
										<th className="p-2">Đơn vị</th>
									</tr>
								</thead>
								<tbody>
									{detail.materials.map((m) => (
										<tr key={m.id} className="border-t border-slate-100">
											<td className="p-2">{m.name}</td>
											<td className="p-2">
												{formatQuantity(m.quantityBase)}
											</td>
											<td className="p-2">{m.unitName}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{manager && !readOnly && detail.canAssign && (
							<ActionButton
								variant="primary"
								onClick={() => {
									setDetail(null);
									open(detail);
								}}
							>
								Phân công
							</ActionButton>
						)}
					</div>
				</Modal>
			)}
		</section>
	);
	return embedded || inline ? (
		content
	) : (
		<AppLayout title={manager ? 'Phân công nhân viên kho' : 'Nhiệm vụ của tôi'}>
			{content}
		</AppLayout>
	);
}
