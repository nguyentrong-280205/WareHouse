import { useId, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { canAccessPath } from '../../auth/access';
import Modal from '../common/Modal';

const scopes = [
	{ path: '/orders', label: 'Đơn hàng' },
	{ path: '/production-plans', label: 'Kế hoạch sản xuất', hiddenForWorkshop: true },
	{
		path: '/materials/receipts',
		label: 'Phiếu nhập nguyên liệu',
		read: ['receipts.read', 'receipts.postMaterial']
	},
	{
		path: '/materials/issues',
		label: 'Phiếu xuất nguyên liệu',
		read: ['issues.read', 'issues.postMaterial']
	},
	{
		path: '/finished-goods/receipts',
		label: 'Phiếu nhập thành phẩm',
		read: ['receipts.read', 'receipts.postProduct']
	},
	{
		path: '/finished-goods/issues',
		label: 'Phiếu xuất thành phẩm',
		read: ['issues.read', 'issues.postSale']
	},
	{ path: '/inventory', label: 'Tồn kho và lô hàng' },
	{ path: '/materials/catalog', label: 'Danh mục nguyên liệu' },
	{ path: '/finished-goods/catalog', label: 'Danh mục thành phẩm' }
];
export default function HeaderSearch({ session }) {
	const [open, setOpen] = useState(false);
	const titleId = useId();
	const navigate = useNavigate();
	const workshop = session.permissions.includes('materialRequests.create');
	const available = scopes.filter(
		(scope) =>
			canAccessPath(session, scope.path) &&
			!(workshop && scope.hiddenForWorkshop) &&
			(!scope.read ||
				scope.read.some((permission) => session.permissions.includes(permission)))
	);
	if (!available.length) return null;
	return (
		<>
			<button
				type="button"
				aria-label="Tìm kiếm"
				onClick={() => setOpen(true)}
				className="wms-button wms-button--ghost wms-button--icon xl:w-auto xl:px-3"
			>
				<Search size={18} />
				<span className="hidden xl:inline">Tìm kiếm</span>
			</button>
			{open && (
				<Modal labelledBy={titleId} onClose={() => setOpen(false)}>
					<form
						className="wms-dialog-panel mt-[min(5vh,2rem)] max-w-lg space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							const data = new FormData(event.currentTarget);
							const scope = available.find(({ path }) => path === data.get('scope'));
							const q = data.get('q').trim();
							if (!scope || !q) return;
							setOpen(false);
							navigate({
								pathname: scope.path,
								search: new URLSearchParams({ q }).toString()
							});
						}}
					>
						<div className="flex items-center justify-between gap-3">
							<h2 id={titleId} className="font-semibold">
								Tìm trong hệ thống
							</h2>
							<button
								type="button"
								aria-label="Đóng tìm kiếm"
								onClick={() => setOpen(false)}
							>
								<X size={18} />
							</button>
						</div>
						<label className="block space-y-1 text-sm">
							<span>Phạm vi tìm</span>
							<select
								name="scope"
								className="wms-input"
							>
								{available.map(({ path, label }) => (
									<option key={path} value={path}>
										{label}
									</option>
								))}
							</select>
						</label>
						<label className="block space-y-1 text-sm">
							<span>Từ khóa</span>
							<input
								name="q"
								maxLength={100}
								required
								className="wms-input"
							/>
						</label>
						<button className="wms-button wms-button--primary">
							Tìm
						</button>
					</form>
				</Modal>
			)}
		</>
	);
}
