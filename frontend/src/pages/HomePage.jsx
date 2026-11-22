import PlanInbox from '../features/PlanInbox';
import MaterialAssignmentsPage from '../features/MaterialAssignmentsPage';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import WelcomeBanner from '../components/home/WelcomeBanner';
import QuickActions from '../components/home/QuickActions';
import QuickAccess from '../components/home/QuickAccess';
import RecentActivity from '../components/home/RecentActivity';
import Notifications from '../components/home/Notifications';
import { useAuth } from '../auth/useAuth';
import api from '../services/apiClient';
import { activityRows, noticeRows } from '../features/live-overview';

function HomePage() {
	const { session } = useAuth();
	const canViewOrders = session.permissions.includes('orders.read');
	const showWarehouseOverview = session.permissions.some((p) =>
		['reports.read', 'inventory.search'].includes(p)
	);
	const [activities, setActivities] = useState([]),
		[notices, setNotices] = useState([]),
		[error, setError] = useState('');
	useEffect(() => {
		const controller = new AbortController(),
			reports = session.permissions.includes('reports.read');
		if (showWarehouseOverview)
			api.get('/v1' + (reports ? '/reports/movements' : '/inventory/ledger'), {
				signal: controller.signal,
				params: { page: 1, pageSize: 8 }
			})
				.then((r) => setActivities(activityRows(r.data.data)))
				.catch((e) => {
					if (!controller.signal.aborted)
						setError(
							e.response?.data?.error?.message || 'Không tải được hoạt động gần đây.'
						);
				});
		if (reports)
			api.get('/v1/reports/alerts', {
				signal: controller.signal,
				params: { page: 1, pageSize: 8 }
			})
				.then((r) => setNotices(noticeRows(r.data.data)))
				.catch((e) => {
					if (!controller.signal.aborted)
						setError(e.response?.data?.error?.message || 'Không tải được cảnh báo.');
				});
		return () => controller.abort();
	}, [session.permissions, showWarehouseOverview]);
	return (
		<AppLayout title="Trang chủ">
			<div className="space-y-6">
				{canViewOrders && session.customerId && (
					<section className="wms-toolbar">
						<h2 className="wms-section-title">Đơn hàng của tôi</h2>
						<div className="flex flex-wrap gap-2">
							<Link
								to="/orders"
								className="wms-button"
							>
								Xem đơn hàng
							</Link>
							{session.permissions.includes('orders.create') && (
								<Link
									to="/orders?create=1"
									className="wms-button wms-button--primary"
								>
									Đặt hàng
								</Link>
							)}
						</div>
					</section>
				)}
				{session.permissions.includes('materialRequests.create') && (
					<PlanInbox audience="WORKSHOP" />
				)}
				{session.permissions.some((p) =>
					['issues.allocate', 'issues.postMaterial'].includes(p)
				) && <MaterialAssignmentsPage embedded />}
				<WelcomeBanner />

				{/* Quick Actions (4 Cards) */}
				<QuickActions />

				{/* Quick Access (6 Cards) */}
				<QuickAccess />
				{error && (
					<p role="alert" className="wms-notice wms-tone-danger">
						{error}
					</p>
				)}

				{/* Bottom Row: Recent Activities & Notifications */}
				{showWarehouseOverview && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<RecentActivity
							activities={activities}
							activityPath={
								session.permissions.includes('reports.read')
									? '/reports?view=movements'
									: '/inventory?view=ledger'
							}
						/>
						{session.permissions.includes('reports.read') && (
							<Notifications items={notices} />
						)}
					</div>
				)}
			</div>
		</AppLayout>
	);
}

export default HomePage;
