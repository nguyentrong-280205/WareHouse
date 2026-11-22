import { useCallback, useEffect, useState } from 'react';
import api from '../services/apiClient';
import ActionButton from '../components/ActionButton';
import Modal from '../components/common/Modal';
import ProductionPlanDetail from './ProductionPlanDetail';
import RecordSummary from './RecordSummary';
import PurchaseRequirementDetail from './PurchaseRequirementDetail';
import { formatQuantity } from '../utils/formatNumber';
import { useReadRequest, readError } from './useReadRequest';

export default function PlanInbox({ audience, onPurchase }) {
	const [detail, setDetail] = useState(null),
		[page, setPage] = useState(1);
	const fetchQueue = useCallback(
		async (signal) => {
			const r = await api.get('/v1/production-plans/receiving-queue', {
				signal,
				params: { audience, page, pageSize: 10 }
			});
			if (!signal.aborted) setDetail(null);
			return r.data;
		},
		[audience, page]
	);
	const request = useReadRequest([audience, page], fetchQueue),
		data = request.data?.data || [],
		total = request.data?.meta.total || 0,
		loading = request.loading,
		error = readError(request, 'Không tải được danh sách tiếp nhận.'),
		load = request.reload;
	useEffect(() => {
		if (detail) return;
		const refresh = () => {
			if (!document.hidden) void load();
		};
		window.addEventListener('focus', refresh);
		document.addEventListener('visibilitychange', refresh);
		return () => {
			window.removeEventListener('focus', refresh);
			document.removeEventListener('visibilitychange', refresh);
		};
	}, [load, detail]);
	const title = {
		PURCHASING: 'Yêu cầu mua nguyên liệu thiếu từ kế hoạch đã duyệt',
		WORKSHOP: 'Kế hoạch đủ điều kiện yêu cầu cấp nguyên liệu — xưởng tiếp nhận',
		PLANNING: 'Kế hoạch bị từ chối — phản hồi từ ban giám đốc'
	}[audience];
	return (
		<section className="rounded-2xl border border-blue-100 bg-white p-4 space-y-3 text-sm">
			<div className="flex justify-between gap-3">
				<h2 className="font-semibold">{title}</h2>
				<ActionButton disabled={loading} onClick={() => void load()}>
					Tải lại
				</ActionButton>
			</div>
			<p className="text-xs text-slate-500">
				{audience === 'PURCHASING'
					? 'Nhận danh sách nguyên vật liệu thiếu để lập đơn mua, không phụ thuộc phạm vi xưởng.'
					: 'Chỉ hiển thị phiếu trong phạm vi xưởng được cấp. Với kế hoạch thiếu nguyên liệu, phải có đơn mua bổ sung đã được duyệt đủ lượng; xuất kho vẫn kiểm tồn thực tế.'}
			</p>
			{error && (
				<p role="alert" className="text-rose-700">
					{error}
				</p>
			)}
			{!loading && !data.length && (
				<p className="text-slate-500">Chưa có phiếu thuộc phạm vi của bạn cần tiếp nhận.</p>
			)}
			{data.map((plan) => (
				<div key={plan.id} className="border-t border-slate-100 pt-3 space-y-2">
					<p className="font-medium break-words">{plan.code}</p>
					{audience !== 'PURCHASING' && (
						<p>{plan.lines.map((l) => l.productName).join('; ')}</p>
					)}
					{audience === 'PLANNING' ? (
						<p className="text-rose-700 whitespace-pre-wrap">
							Lý do từ chối: {plan.rejectionReason}
						</p>
					) : (
						audience === 'PURCHASING' && (
							<ul className="list-disc pl-5">
								{plan.materialShortages.map((m) => (
									<li key={m.materialId}>
										{m.materialName}: thiếu {formatQuantity(m.shortageBase)}{' '}
										{m.unitName}
									</li>
								))}
							</ul>
						)
					)}
					<div className="flex flex-wrap gap-2">
						<ActionButton onClick={() => setDetail(plan)}>Chi tiết</ActionButton>
						{audience === 'PURCHASING' && onPurchase && (
							<ActionButton
								variant="primary"
								disabled={
									!plan.lines.some((l) =>
										l.materialDemands.some((m) =>
											/[1-9]/.test(m.purchaseRequiredBase || '')
										)
									)
								}
								onClick={() => onPurchase(plan)}
							>
								Lập đơn mua phần còn thiếu
							</ActionButton>
						)}
					</div>
				</div>
			))}
			{total > 10 && (
				<div className="flex gap-3">
					<ActionButton
						disabled={page === 1 || loading}
						onClick={() => setPage((p) => p - 1)}
					>
						Trước
					</ActionButton>
					<span>Trang {page}</span>
					<ActionButton
						disabled={page * 10 >= total || loading}
						onClick={() => setPage((p) => p + 1)}
					>
						Sau
					</ActionButton>
				</div>
			)}
			{detail && (
				<Modal labelledBy="plan-inbox-detail" onClose={() => setDetail(null)}>
					<div className="wms-dialog-panel space-y-4">
						<div className="wms-dialog-header">
							<h3 id="plan-inbox-detail" className="wms-section-title">
								{audience === 'PURCHASING'
									? 'Chi tiết yêu cầu nguyên vật liệu'
									: 'Chi tiết kế hoạch tiếp nhận'}
							</h3>
							<ActionButton onClick={() => setDetail(null)}>Đóng</ActionButton>
						</div>
						{audience === 'PURCHASING' ? (
							<PurchaseRequirementDetail record={detail} />
						) : (
							<>
								<RecordSummary kind="plans" record={detail} />
								<ProductionPlanDetail record={detail} />
							</>
						)}
					</div>
				</Modal>
			)}
		</section>
	);
}
