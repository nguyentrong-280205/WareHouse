import React from 'react';
import { PackageOpen } from 'lucide-react';

function EmptyState({
	title = 'Không tìm thấy dữ liệu',
	description = 'Hiện tại chưa có dữ liệu để hiển thị.',
	icon: Icon = PackageOpen,
	action
}) {
	return (
		<div className="wms-panel flex flex-col items-center justify-center px-4 py-8 text-center">
			<div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
				<Icon aria-hidden="true" className="size-5" />
			</div>
			<h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
			{description && <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>}
			{action}
		</div>
	);
}

export default EmptyState;
