import Fields from './Fields';
import { empty, payload } from './formModel';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
	Plus,
	X,
	ChevronLeft,
	ChevronRight,
	Eye,
	Trash2,
	Check,
	Pencil,
	LockKeyhole
} from 'lucide-react';
import ActionButton from '../components/ActionButton';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import AppLayout from '../components/layout/AppLayout';
import api from '../services/apiClient';
import { useAuth } from '../auth/useAuth';
import { resources, fieldLabels, statusLabels } from './resources';
import RecordSummary from './RecordSummary';
import ProductionPlanDetail from './ProductionPlanDetail';
import PlanInbox from './PlanInbox';
import PurchaseForm from './PurchaseForm';
import MaterialRequestForm from './MaterialRequestForm';
import MaterialAssignmentsPage from './MaterialAssignmentsPage';
import MaterialIssueCreate from './MaterialIssueCreate';
import SaleIssueForm from './SaleIssueForm';
import LocationOverview from './LocationOverview';
import { useReferenceNames, displayLabel } from './referenceNames';
import { formError } from './formError';
import { handoffText } from './planRouting';
import ProductionPlanForm from './ProductionPlanForm';
import { moneyText } from './money';
import { formatQuantity, isQuantityField, isMoneyField } from '../utils/formatNumber';
import { formatBusinessValue } from '../utils/formatDate';
import { useReadRequest, readError } from './useReadRequest';
import { usePage } from './usePage';
const displayNumber = (key, value) =>
	isMoneyField(key)
		? moneyText(value)
		: isQuantityField(key)
			? formatQuantity(value)
			: formatBusinessValue(value);
const inputStyle = 'wms-input';
const statusTones = {
	ACTIVE: 'success',
	CHO_DUYET: 'warning',
	CHO_XAC_NHAN: 'warning',
	THIEU_NGUYEN_VAT_LIEU: 'warning',
	HET_HAN: 'danger',
	TU_CHOI: 'danger',
	CHO_QC: 'purple',
	DA_DUYET: 'info',
	DA_GUI: 'info',
	DA_XAC_NHAN: 'info',
	DANG_CAP: 'info',
	DANG_NHAP: 'info',
	HOAN_THANH: 'success'
};
const EMPTY_ROWS = [];
const orderProfileFields = ['deliveryAddress', 'recipient', 'recipientPhone'];
const newForm = (kind, fields) =>
	empty(kind === 'orders' ? fields.filter((f) => !orderProfileFields.includes(f.name)) : fields);
const queryTerm = (queryString) =>
	(new URLSearchParams(queryString).get('q') || '').trim().slice(0, 100);
