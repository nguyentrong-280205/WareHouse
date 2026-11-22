import React, { lazy, Suspense } from 'react';
import { Routes, Route, Link, Navigate, useSearchParams } from 'react-router-dom';
import HomePage from '../pages/HomePage';
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
import PlaceholderPage from '../pages/PlaceholderPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../auth/ProtectedRoute';
const ResourcePage = lazy(() => import('../features/ResourcePage'));
import StocktakePanel from '../features/StocktakePanel';
import DataPage from '../features/DataPage';
import { inventoryViews, reportViews } from '../features/dataViews';
import { useAuth } from '../auth/useAuth';
import PlanInbox from '../features/PlanInbox';
import AppLayout from '../components/layout/AppLayout';
function LotsPage() {
	const [query] = useSearchParams(),
		{ session } = useAuth(),
		material = session.permissions.includes('materialLots.read'),
		product = session.permissions.includes('productLots.read'),
		selected =
			query.get('type') === 'material' && material
				? 'material'
				: product
					? 'product'
					: 'material';
	return (
		<ResourcePage
			key={selected}
			kind={selected === 'material' ? 'materialLots' : 'productLots'}
			toolbar={
				<div className="flex gap-3 text-sm">
					{material && (
						<Link
							to="/lots?type=material"
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-blue-600"
						>
							Lô nguyên liệu
						</Link>
					)}
					{product && (
						<Link
							to="/lots?type=product"
							className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-blue-600"
						>
							Lô thành phẩm
						</Link>
					)}
				</div>
			}
		/>
	);
}

function WorkshopAssignmentsPage() {
	const { session } = useAuth();
	return session.permissions.includes('materialRequests.create') ? (
		<AppLayout title="Kế hoạch xưởng tiếp nhận">
			<PlanInbox audience="WORKSHOP" />
		</AppLayout>
	) : (
		<ResourcePage key="plans" kind="plans" />
	);
}

function AppRoutes() {
	return (
		<Suspense
			fallback={
				<p role="status" className="p-6 text-slate-500">
					Đang tải chức năng…
				</p>
			}
		>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route element={<ProtectedRoute />}>
					<Route path="/" element={<HomePage />} />
					<Route
						path="/dashboard"
						element={
							<Suspense
								fallback={
									<p role="status" className="p-6 text-slate-500">
										Đang tải tổng quan kho…
									</p>
								}
							>
								<DashboardPage />
							</Suspense>
						}
					/>
					<Route
						path="/materials/catalog"
						element={<ResourcePage key="materials" kind="materials" />}
					/>
					<Route
						path="/finished-goods/catalog"
						element={<ResourcePage key="products" kind="products" />}
					/>
					<Route path="/orders" element={<ResourcePage key="orders" kind="orders" />} />
					<Route
						path="/purchases"
						element={<ResourcePage key="purchases" kind="purchases" />}
					/>
					<Route
						path="/material-deliveries"
						element={
							<ResourcePage key="materialDeliveries" kind="materialDeliveries" />
						}
					/>
					<Route
						path="/reports/alert-rules"
						element={<ResourcePage key="alertRules" kind="alertRules" />}
					/>
					<Route
						path="/material-requests"
						element={<ResourcePage key="materialRequests" kind="materialRequests" />}
					/>
					<Route
						path="/warehouse-assignments"
						element={<Navigate to="/materials/issues" replace />}
					/>
					<Route
						path="/product-requests"
						element={<ResourcePage key="productRequests" kind="productRequests" />}
					/>
					<Route
						path="/finished-goods/qc"
						element={<ResourcePage key="productQc" kind="productQc" />}
					/>
					<Route
						path="/returns/qc"
						element={<ResourcePage key="returnQc" kind="returnQc" />}
					/>
					<Route
						path="/deliveries"
						element={<ResourcePage key="deliveries" kind="deliveries" />}
					/>
					<Route
						path="/returns/requests"
						element={<ResourcePage key="returnRequests" kind="returnRequests" />}
					/>
					<Route
						path="/returns/receptions"
						element={<ResourcePage key="returnReceptions" kind="returnReceptions" />}
					/>
					<Route
						path="/returns/receipts"
						element={<ResourcePage key="returnReceipts" kind="returnReceipts" />}
					/>
					<Route
						path="/returns/unidentified"
						element={<ResourcePage key="unknownReturns" kind="unknownReturns" />}
					/>
					<Route
						path="/returns/dispositions"
						element={<ResourcePage key="dispositions" kind="dispositions" />}
					/>
					<Route
						path="/returns/rejected-receipts"
						element={<ResourcePage key="rejectedReceipts" kind="rejectedReceipts" />}
					/>
					<Route
						path="/inventory"
						element={<DataPage title="Tra cứu kho" views={inventoryViews} />}
					/>

					<Route path="/production-plans" element={<WorkshopAssignmentsPage />} />
					<Route path="/workshop-assignments" element={<WorkshopAssignmentsPage />} />
					<Route path="/production-orders" element={<WorkshopAssignmentsPage />} />

					<Route
						path="/materials/receipts"
						element={<ResourcePage key="materialReceipts" kind="materialReceipts" />}
					/>
					<Route
						path="/materials/issues"
						element={<ResourcePage key="materialIssues" kind="materialIssues" />}
					/>
					<Route
						path="/materials/qc"
						element={<ResourcePage key="materialQc" kind="materialQc" />}
					/>

					<Route
						path="/finished-goods/receipts"
						element={<ResourcePage key="productReceipts" kind="productReceipts" />}
					/>
					<Route
						path="/finished-goods/issues"
						element={<ResourcePage key="saleIssues" kind="saleIssues" />}
					/>
					<Route
						path="/inventory-counts"
						element={
							<ResourcePage
								key="stocktakes"
								kind="stocktakes"
								renderDetail={(record) => (
									<StocktakePanel
										key={record.id + ':' + record.version}
										record={record}
									/>
								)}
							/>
						}
					/>

					<Route path="/lots" element={<LotsPage />} />
					<Route
						path="/storage-locations"
						element={<ResourcePage key="warehouses" kind="warehouses" />}
					/>
					<Route
						path="/reports"
						element={<DataPage title="Báo cáo & Cảnh báo" views={reportViews} />}
					/>

					<Route path="/users" element={<PlaceholderPage title="Người dùng" />} />

					<Route path="*" element={<NotFoundPage />} />
				</Route>
			</Routes>
		</Suspense>
	);
}

export default AppRoutes;
