import DependentSelect from './DependentSelect';
import EvidencePicker from './EvidencePicker';
import QuantityInput from '../components/QuantityInput';
import { empty } from './formModel';
import { recordName, displayLabel } from './referenceNames';
import { formatQuantity } from '../utils/formatNumber';
import {
	defaultProductExpiry,
	palletBaseQuantity,
	orderPackaging,
	convertedProductQuantity
} from './productCatalog';
const inputStyle =
	'wms-input';
export default function Fields({ fields, value, onChange, lookups, root = value }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{fields.map((f) => {
				if (
					f.type === 'hidden' ||
					(f.name === 'cartonsPerPallet' && value.unitCode !== 'PALLET')
				)
					return null;
				if (f.type === 'array')
					return (
						<fieldset
							key={f.name}
							className="sm:col-span-2 rounded-xl border border-slate-200 p-4 space-y-4"
						>
							<legend className="font-semibold text-sm px-2">{f.label}</legend>
							{(value[f.name] || []).map((row, i) => (
								<div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2">
									<Fields
										fields={f.fields}
										value={row}
										root={root}
										lookups={lookups}
										onChange={(next) =>
											onChange({
												...value,
												[f.name]: value[f.name].map((r, j) =>
													i === j ? next : r
												)
											})
										}
									/>
									<button
										type="button"
										onClick={() =>
											onChange({
												...value,
												[f.name]: value[f.name].filter((_, j) => i !== j)
											})
										}
										className="text-xs text-rose-600"
									>
										Xóa dòng
									</button>
								</div>
							))}
							<button
								type="button"
								className="text-sm text-blue-600 font-semibold"
								onClick={() =>
									onChange({
										...value,
										[f.name]: [...(value[f.name] || []), empty(f.fields)]
									})
								}
							>
								+ Thêm dòng
							</button>
						</fieldset>
					);
				if (f.type === 'material-base-unit') {
					const material = (lookups['/lookups/materials'] || []).find(
						(m) => m.id === value.materialId
					);
					const unit = (lookups[f.lookup] || []).find(
						(u) => u.id === (material?.baseUnitId || value.unitId)
					);
					return (
						<label key={f.name} className="space-y-1.5 text-sm text-slate-700">
							<span className="block font-medium">{f.label} *</span>
							<input
								readOnly
								aria-readonly="true"
								value={unit ? unit.name : ''}
								placeholder="Tự điền theo nguyên liệu"
								className={inputStyle + ' bg-slate-50 text-slate-600'}
							/>
							<span className="block text-xs text-slate-500">
								Đơn vị cố định của nguyên liệu, không được thay đổi trong đơn mua.
							</span>
						</label>
					);
				}
				if (f.type === 'stock-lot-readonly') {
					const balance = (lookups['/inventory'] || []).find(
						(b) =>
							String(b.lotId) === String(value.lotId) &&
							b.lotKind === value.lotKind &&
							String(b.locationId) === String(value.locationId) &&
							String(b.warehouseId) === String(root.warehouseId) &&
							(!value._balance || String(b.id) === String(value._balance))
					);
					return (
						<label key={f.name} className="space-y-1.5 text-sm text-slate-700">
							<span className="block font-medium">{f.label} *</span>
							<input
								readOnly
								aria-readonly="true"
								value={balance?.lotCode || ''}
								placeholder="Tự điền khi chọn tồn lô/vị trí"
								className={inputStyle + ' bg-slate-50 text-slate-600'}
							/>
						</label>
					);
				}
				if (f.type === 'material-lot-code')
					return (
						<label key={f.name} className="space-y-1.5 text-sm text-slate-700">
							<span className="block font-medium">Mã lô</span>
							<input
								readOnly
								aria-readonly="true"
								value={
									value[f.name] && value[f.name] !== 'AUTO' ? value[f.name] : ''
								}
								placeholder="Tự tạo khi lưu, ví dụ LO-DUONG-01"
								className={inputStyle + ' bg-slate-50 text-slate-600'}
							/>
							<span className="block text-xs text-slate-500">
								Mỗi lô gắn với một nguyên liệu; mã được cấp theo nguyên liệu.
							</span>
						</label>
					);
				if (f.type === 'fixed-material-issue-unit') {
					const source = (lookups['/lookups/allocation-sources'] || [])
						.find(
							(r) =>
								r.family === 'ISSUE' &&
								r.kind === root.kind &&
								String(r.id) === String(root.sourceId)
						)
						?.lines?.find((l) => String(l.id) === String(value.sourceLineId));
					const unit = (lookups['/lookups/units'] || []).find(
						(u) => String(u.id) === String(source?.unitId || value.unitId)
					);
					return (
						<label key={f.name} className="space-y-1.5 text-sm text-slate-700">
							<span className="block font-medium">{f.label} *</span>
							<input
								readOnly
								aria-readonly="true"
								value={source?.unitName || unit?.name || ''}
								placeholder="Tự điền theo nguyên liệu"
								className={inputStyle + ' bg-slate-50 text-slate-600'}
							/>
							<span className="block text-xs text-slate-500">
								Đơn vị cơ sở cố định của nguyên liệu.
							</span>
						</label>
					);
				}
				let options = f.options?.map((v) => ({ value: v, label: displayLabel(v) }));
				const products = lookups['/lookups/products'] || lookups['/products'] || [];
				const selectedProduct = products.find(
					(p) => String(p.id) === String(value.productId || value.itemId)
				);
				const today = new Intl.DateTimeFormat('en-CA', {
					timeZone: 'Asia/Ho_Chi_Minh',
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				}).format(new Date());
				const compatiblePackaging = orderPackaging(selectedProduct, today);
				const selectedPackaging = compatiblePackaging.find(
					(p) => String(p.id) === String(value.packagingVersionId)
				);
				if (f.name === 'unitCode')
					options = (lookups[f.lookup] || [])
						.filter((u) =>
							[
								root.containerType === 'CAN' ? 'CAN' : 'BOTTLE',
								'PACK',
								'CARTON',
								'PALLET'
							].includes(u.code)
						)
						.map((u) => ({ value: u.code, label: u.name }));
				if (f.name === 'quantity' && fields.some((field) => field.productUnits)) {
					const converted = convertedProductQuantity(
						value.quantity,
						selectedPackaging?.unitsPerPack
					);
					const base = lookups['/lookups/units']?.find(
						(u) => String(u.id) === String(selectedProduct?.baseUnitId)
					);
					return (
						<label key={f.name} className="space-y-1.5 text-sm text-slate-700">
							<span className="block font-medium">{f.label} *</span>
							<QuantityInput
								required
								value={value.quantity || ''}
								onChange={(next) => onChange({ ...value, quantity: next })}
								className={inputStyle}
							/>
							<span className="block text-xs text-slate-500">
								{converted
									? `Số lượng quy đổi: ${formatQuantity(converted)} ${base?.name?.toLowerCase() || 'đơn vị cơ sở'}`
									: 'Chọn quy cách và nhập số lượng quy đổi ra chai/lon nguyên.'}
							</span>
						</label>
					);
				}
				const records = (lookups[f.lookup] || []).filter(
					(r) =>
						(!f.dimension || f.dimension.includes(r.dimension)) &&
						(!f.filter || Object.entries(f.filter).every(([k, v]) => r[k] === v)) &&
						(!f.filterFrom ||
							Object.entries(f.filterFrom).every(
								([k, v]) => String(r[k]) === String(root[v])
							)) &&
						(!f.filterLocalFrom ||
							Object.entries(f.filterLocalFrom).every(
								([k, v]) => String(r[k]) === String(value[v])
							)) &&
						(!f.productUnits ||
							compatiblePackaging.some((p) => String(p.unitId) === String(r.id))) &&
						(!f.productBaseUnit ||
							(value.containerType
								? r.code === (value.containerType === 'CAN' ? 'CAN' : 'BOTTLE')
								: ['BOTTLE', 'CAN'].includes(r.code)))
				);
				if (f.lookup && f.name !== 'unitCode')
					options = records.map((r) => ({
						value: String(r[f.valueKey || 'id']),
						label: recordName(r)
					}));
				if (f.type === 'child-select')
					options = (
						lookups[f.lookup]?.find((r) => String(r.id) === String(root[f.parent]))?.[
							f.collection
						] || []
					).map((r) => ({
						value: String(r.id),
						label: `${r.materialName || r.productName || (lookups['/lookups/materials'] || lookups['/materials'] || []).find((m) => String(m.id) === String(r.materialId))?.name || 'Mặt hàng'} — ${formatQuantity(r.purchaseRequiredBase ?? r.requiredBase ?? r.qtyRequired ?? r.quantityBase ?? '')}`
					}));
				if (f.type === 'delivery-line')
					options = records
						.filter((r) => String(r.orderId) === String(root.orderId))
						.flatMap((r) => r.lines)
						.map((r) => ({
							value: String(r.id),
							label: `Giao ${r.id} — lô ${r.productLotId} — đã giao ${r.quantityDeliveredBase}`
						}));
				if (f.type === 'record-line')
					options = (root._record?.[f.collection] || []).map((r) => ({
						value: String(r[f.valueKey || 'id']),
						label: `Dòng ${r[f.valueKey || 'id']} — đã xuất ${r.quantityDispatchedBase || ''}, đã giao ${r.quantityDeliveredBase || ''}`
					}));
				if (f.type === 'qc-source-line' || f.type === 'qc-source-lot') {
					const rework = lookups['/lookups/rework-batches']?.find(
						(r) =>
							String(r.id) === String(root.reworkBatchId) &&
							r.sourceQcType === f.sourceType
					);
					const source = (lookups['/lookups/qc-sources'] || []).find(
						(r) => r.kind === f.sourceType && String(r.id) === String(root.sourceId)
					);
					const lines = rework
						? [
								{
									id: rework.id,
									lotId: rework.lotId,
									remainingBase: rework.remainingBase
								}
							]
						: source?.lines || [];
					options = (
						f.type === 'qc-source-line'
							? lines
							: lines.filter((l) => String(l.id) === String(value.sourceLineId))
					).map((l) => ({
						value: String(f.type === 'qc-source-line' ? l.id : l.lotId),
						label: `${f.type === 'qc-source-line' ? 'Dòng' : 'Lô'} ${f.type === 'qc-source-line' ? l.id : l.lotId} — còn kiểm ${l.remainingBase}`
					}));
				}
				if (f.type === 'receipt-qc')
					options = records
						.filter(
							(r) =>
								r.family === 'RECEIPT' &&
								(root.kind === 'REJECTED'
									? r.kind ===
										{
											MATERIAL: 'MATERIAL',
											PRODUCT: 'FINISHED',
											RETURN: 'RETURN'
										}[root.sourceQcType]
									: r.kind === root.kind)
						)
						.map((r) => ({
							value: String(r.id),
							label: `QC ${r.id} — lô ${r.lotId} — đạt ${r.acceptedBase}, lỗi ${r.rejectedBase}`
						}));
				if (f.type === 'stock-balance') {
					const source = (lookups['/lookups/allocation-sources'] || [])
						.find(
							(r) =>
								r.family === 'ISSUE' &&
								r.kind === root.kind &&
								String(r.id) === String(root.sourceId)
						)
						?.lines?.find((l) => String(l.id) === String(value.sourceLineId));
					const locations =
						(lookups['/lookups/warehouses'] || []).find(
							(w) => String(w.id) === String(root.warehouseId)
						)?.locations || [];
					options = records
						.filter(
							(r) =>
								r.lotKind === value.lotKind &&
								r.qualityBucket === 'DAT' &&
								String(r.warehouseId) === String(root.warehouseId) &&
								(!source ||
									String(r.itemId) ===
										String(source.materialId || source.productId))
						)
						.map((r) => ({
							value: String(r.id),
							label: `${r.itemName} — ${r.lotCode} — ${locations.find((v) => String(v.id) === String(r.locationId))?.name || 'vị trí ' + r.locationId} — khả dụng ${formatQuantity(r.available)}${r.expiresOn ? ' — HSD ' + r.expiresOn : ''}`
						}));
				}
				if (f.type === 'issue-source')
					options = records
						.filter((r) => r.family === 'ISSUE' && r.kind === root.kind)
						.map((r) => ({ value: String(r.id), label: r.code }));
				if (f.type === 'issue-line')
					options = (
						records.find(
							(r) =>
								r.family === 'ISSUE' &&
								r.kind === root.kind &&
								String(r.id) === String(root.sourceId)
						)?.lines || []
					).map((l) => ({
						value: String(l.id),
						label: `${[l.materialCode || l.productCode, l.materialName || l.productName || 'Chưa có tên mặt hàng'].filter(Boolean).join(' — ')} — ${formatQuantity(l.quantityBase)} ${l.unitName || ''}`
					}));
				if (f.type === 'multi-child' || f.type === 'location') {
					const warehouse = lookups[f.lookup]?.find(
						(r) => String(r.id) === String(root[f.parent || 'warehouseId'])
					);
					const receipt = (lookups['/lookups/allocation-sources'] || []).find(
						(r) =>
							r.family === 'RECEIPT' &&
							r.lotKind === 'MATERIAL' &&
							String(r.id) === String(value.qcLineId)
					);
					let locations = warehouse?.[f.collection || 'locations'] || [];
					if (
						f.type === 'location' &&
						(root.kind === 'MATERIAL' ||
							(root.kind === 'REJECTED' && root.sourceQcType === 'MATERIAL')) &&
						warehouse?.materialLocationRulesEnabled &&
						value.qcLineId &&
						receipt?.itemId
					)
						locations = locations.filter((loc) =>
							(loc.allowedMaterialIds || []).includes(String(receipt.itemId))
						);
					options = locations.map((r) => ({ value: String(r.id), label: recordName(r) }));
				}
				if (f.type.startsWith('multi'))
					return (
						<fieldset key={f.name} className="rounded-xl border border-slate-200 p-3">
							<legend className="text-sm font-medium px-1">{f.label}</legend>
							<div className="space-y-2 max-h-48 overflow-auto">
								{options?.map((o) => (
									<label
										key={o.value}
										className="flex items-center gap-2 text-sm"
									>
										<input
											type="checkbox"
											checked={(value[f.name] || []).includes(o.value)}
											onChange={(e) =>
												onChange({
													...value,
													[f.name]: e.target.checked
														? [...(value[f.name] || []), o.value]
														: (value[f.name] || []).filter(
																(v) => v !== o.value
															)
												})
											}
										/>
										{o.label}
									</label>
								))}
							</div>
						</fieldset>
					);
				if (f.type === 'evidence')
					return (
						<fieldset
							key={f.name}
							className="sm:col-span-2 border border-slate-200 rounded-xl p-3"
						>
							<legend className="text-sm font-medium px-1">{f.label}</legend>
							<EvidencePicker
								value={value[f.name] || []}
								onChange={(next) => onChange({ ...value, [f.name]: next })}
								stocktakeId={f.stocktakeField ? root[f.stocktakeField] : undefined}
								issueId={f.issueField ? root[f.issueField] : undefined}
								warehouseId={
									root[f.warehouseField || 'warehouseId'] ||
									root._record?.warehouseId
								}
							/>
						</fieldset>
					);
				if (f.type === 'packaging') {
					options = compatiblePackaging
						.filter((p) => !value.unitId || String(p.unitId) === String(value.unitId))
						.map((p) => {
							const unit = lookups['/lookups/units']?.find(
								(u) => String(u.id) === String(p.unitId)
							);
							const base = lookups['/lookups/units']?.find(
								(u) => String(u.id) === String(selectedProduct.baseUnitId)
							);
							return {
								value: String(p.id),
								label: `${unit?.name || p.unitCode || 'Quy cách'} × ${formatQuantity(p.unitsPerPack)} ${base?.name?.toLowerCase() || 'đơn vị cơ sở'} — v${p.revision}`
							};
						});
				}
				const set = (next) => {
					const packaging = (lookups['/lookups/products'] || lookups['/products'] || [])
						.find((p) => String(p.id) === String(value.productId || value.itemId))
						?.packaging?.find((p) => String(p.id) === String(next));
					const candidates =
						f.type === 'receipt-qc'
							? records.filter(
									(r) =>
										r.family === 'RECEIPT' &&
										(root.kind === 'REJECTED'
											? r.kind ===
												{
													MATERIAL: 'MATERIAL',
													PRODUCT: 'FINISHED',
													RETURN: 'RETURN'
												}[root.sourceQcType]
											: r.kind === root.kind)
								)
							: f.type === 'child-select'
								? lookups[f.lookup]?.find(
										(r) => String(r.id) === String(root[f.parent])
									)?.[f.collection] || []
								: f.type === 'delivery-line'
									? records
											.filter(
												(r) => String(r.orderId) === String(root.orderId)
											)
											.flatMap((r) => r.lines)
									: records;
					const chosen = candidates.find((r) => String(r.id) === String(next));
					const reset = {};
					if (f.type === 'receipt-qc' && String(next) !== String(value.qcLineId))
						reset.locationId = '';
					if (f.name === 'sourceLineId' && next !== value.sourceLineId) {
						reset._balance = '';
						reset.lotId = '';
						reset.locationId = '';
						const source = (lookups['/lookups/allocation-sources'] || [])
							.find(
								(r) =>
									r.family === 'ISSUE' &&
									r.kind === root.kind &&
									String(r.id) === String(root.sourceId)
							)
							?.lines?.find((l) => String(l.id) === String(next));
						reset.unitId = source?.unitId ? String(source.unitId) : '';
					}
					if (
						next !== value[f.name] &&
						['productId', 'itemId'].includes(f.name) &&
						fields.some((field) => field.type === 'packaging')
					) {
						reset.packagingVersionId = '';
						if (fields.some((field) => field.productUnits)) reset.unitId = '';
					}
					if (f.productUnits && next !== value[f.name]) reset.packagingVersionId = '';
					if (f.name === 'containerType' && fields.some((field) => field.productBaseUnit))
						reset.baseUnitId = String(
							(lookups['/lookups/units'] || []).find(
								(u) => u.code === (next === 'CAN' ? 'CAN' : 'BOTTLE')
							)?.id || ''
						);
					if (f.name === 'unitCode' && next !== value.unitCode) {
						reset.cartonsPerPallet = '';
						if (next === 'PALLET') reset.unitsPerPack = '';
					}
					if (f.name === 'cartonsPerPallet')
						reset.unitsPerPack = palletBaseQuantity(
							next,
							root.packaging || [],
							value.effectiveFrom
						);
					if (f.name === 'effectiveFrom' && value.unitCode === 'PALLET')
						reset.unitsPerPack = palletBaseQuantity(
							value.cartonsPerPallet,
							root.packaging || [],
							next
						);
					if (
						['itemId', 'manufacturedOn'].includes(f.name) &&
						fields.some((field) => field.autoExpiry)
					) {
						const product = products.find(
							(p) =>
								String(p.id) === String(f.name === 'itemId' ? next : value.itemId)
						);
						reset.expiresOn = defaultProductExpiry(
							f.name === 'manufacturedOn' ? next : value.manufacturedOn,
							Number(product?.shelfLifeDays)
						);
					}
					onChange({
						...value,
						[f.name]: next,
						...reset,
						...(f.type === 'packaging' &&
						packaging &&
						fields.some((field) => field.name === 'unitId')
							? { unitId: String(packaging.unitId) }
							: {}),
						...(chosen && f.copy
							? Object.fromEntries(
									Object.entries(f.copy).map(([target, source]) => [
										target,
										chosen[source]
									])
								)
							: {}),
						...(f.type === 'receipt-qc' && chosen
							? {
									lotId: chosen.lotId,
									lotKind: chosen.lotKind,
									unitId: chosen.unitId
								}
							: {}),
						...(f.type === 'stock-balance' && chosen
							? {
									lotId: chosen.lotId,
									locationId: chosen.locationId,
									unitId: chosen.unitId
								}
							: {})
					});
				};
				if (f.type === 'order-line')
					options = (
						lookups['/lookups/orders']?.find(
							(o) => String(o.id) === String(root.orderId)
						)?.lines || []
					).map((l) => ({
						value: String(l.id),
						label: `Dòng ${l.id} — SKU ${l.productId} — ${formatQuantity(l.qtyBase)} chai/lon`
					}));
				if (f.type === 'bom')
					return (
						<label key={f.name} className="space-y-1.5 text-sm text-slate-700">
							<span className="block font-medium">{f.label} *</span>
							<DependentSelect
								productId={value.productId}
								value={value[f.name]}
								onChange={set}
								className={inputStyle}
							/>
						</label>
					);
				const materialReceiptUnitLocked =
					f.name === 'unitId' &&
					fields.some((x) => x.type === 'receipt-qc') &&
					(root.kind === 'MATERIAL' ||
						(root.kind === 'REJECTED' && root.sourceQcType === 'MATERIAL'));
				return (
					<label
						key={f.name}
						className={
							'space-y-1.5 text-sm text-slate-700 ' +
							(['textarea', 'issue-line', 'stock-balance'].includes(f.type)
								? 'sm:col-span-2'
								: '')
						}
					>
						<span className="block font-medium">
							{f.label}
							{f.optional ? '' : ' *'}
						</span>
						{f.type === 'checkbox' ? (
							<input
								type="checkbox"
								checked={!!value[f.name]}
								onChange={(e) => set(e.target.checked)}
								className="accent-blue-600 w-4 h-4"
							/>
						) : options ? (
							<select
								disabled={
									(f.name === 'itemId' && root._materialLotLocked === true) ||
									materialReceiptUnitLocked
								}
								required={!f.optional}
								value={value[f.name] ?? ''}
								onChange={(e) => set(e.target.value)}
								className={
									inputStyle +
									(materialReceiptUnitLocked ? ' bg-slate-50 text-slate-600' : '')
								}
							>
								<option value="">Chọn {f.label.toLowerCase()}</option>
								{options.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</select>
						) : f.type === 'textarea' ? (
							<textarea
								required={!f.optional}
								maxLength={f.maxLength}
								value={value[f.name] ?? ''}
								readOnly={f.name === 'unitsPerPack' && value.unitCode === 'PALLET'}
								onChange={(e) => set(e.target.value)}
								className={inputStyle}
							/>
						) : f.type === 'decimal' ? (
							<QuantityInput
								required={!f.optional}
								value={value[f.name] ?? ''}
								readOnly={f.name === 'unitsPerPack' && value.unitCode === 'PALLET'}
								onChange={set}
								className={inputStyle}
							/>
						) : (
							<input
								required={!f.optional}
								type={
									f.type === 'date'
										? 'date'
										: f.type === 'datetime'
											? 'datetime-local'
											: f.type === 'integer'
												? 'number'
												: 'text'
								}
								inputMode={
									['integer', 'decimal'].includes(f.type) ? 'decimal' : undefined
								}
								min={f.type === 'integer' ? (f.min ?? 1) : f.min}
								maxLength={f.maxLength}
								value={value[f.name] ?? ''}
								readOnly={f.name === 'unitsPerPack' && value.unitCode === 'PALLET'}
								onChange={(e) => set(e.target.value)}
								className={inputStyle}
							/>
						)}
						{materialReceiptUnitLocked && (
							<span className="block text-xs text-slate-500">
								Đơn vị cơ sở cố định của nguyên liệu, tự điền theo dòng QC đã chọn.
							</span>
						)}
					</label>
				);
			})}
		</div>
	);
}