export default function ResourcePage({ kind, renderDetail, toolbar }) {
	const { resolve: referenceName } = useReferenceNames();
	const config = resources[kind],
		{ session, refresh } = useAuth();
	const { endpoint, unpaged, listParams } = config;
	const [, setParams] = useSearchParams();
	const { search: queryString } = useLocation();
	const params = new URLSearchParams(queryString);
	const canSearch = config.search ?? !config.document;
	const search = canSearch ? queryTerm(queryString) : '';
	const statuses =
		config.statuses ??
		(config.document
			? ['NHAP', 'XAC_NHAN', 'DANG_GIAO', 'DA_GIAO', 'HUY']
			: ['ACTIVE', 'LOCKED']);
	const [status, setStatus] = useState('');
	const paging = usePage(JSON.stringify([search, status]));
	const page = Number(paging.page);
	const { setPage } = paging;
	const createRequested =
		kind === 'orders' &&
		params.get('create') === '1' &&
		session.permissions.includes('orders.create');
	const [busy, setBusy] = useState(false),
		[actionError, setError] = useState(''),
		[notice, setNotice] = useState(''),
		[lookups, setLookups] = useState({});
	const [dialog, setDialog] = useState(() => (createRequested ? {} : null)),
		[form, setForm] = useState(() => (createRequested ? newForm(kind, config.fields) : {})),
		[detail, setDetail] = useState(null),
		[locationWarehouse, setLocationWarehouse] = useState(null),
		[locations, setLocations] = useState([]);
	const [locationEdit, setLocationEdit] = useState(null);
	const [planningReady, setPlanningReady] = useState(false);
	const [materialIssueReady, setMaterialIssueReady] = useState(false);
	const [saleIssueReady, setSaleIssueReady] = useState(false);
	const [locationsRevision, setLocationsRevision] = useState(0);
	const [lotLocationState, setLotLocationState] = useState(null);
	const allowed = (permission) => session.permissions.includes(permission);
	const pendingWrites = useRef(new Map());
	const formFeedback = useRef(null);
	useEffect(() => {
		if (actionError) formFeedback.current?.focus();
	}, [actionError]);
	async function write(method, url, body) {
		const fingerprint = method + url + JSON.stringify(body);
		if (!pendingWrites.current.has(fingerprint))
			pendingWrites.current.set(fingerprint, crypto.randomUUID());
		const options = {
			headers: {
				'X-CSRF-Token': session.csrfToken,
				'Idempotency-Key': pendingWrites.current.get(fingerprint)
			}
		};
		const result =
			method === 'delete'
				? await api.delete(url, { ...options, data: body })
				: await api[method](url, body, options);
		pendingWrites.current.delete(fingerprint);
		return result;
	}
	const fetchRows = useCallback(
		async (signal) => {
			const q = canSearch ? queryTerm(queryString) : '';
			return (
				await api.get('/v1' + endpoint, {
					signal,
					params: {
						...(unpaged ? {} : { page, pageSize: 20 }),
						...listParams,
						...(q ? { q } : {}),
						...(status ? { status } : {})
					}
				})
			).data;
		},
		[endpoint, unpaged, listParams, page, queryString, status, canSearch]
	);
	const request = useReadRequest([kind, page, search, status, session.accountId], fetchRows),
		rows = request.data?.data || EMPTY_ROWS,
		total = request.data?.meta?.total ?? rows.length,
		loading = request.loading,
		listError = readError(request, 'Không tải được dữ liệu.'),
		error = actionError || listError,
		load = request.reload;
	const creatingOrder = kind === 'orders' && !!dialog && !dialog.id && !dialog.command;
	const fetchDeliveryDefaults = useCallback(
		async (signal) => {
			if (!creatingOrder) return null;
			return (await api.get('/v1/orders/delivery-defaults', { signal, timeout: 10_000 }))
				.data;
		},
		[creatingOrder]
	);
	const deliveryDefaults = useReadRequest(
		[creatingOrder, session.accountId],
		fetchDeliveryDefaults
	);
	const hasCompleteDeliveryDefaults = orderProfileFields.every(
		(field) => deliveryDefaults.data?.[field]
	);
	const { earliestDueDate, ...profile } = deliveryDefaults.data ?? {};
	const formValues = creatingOrder ? { ...profile, ...form } : form;
	const formFields = creatingOrder
		? config.fields.map((field) =>
				field.name === 'dueDate' ? { ...field, min: earliestDueDate } : field
			)
		: dialog?.command?.fields || config.fields;
	const lotLocationKey = JSON.stringify([
			kind,
			session.accountId,
			session.warehouseIds,
			rows.map((r) => r.id)
		]),
		lotLocations = lotLocationState?.key === lotLocationKey ? lotLocationState.data : {};
	useEffect(() => {
		if (kind !== 'materialIssues' || dialog || detail) return;
		const reload = () => {
			if (!document.hidden) void load();
		};
		window.addEventListener('focus', reload);
		return () => window.removeEventListener('focus', reload);
	}, [kind, load, dialog, detail]);
	useEffect(() => {
		if (
			kind !== 'materialLots' ||
			!session.permissions.includes('inventory.search') ||
			!rows.length
		)
			return;
		let live = true;
		(async () => {
			try {
				const warehouses = (await api.get('/v1/lookups/warehouses')).data.data;
				const entries = await Promise.all(
					rows.map(async (row) => {
						let page = 1,
							balances = [],
							result;
						do {
							result = await api.get('/v1/inventory', {
								params: { lotKind: 'MATERIAL', lotId: row.id, page, pageSize: 100 }
							});
							balances.push(...result.data.data);
							page++;
						} while (
							balances.length < result.data.meta.total &&
							result.data.data.length
						);
						const names = balances
							.filter((b) => /[1-9]/.test(String(b.onHand)))
							.map((b) => {
								const warehouse = warehouses.find(
									(w) => String(w.id) === String(b.warehouseId)
								);
								const location = warehouse?.locations?.find(
									(l) => String(l.id) === String(b.locationId)
								);
								return location ? location.name : 'Vị trí không còn hoạt động';
							});
						return [String(row.id), [...new Set(names)]];
					})
				);
				if (live)
					setLotLocationState({ key: lotLocationKey, data: Object.fromEntries(entries) });
			} catch {
				if (live) setLotLocationState({ key: lotLocationKey, data: { _error: true } });
			}
		})();
		return () => {
			live = false;
		};
	}, [kind, rows, session.permissions, lotLocationKey]);
	useEffect(() => {
		const canCreate = session.permissions.includes(
			config.createPermission ||
				config.permission + '.' + (config.document ? 'create' : 'write')
		);
		const paths = new Set();
		const collect = (fields) =>
			fields.forEach((f) => {
				if (f.lookup) paths.add(f.lookup);
				if (f.type === 'packaging') {
					paths.add(config.document ? '/lookups/products' : '/products');
				}
				if (f.fields) collect(f.fields);
			});
		if (canCreate)
			collect(
				kind === 'plans' ? config.fields.filter((f) => f.name === 'orderId') : config.fields
			);
		if (kind === 'materialLots') paths.add('/materials');
		for (const action of config.actions || [])
			if (action.fields && session.permissions.includes(action.permission))
				collect(action.fields);
		let live = true;
		Promise.all(
			[...paths].map(async (path) => {
				let page = 1,
					items = [];
				for (;;) {
					const r = await api.get('/v1' + path, {
						params:
							path === '/lookups/plan-lines' && kind === 'productRequests'
								? { purpose: 'PRODUCT' }
								: path.startsWith('/lookups/')
									? {}
									: { page, pageSize: 100 }
					});
					items.push(...r.data.data);
					if (!r.data.meta || items.length >= r.data.meta.total || !r.data.data.length)
						break;
					page++;
				}
				return [path, items];
			})
		)
			.then((entries) => {
				if (live) setLookups(Object.fromEntries(entries));
			})
			.catch((e) => {
				if (live)
					setError(
						e.response?.data?.error?.message || 'Không tải được danh mục lựa chọn.'
					);
			});
		return () => {
			live = false;
		};
	}, [config, kind, session.permissions]);
	async function save(event) {
		event.preventDefault();
		if (busy || (creatingOrder && deliveryDefaults.loading)) return;
		setBusy(true);
		setError('');
		try {
			if (kind === 'plans' && !dialog.command && !planningReady)
				throw new Error('PLANNING_NOT_READY');
			if (
				kind === 'materialRequests' &&
				!dialog.command &&
				(!form.planLineId || !form.lines?.length)
			) {
				setError('Chọn phân công và ít nhất một dòng nguyên vật liệu.');
				return;
			}
			if (kind === 'saleIssues' && !dialog.command && !saleIssueReady)
				throw new Error('SALE_ISSUE_NOT_READY');
			const initialBody = payload(dialog.command?.fields || config.fields, formValues),
				body =
					config.prepare && !dialog.command
						? config.prepare(initialBody, rows)
						: initialBody;
			if (kind === 'materialIssues' && !dialog.id && !dialog.command) {
				if (!materialIssueReady) throw new Error('MATERIAL_ASSIGNMENT_REQUIRED');
				if (
					form._assignmentAllowed &&
					form._assignmentVersion !== undefined &&
					form._staffIds?.length
				)
					body.assignment = {
						expectedVersion: form._assignmentVersion,
						staffIds: form._staffIds
					};
			}
			if (dialog.id) body.expectedVersion = dialog.version;
			if (dialog.command?.decision) body.decision = dialog.command.decision;
			if (dialog.command?.allocation)
				body.expectedAllocationVersion = dialog.allocationVersion;
			const saved = await write(
				dialog.command ? 'post' : dialog.id ? 'put' : 'post',
				'/v1' +
					config.endpoint +
					(dialog.id ? '/' + dialog.id : '') +
					(dialog.command ? '/' + dialog.command.name : ''),
				body
			);
			setDialog(null);
			setNotice(
				kind === 'materialIssues' && !dialog.command
					? 'Đã lập và gửi phiếu cho nhân viên. Tồn kho sẽ trừ khi nhân viên tiếp nhận.'
					: handoffText(saved.data) || 'Đã lưu dữ liệu.'
			);
			window.dispatchEvent(new Event('warehouse:pending-refresh'));
			if (kind === 'warehouses') await refresh();
			await load();
		} catch (e) {
			if (creatingOrder && e.response?.data?.error?.code === 'DUE_DATE_INVALID')
				void deliveryDefaults.reload();
			setError(
				formError(e, dialog?.command?.fields || config.fields, 'Không lưu được dữ liệu.')
			);
		} finally {
			setBusy(false);
		}
	}
	async function action(row, command) {
		if (command.fields) {
			setDialog({ ...row, command });
			setForm({ ...empty(command.fields), _record: row });
			return;
		}
		if (!window.confirm(command.confirmation || command.label + '?')) return;
		const reason = command.reason ? window.prompt('Lý do') : undefined;
		if (command.reason && !reason?.trim()) return;
		setBusy(true);
		try {
			const saved = await write(
				'post',
				'/v1' + config.endpoint + '/' + row.id + '/' + command.name,
				{
					expectedVersion: row.version,
					...(command.allocation
						? { expectedAllocationVersion: row.allocationVersion }
						: {}),
					...(command.decision ? { decision: command.decision } : {}),
					...(reason ? { reason } : {})
				}
			);
			setNotice(
				command.successMessage || handoffText(saved.data) || 'Đã thực hiện thao tác.'
			);
			window.dispatchEvent(new Event('warehouse:pending-refresh'));
			if (['plans', 'materialIssues'].includes(kind) && detail?.id === row.id)
				setDetail(saved.data);
			await load();
		} catch (e) {
			setError(e.response?.data?.error?.message || 'Thao tác thất bại.');
		} finally {
			setBusy(false);
		}
	}
	function edit(row) {
		setPlanningReady(false);
		setMaterialIssueReady(false);
		setSaleIssueReady(false);
		setDialog(row || {});
		setForm(
			row
				? {
						...empty(config.fields),
						...row,
						...(kind === 'materialLots' ? { _materialLotLocked: true } : {}),
						...(kind === 'plans'
							? {
									lines: row.lines.map((l) => ({
										...l,
										bomVersionId: l.sourceBomVersionId || l.bomVersionId
									}))
								}
							: {})
					}
				: newForm(kind, config.fields)
		);
		setError('');
	}
	async function showDetail(row) {
		try {
			const r = await api.get('/v1' + config.endpoint + '/' + row.id);
			setDetail(r.data);
		} catch (e) {
			setError(e.response?.data?.error?.message || 'Không tải được chi tiết.');
		}
	}
	async function showLocations(row) {
		setLocationWarehouse(row);
		setLocationEdit(null);
		try {
			const r = await api.get('/v1/warehouses/' + row.id + '/locations');
			setLocations(r.data.data);
		} catch (e) {
			setError(e.response?.data?.error?.message || 'Không tải được vị trí.');
		}
	}
	async function changeLocationStatus(location) {
		const action = location.status === 'ACTIVE' ? 'lock' : 'unlock';
		if (
			busy ||
			location.retired ||
			locationWarehouse.status !== 'ACTIVE' ||
			!window.confirm(
				(action === 'lock' ? 'Khóa' : 'Mở khóa') + ' vị trí ' + location.name + '?'
			)
		)
			return;
		setBusy(true);
		setError('');
		try {
			await write(
				'post',
				'/v1/warehouses/' +
					locationWarehouse.id +
					'/locations/' +
					location.id +
					'/' +
					action,
				{ expectedVersion: location.version }
			);
			await showLocations(locationWarehouse);
			setLocationsRevision((v) => v + 1);
			setNotice('Đã cập nhật trạng thái vị trí.');
		} catch (e) {
			setError(e.response?.data?.error?.message || 'Không đổi được trạng thái vị trí.');
		} finally {
			setBusy(false);
		}
	}
	async function addLocation(event) {
		event.preventDefault();
		setBusy(true);
		try {
			const data = Object.fromEntries(
				[...new FormData(event.currentTarget)].filter(([, v]) => v !== '')
			);
			if (locationEdit) data.expectedVersion = locationEdit.version;
			await write(
				locationEdit ? 'put' : 'post',
				'/v1/warehouses/' +
					locationWarehouse.id +
					'/locations' +
					(locationEdit ? '/' + locationEdit.id : ''),
				data
			);
			await showLocations(locationWarehouse);
			setLocationsRevision((v) => v + 1);
			setLocationEdit(null);
			setNotice('Đã lưu vị trí.');
			event.target.reset();
		} catch (e) {
			setError(e.response?.data?.error?.message || 'Không lưu được vị trí.');
		} finally {
			setBusy(false);
		}
	}
	const createPermission =
		config.createPermission || config.permission + '.' + (config.document ? 'create' : 'write');
	useEffect(() => {
		if (!createRequested) return;
		setParams(
			(current) => {
				const next = new URLSearchParams(current);
				next.delete('create');
				return next;
			},
			{ replace: true }
		);
	}, [createRequested, setParams]);
	function cellValue(row, key) {
		if (kind === 'orders' && key === 'code') return row.code || `#${row.id}`;
		if (kind === 'materialLots' && key === 'itemId')
			return (
				row.itemName ||
				(lookups['/materials'] || []).find((m) => String(m.id) === String(row.itemId))
					?.name ||
				'—'
			);
		if (kind === 'materialLots' && key === 'storageLocations') {
			if (!session.permissions.includes('inventory.search')) return 'Không có quyền xem';
			if (lotLocations._error) return 'Không tải được vị trí';
			const locations = lotLocations[String(row.id)];
			return locations
				? locations.length
					? locations.join(', ')
					: 'Không có tồn trong phạm vi được cấp'
				: 'Đang tải…';
		}
		if (kind === 'plans' && key === 'orderId') return row.orderCode || '—';
		if (kind === 'purchases' && key === 'supplierId') return row.supplierName || '—';
		if (kind === 'purchases' && key === 'planId') return row.planCode || '—';
		if (key.endsWith('Id')) return referenceName(key, row[key], row);
		if (['type', 'containerType', 'qualityBucket'].includes(key)) return displayLabel(row[key]);
		if (kind !== 'orders' || key !== 'totalAmount') return displayNumber(key, row[key]);
		const draft = row.status === 'NHAP',
			amount = draft ? row.estimatedTotalAmount : row.totalAmount;
		if (amount === null || amount === undefined)
			return (
				<span className="text-xs text-slate-500">
					{draft ? 'Chưa đủ giá' : 'Chưa chốt'}
				</span>
			);
		return (
			<div className="space-y-1">
				<span className="font-semibold tabular-nums">{moneyText(amount)}</span>
				{draft && <span className="block text-xs text-slate-500">Tạm tính</span>}
			</div>
		);
	}
	const deleteDraftKinds = ['orders', 'purchases', 'materialRequests', 'productRequests'];
	const isFinalAction = (a) =>
		a.decision === 'APPROVE' || /^(confirm|submit|post-|execute|resolve|cutoff)/.test(a.name);
	async function deleteDraft(row) {
		if (
			busy ||
			!deleteDraftKinds.includes(kind) ||
			row.status !== 'NHAP' ||
			!allowed(createPermission)
		)
			return;
		if (
			!window.confirm(
				'Xóa bản nháp #' + row.id + '? Chỉ bản nháp chưa có dữ liệu phụ thuộc mới được xóa.'
			)
		)
			return;
		setBusy(true);
		setError('');
		try {
			await write('delete', '/v1' + config.endpoint + '/' + row.id, {
				expectedVersion: row.version
			});
			if (detail?.id === row.id) setDetail(null);
			setNotice('Đã xóa bản nháp.');
			if (rows.length === 1 && page > 1) setPage((p) => p - 1);
			else await load();
		} catch (e) {
			setError(e.response?.data?.error?.message || 'Không xóa được bản nháp.');
		} finally {
			setBusy(false);
		}
	}
	function availableActions(row) {
		return [...(config.actions || [])]
			.filter((a) => allowed(a.permission) && a.states.includes(row.status))
			.sort((a, b) => Number(isFinalAction(a)) - Number(isFinalAction(b)));
	}
	function rowActions(row) {
		const deletable =
			deleteDraftKinds.includes(kind) && row.status === 'NHAP' && allowed(createPermission);
		return (
			<div className="flex flex-wrap items-center gap-2 sm:min-w-max">
				{!config.noDetail && (
					<ActionButton disabled={busy} onClick={() => void showDetail(row)}>
						<Eye size={14} />
						Chi tiết
					</ActionButton>
				)}
				{(!config.document || config.editableStates?.includes(row.status)) &&
					allowed(config.editPermission || createPermission) && (
						<>
							{row.status !== 'LOCKED' && (
								<ActionButton disabled={busy} onClick={() => edit(row)}>
									<Pencil size={14} />
									Sửa
								</ActionButton>
							)}
							{row.status === 'ACTIVE' && (
								<ActionButton
									variant="danger"
									disabled={busy}
									onClick={() =>
										action(row, { name: 'lock', label: 'Khóa bản ghi' })
									}
								>
									<LockKeyhole size={14} />
									Khóa
								</ActionButton>
							)}
							{row.status === 'LOCKED' && (
								<ActionButton
									disabled={busy}
									onClick={() =>
										action(row, { name: 'unlock', label: 'Mở khóa' })
									}
								>
									<LockKeyhole size={14} />
									Mở khóa
								</ActionButton>
							)}
						</>
					)}
				{kind === 'warehouses' && (
					<ActionButton disabled={busy} onClick={() => showLocations(row)}>
						Vị trí
					</ActionButton>
				)}
				{config.document && !config.noDetail && (
					<ActionButton
						variant="danger"
						disabled={busy || !deletable}
						title={
							deletable
								? 'Xóa bản nháp chưa có dữ liệu phụ thuộc'
								: deleteDraftKinds.includes(kind)
									? 'Chỉ được xóa bản nháp và phải có quyền tạo đơn.'
									: 'Chứng từ này không cho xóa trực tiếp; sử dụng thao tác hủy nếu có.'
						}
						onClick={() => void deleteDraft(row)}
					>
						<Trash2 size={14} />
						Xóa
					</ActionButton>
				)}
				{availableActions(row).map((a) => (
					<ActionButton
						key={a.name + (a.decision || '')}
						disabled={busy}
						variant={
							a.name === 'cancel' || a.decision === 'REJECT'
								? 'danger'
								: isFinalAction(a)
									? 'primary'
									: 'secondary'
						}
						onClick={() => action(row, a)}
					>
						{isFinalAction(a) && <Check size={14} />} {a.label}
					</ActionButton>
				))}
			</div>
		);
	}
	const searchControls = (
		<div className="wms-toolbar">
			{canSearch && (
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
						key={search}
						name="q"
						defaultValue={search}
						maxLength={100}
						aria-label={
							kind === 'orders' ? 'Tìm theo mã đơn hàng' : 'Tìm theo mã hoặc tên'
						}
						placeholder={
							kind === 'orders' ? 'Tìm theo mã đơn hàng' : 'Tìm theo mã hoặc tên'
						}
						className={inputStyle}
					/>
					<button className="wms-button shrink-0">
						Tìm
					</button>
				</form>
			)}
			<div className="flex min-w-0 flex-wrap items-center gap-2">
				{statuses.length > 0 && (
					<select
						aria-label="Lọc trạng thái"
						value={status}
						onChange={(e) => {
							setStatus(e.target.value);
							setPage(1);
						}}
						className={inputStyle + ' w-auto max-w-full'}
					>
						<option value="">Tất cả trạng thái</option>
						{statuses.map((v) => (
							<option key={v} value={v}>
								{config.statusLabels?.[v] || statusLabels[v]}
							</option>
						))}
					</select>
				)}
				{allowed(createPermission) && (
					<button
						onClick={() => edit(null)}
						className="wms-button wms-button--primary shrink-0"
					>
						<Plus size={16} />
						Thêm mới
					</button>
				)}
			</div>
		</div>
	);
	return (
		<AppLayout title={kind === 'warehouses' ? 'Vị trí lưu kho' : config.title}>
			<div className="space-y-5">
				{kind === 'warehouses' && searchControls}
				{kind === 'warehouses' && (
					<LocationOverview
						key={locationsRevision}
						search={search}
						statusFilter={status}
						onManage={allowed('warehouses.write') ? showLocations : undefined}
					/>
				)}
				{toolbar}
				{kind === 'materialIssues' && <MaterialAssignmentsPage inline readOnly />}
				{kind === 'plans' && allowed('plans.create') && <PlanInbox audience="PLANNING" />}
				{kind === 'purchases' && allowed('purchases.create') && (
					<PlanInbox
						audience="PURCHASING"
						onPurchase={(plan) => {
							setDialog({});
							setError('');
							setForm({
								...empty(config.fields),
								planId: plan.id,
								lines: plan.lines.flatMap((l) =>
									l.materialDemands
										.filter((m) => /[1-9]/.test(m.purchaseRequiredBase || ''))
										.map((m) => ({
											demandId: m.id,
											materialId: m.materialId,
											unitId: m.unitId,
											quantity: m.purchaseRequiredBase,
											unitPrice: ''
										}))
								)
							});
						}}
					/>
				)}
				{error && !dialog && !detail && !locationWarehouse && (
					<div
						role="alert"
						className="wms-notice wms-tone-danger"
					>
						{error}
					</div>
				)}
				{notice && (
					<div
						role="status"
						className="wms-notice wms-tone-success"
					>
						{notice}
					</div>
				)}
				{kind !== 'warehouses' && searchControls}
				{kind === 'materialIssues' && (
					<p className="wms-notice wms-tone-info">
						{allowed('issues.allocate')
							? 'Lập và gửi phiếu để giữ tồn và chuyển cho nhân viên. Nhân viên tiếp nhận thành công thì hệ thống tự động trừ tồn kho.'
							: 'Mở Chi tiết để kiểm tra nguyên liệu, lô, vị trí và số lượng. Bấm Tiếp nhận phiếu để xuất kho và trừ tồn theo phiếu được giao.'}
					</p>
				)}
				{kind !== 'warehouses' && (
					<div className="wms-panel">
						<div className="overflow-x-auto">
							<table
								className="wms-table responsive-records"
								role="table"
								aria-label={config.title}
							>
								<thead role="rowgroup">
									<tr role="row">
										{config.columns.map((k) => (
											<th
												key={k}
												scope="col"
												role="columnheader"
												className={
													isQuantityField(k) || isMoneyField(k)
														? 'wms-table-number'
														: undefined
												}
											>
												{fieldLabels[k] || k}
											</th>
										))}
										<th scope="col" role="columnheader">Thao tác</th>
									</tr>
								</thead>
								<tbody role="rowgroup">
									{loading ? (
										<tr role="row">
											<td
												role="cell"
												colSpan={config.columns.length + 1}
												className="wms-table-message"
											>
												<span role="status">Đang tải dữ liệu…</span>
											</td>
										</tr>
									) : !rows.length ? (
										<tr role="row">
											<td
												role="cell"
												colSpan={config.columns.length + 1}
												className="wms-table-message"
											>
												{listError ? (
													<button type="button" className="wms-button" onClick={load}>
														Thử tải lại danh sách
													</button>
												) : search || status ? (
													'Không có bản ghi phù hợp với bộ lọc.'
												) : (
													'Chưa có bản ghi.'
												)}
											</td>
										</tr>
									) : (
										rows.map((row) => (
											<tr
												key={row.id}
												role="row"
												className="responsive-record hover:bg-slate-50/60"
											>
												{config.columns.map((k, index) => (
													<td
														key={k}
														role="cell"
														data-label={fieldLabels[k] || k}
														className={
															index === 0
																? 'responsive-key font-semibold'
																: isQuantityField(k) || isMoneyField(k)
																	? 'wms-table-number'
																	: undefined
														}
													>
														{k === 'status' ||
														k === 'materialStatus' ? (
															<Badge variant={statusTones[row[k]] || 'neutral'}>
																{config.statusLabels?.[row[k]] ||
																	statusLabels[row[k]] ||
																	row[k]}
															</Badge>
														) : (
															cellValue(row, k)
														)}
													</td>
												))}
												<td role="cell" className="responsive-actions">
													{rowActions(row)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
						<div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 text-sm text-slate-600">
							<span>Tổng {total} bản ghi</span>
							<div className="flex items-center gap-3">
								<button
									aria-label="Trang trước"
									className="wms-button wms-button--icon"
									disabled={page === 1}
									onClick={() => setPage((p) => p - 1)}
								>
									<ChevronLeft size={18} />
								</button>
								<span>Trang {page}</span>
								<button
									aria-label="Trang sau"
									className="wms-button wms-button--icon"
									disabled={page * 20 >= total}
									onClick={() => setPage((p) => p + 1)}
								>
									<ChevronRight size={18} />
								</button>
							</div>
						</div>
					</div>
				)}
				{dialog && (
					<Modal labelledBy="resource-form-title" onClose={() => setDialog(null)}>
						<form
							onSubmit={save}
							className="wms-dialog-panel space-y-5"
						>
							<div className="wms-dialog-header">
								<h2 id="resource-form-title" className="wms-section-title">
									{dialog.id ? 'Cập nhật' : 'Thêm mới'} — {config.title}
								</h2>
								<button
									type="button"
									aria-label="Đóng biểu mẫu"
									className="wms-button wms-button--icon wms-button--ghost shrink-0"
									onClick={() => setDialog(null)}
								>
									<X size={20} />
								</button>
							</div>
							{actionError && (
								<p
									ref={formFeedback}
									tabIndex={-1}
									role="alert"
									className="wms-notice wms-tone-danger"
								>
									{actionError}
								</p>
							)}
							{creatingOrder && (
								<p role="status" className="text-sm text-slate-600">
									{deliveryDefaults.loading
										? 'Đang tải thông tin giao hàng…'
										: deliveryDefaults.error
											? 'Không tải được hồ sơ. Bạn có thể nhập thông tin giao hàng cho đơn này.'
											: hasCompleteDeliveryDefaults
												? 'Thông tin giao hàng đã được điền từ hồ sơ. Bạn có thể sửa cho đơn này.'
												: 'Hãy bổ sung các mục giao hàng còn thiếu. Thông tin đã lưu được tự điền.'}
								</p>
							)}
							{creatingOrder && (
								<p className="text-sm text-slate-600">
									{earliestDueDate
										? 'Ngày giao sớm nhất là ' +
											earliestDueDate.split('-').reverse().join('/') +
											' (sau 7 ngày).'
										: 'Ngày giao phải cách ngày đặt hàng ít nhất 7 ngày.'}
								</p>
							)}
							{kind === 'plans' && !dialog.command ? (
								<ProductionPlanForm
									value={form}
									onChange={setForm}
									lookups={lookups}
									onReadyChange={setPlanningReady}
									editingPlanId={dialog.id}
								/>
							) : kind === 'materialIssues' && !dialog.id && !dialog.command ? (
								<MaterialIssueCreate
									value={form}
									onChange={setForm}
									lookups={lookups}
									onReadyChange={setMaterialIssueReady}
								/>
							) : kind === 'saleIssues' && !dialog.command ? (
								<SaleIssueForm
									value={form}
									onChange={setForm}
									lookups={lookups}
									onReadyChange={setSaleIssueReady}
									editing={!!dialog.id}
								/>
							) : kind === 'materialRequests' && !dialog.command ? (
								<MaterialRequestForm value={form} onChange={setForm} />
							) : kind === 'purchases' && !dialog.command ? (
								<PurchaseForm value={form} onChange={setForm} lookups={lookups} />
							) : (
								<Fields
									fields={formFields}
									value={formValues}
									onChange={setForm}
									lookups={lookups}
								/>
							)}
							<div className="wms-dialog-footer">
								<button
									type="button"
									onClick={() => setDialog(null)}
									className="wms-button"
								>
									Hủy
								</button>
								<button
									disabled={
										busy ||
										(creatingOrder && deliveryDefaults.loading) ||
										(kind === 'saleIssues' &&
											!dialog.command &&
											!saleIssueReady) ||
										(kind === 'plans' && !dialog.command && !planningReady) ||
										(kind === 'materialIssues' &&
											!dialog.id &&
											!dialog.command &&
											!materialIssueReady)
									}
									className="wms-button wms-button--primary"
								>
									{busy
										? 'Đang lưu…'
										: kind === 'materialIssues' && !dialog.command
											? 'Lập và gửi phiếu'
											: 'Lưu'}
								</button>
							</div>
						</form>
					</Modal>
				)}
				{detail && (
					<Modal labelledBy="resource-detail-title" onClose={() => setDetail(null)}>
						<div className="wms-dialog-panel space-y-4">
							<div className="wms-dialog-header">
								<div className="min-w-0 space-y-2">
									<h2 id="resource-detail-title" className="wms-section-title">
										Chi tiết {config.title.toLowerCase()}
									</h2>
									<div className="flex flex-wrap items-center gap-2">
										{detail.code && <span className="break-all text-sm font-semibold">{detail.code}</span>}
										{detail.status && (
											<Badge variant={statusTones[detail.status] || 'neutral'}>
												{config.statusLabels?.[detail.status] || statusLabels[detail.status] || detail.status}
											</Badge>
										)}
									</div>
								</div>
								<button aria-label="Đóng chi tiết" className="wms-button wms-button--icon wms-button--ghost shrink-0" onClick={() => setDetail(null)}>
									<X />
								</button>
							</div>
							{error && (
								<p role="alert" className="wms-notice wms-tone-danger">
									{error}
								</p>
							)}
							<RecordSummary kind={kind} record={detail} resolve={referenceName} />
							{renderDetail?.(detail)}
							{kind === 'plans' ? (
								<>
									<ProductionPlanDetail record={detail} />
									{kind === 'plans' &&
										detail.status === 'CHO_DUYET' &&
										allowed('plans.decide') && (
											<div className="wms-dialog-footer">
												{[...(config.actions || [])]
													.filter((a) => a.permission === 'plans.decide')
													.sort(
														(a, b) =>
															Number(a.decision === 'APPROVE') -
															Number(b.decision === 'APPROVE')
													)
													.map((a) => (
														<ActionButton
															key={a.decision}
															disabled={busy}
															variant={
																a.decision === 'REJECT'
																	? 'danger'
																	: 'primary'
															}
															onClick={() => {
																if (a.fields) setDetail(null);
																void action(detail, a);
															}}
														>
															{a.label}
														</ActionButton>
													))}
											</div>
										)}
								</>
							) : (
								(kind === 'materialLots'
									? [
											...config.fields,
											{
												name: 'storageLocations',
												label: fieldLabels.storageLocations
											}
										]
									: config.fields
								).map((f) => (
									<section key={f.name}>
										<h3 className="text-sm font-semibold text-slate-500">
											{f.label}
										</h3>
										{f.type === 'array' ? (
											<div className="overflow-auto">
												<table className="wms-table responsive-records" role="table" aria-label={f.label}>
													<thead role="rowgroup">
														<tr role="row">
															{f.fields.map((c) => (
																<th
																	key={c.name}
																	scope="col"
																	role="columnheader"
																>
																	{c.label}
																</th>
															))}
														</tr>
													</thead>
													<tbody role="rowgroup">
														{detail[f.name]?.map((row, i) => (
															<tr key={i} role="row" className="responsive-record">
																{f.fields.map((c) => (
																	<td
																		key={c.name}
																		role="cell"
																		data-label={c.label}
																	>
																		{Array.isArray(row[c.name])
																			? row[c.name]
																					.map(
																						(m) =>
																							(m.materialName ||
																								m.materialId) +
																							': ' +
																							formatQuantity(
																								m.quantityBase
																							) +
																							' ' +
																							(m.unitName ||
																								'')
																					)
																					.join('; ')
																			: c.name.endsWith('Id')
																				? referenceName(
																						c.name,
																						row[c.name],
																						row
																					)
																				: displayNumber(
																						c.name,
																						row[c.name]
																					)}
																	</td>
																))}
															</tr>
														))}
													</tbody>
												</table>
											</div>
										) : (
											<p
												className={
													'text-sm py-2 ' +
													(f.type === 'textarea'
														? 'whitespace-pre-wrap'
														: '')
												}
											>
												{typeof detail[f.name] === 'boolean'
													? detail[f.name]
														? 'Có'
														: 'Không'
													: kind === 'purchases' &&
														  f.name === 'supplierId'
														? detail.supplierName
														: kind === 'purchases' &&
															  f.name === 'planId'
															? detail.planCode
															: f.name.endsWith('Id') ||
																  (kind === 'materialLots' &&
																		f.name ===
																			'storageLocations')
																? cellValue(detail, f.name)
																: displayNumber(
																		f.name,
																		detail[f.name]
																	)}
											</p>
										)}
									</section>
								))
							)}
							{kind === 'materialIssues' && (
								<section className="border-t border-slate-200 pt-4 space-y-3">
									{detail.status === 'DA_XAC_NHAN' && (
										<p className="text-sm text-slate-500">
											Nhân viên được giao tiếp nhận phiếu để xuất nguyên liệu
											và trừ tồn kho.
										</p>
									)}
									<div className="wms-dialog-footer">
										{availableActions(detail).map((a) => (
											<ActionButton
												key={a.name}
												disabled={busy}
												variant={
													a.name === 'post-material'
														? 'primary'
														: a.name === 'cancel'
															? 'danger'
															: 'secondary'
												}
												onClick={() => {
													if (a.fields) setDetail(null);
													void action(detail, a);
												}}
											>
												{a.label}
											</ActionButton>
										))}
									</div>
								</section>
							)}
						</div>
					</Modal>
				)}
				{locationWarehouse && (
					<Modal
						labelledBy="resource-locations-title"
						onClose={() => setLocationWarehouse(null)}
					>
						<div className="wms-dialog-panel space-y-4">
							<div className="wms-dialog-header">
								<h2 id="resource-locations-title" className="wms-section-title">
									Vị trí — {locationWarehouse.name}
								</h2>
								<button
									aria-label="Đóng vị trí lưu kho"
									onClick={() => setLocationWarehouse(null)}
								>
									<X />
								</button>
							</div>
							{locations.map((l) => (
								<div
									key={l.id}
									className="border border-slate-200 rounded-xl p-3 text-sm"
								>
									{l.name} · sức chứa {formatQuantity(l.capacity)} · đã dùng{' '}
									{formatQuantity(l.occupiedCapacity)} · {statusLabels[l.status]}
									{allowed('warehouses.write') &&
										locationWarehouse.status === 'ACTIVE' && (
											<span className="ml-3 inline-flex flex-wrap gap-2">
												{l.status === 'ACTIVE' && (
													<ActionButton
														disabled={busy}
														onClick={() => setLocationEdit(l)}
													>
														Sửa
													</ActionButton>
												)}
												{!l.retired && (
													<ActionButton
														variant={
															l.status === 'ACTIVE'
																? 'danger'
																: 'secondary'
														}
														disabled={busy}
														onClick={() => void changeLocationStatus(l)}
													>
														{l.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
													</ActionButton>
												)}
												{l.retired && (
													<span className="text-slate-500">
														Đã ngưng sử dụng, giữ lịch sử
													</span>
												)}
											</span>
										)}
								</div>
							))}
							{allowed('warehouses.write') &&
								locationWarehouse.status === 'ACTIVE' && (
									<form
										key={locationEdit?.id || 'new'}
										onSubmit={addLocation}
										className="grid grid-cols-2 gap-3"
									>
										<input
											required
											name="code"
											defaultValue={locationEdit?.code || ''}
											placeholder="Mã vị trí"
											className={inputStyle}
										/>
										<input
											required
											name="name"
											defaultValue={locationEdit?.name || ''}
											placeholder="Tên vị trí"
											className={inputStyle}
										/>
										<input
											required
											name="capacity"
											defaultValue={locationEdit?.capacity || ''}
											placeholder="Sức chứa"
											className={inputStyle}
										/>
										<input
											type="hidden"
											name="capacityUnitId"
											value={locationWarehouse.capacityUnitId}
										/>
										<input
											name="area"
											defaultValue={locationEdit?.area || ''}
											placeholder="Khu vực"
											className={inputStyle}
										/>
										<button
											disabled={busy}
											className="wms-button wms-button--primary"
										>
											{locationEdit ? 'Lưu vị trí' : 'Thêm vị trí'}
										</button>
									</form>
								)}
							{error && (
								<p role="alert" className="text-rose-600 text-sm">
									{error}
								</p>
							)}
						</div>
					</Modal>
				)}
			</div>
		</AppLayout>
	);
}
