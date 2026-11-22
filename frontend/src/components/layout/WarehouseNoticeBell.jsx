import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../services/apiClient';
import { useReadRequest, readError } from '../../features/useReadRequest';
import { noticeRows } from '../../features/live-overview';

export default function WarehouseNoticeBell({ accountId }) {
	const [open, setOpen] = useState(false);
	const storageKey = 'wms.alerts.read.' + accountId;
	const [seen, setSeen] = useState(() => {
		try {
			return new Set(JSON.parse(sessionStorage.getItem(storageKey) || '[]'));
		} catch {
			return new Set();
		}
	});
	const load = useCallback(async (signal) => {
		const response = await api.get('/v1/reports/alerts', {
			signal,
			params: { page: 1, pageSize: 8 }
		});
		return noticeRows(response.data.data);
	}, []);
	const result = useReadRequest([accountId], load);
	const items = result.data || [];
	const unread = items.filter(({ id }) => !seen.has(id)).length;
	const error = readError(result, 'Không tải được cảnh báo kho.');
	function markSeen() {
		const next = new Set([...seen, ...items.map(({ id }) => id)].slice(-200));
		setSeen(next);
		try {
			sessionStorage.setItem(storageKey, JSON.stringify([...next]));
		} catch {
			// The open panel can still mark alerts in memory if storage is unavailable.
		}
	}
	return (
		<div
			className="relative"
			onKeyDown={(event) => {
				if (event.key === 'Escape') setOpen(false);
			}}
		>
			<button
				type="button"
				aria-label={
					unread ? `Cảnh báo kho, ${unread} mục chưa đọc trong danh sách` : 'Cảnh báo kho'
				}
				aria-expanded={open}
				onClick={() => {
					if (!open) result.reload();
					setOpen(!open);
				}}
				className="wms-button wms-button--ghost wms-button--icon relative"
			>
				<Bell size={18} />
				{unread > 0 && (
					<span
						aria-hidden="true"
						className="absolute right-0 top-0 min-w-4 rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white"
					>
						{unread}
					</span>
				)}
			</button>
			{open && (
				<div className="fixed inset-x-4 top-[4.5rem] z-50 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="font-semibold">Cảnh báo kho</p>
						{unread > 0 && (
							<button
								type="button"
								className="text-xs text-blue-700"
								onClick={markSeen}
							>
								Đánh dấu đã đọc
							</button>
						)}
					</div>
					{result.loading && (
						<p role="status" className="mt-2 text-slate-600">
							Đang tải cảnh báo…
						</p>
					)}
					{error && (
						<p role="alert" className="mt-2 text-rose-700">
							{error}
						</p>
					)}
					{!result.loading && !error && !items.length && (
						<p className="mt-2 text-slate-600">
							Không có cảnh báo trong phạm vi của bạn.
						</p>
					)}
					<ul className="mt-2 max-h-[min(50vh,20rem)] space-y-2 overflow-y-auto">
						{items.map((item) => (
							<li
								key={item.id}
								className={
									seen.has(item.id)
										? 'rounded-lg bg-slate-50 p-2'
										: 'rounded-lg bg-blue-50 p-2'
								}
							>
								<p className="font-medium">
									{item.badge} · {item.title}
								</p>
								<p className="text-xs text-slate-600">{item.description}</p>
							</li>
						))}
					</ul>
					<Link
						to="/reports?view=alerts"
						className="mt-3 inline-block text-blue-700"
						onClick={() => setOpen(false)}
					>
						Xem báo cáo cảnh báo
					</Link>
				</div>
			)}
		</div>
	);
}
