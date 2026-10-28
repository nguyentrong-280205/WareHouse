import React from 'react';
import { Routes, Route, Link, Navigate, useSearchParams } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import DashboardPage from '../pages/DashboardPage';
import PlaceholderPage from '../pages/PlaceholderPage';
import NotFoundPage from '../pages/NotFoundPage';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../auth/ProtectedRoute';
import ResourcePage from '../features/ResourcePage';
import StocktakePanel from '../features/StocktakePanel';
import DataPage,{inventoryViews,reportViews} from '../features/DataPage';
import {useAuth} from '../auth/useAuth';
import PlanInbox from '../features/PlanInbox';
import AppLayout from '../components/layout/AppLayout';
function LotsPage(){const[query]=useSearchParams(),{session}=useAuth(),material=session.permissions.includes('materialLots.read'),product=session.permissions.includes('productLots.read'),selected=query.get('type')==='material'&&material?'material':product?'product':'material';return <ResourcePage key={selected} kind={selected==='material'?'materialLots':'productLots'} toolbar={<div className="flex gap-3 text-sm">{material&&<Link to="/lots?type=material" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-blue-600">Lô nguyên liệu</Link>}{product&&<Link to="/lots?type=product" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-blue-600">Lô thành phẩm</Link>}</div>}/>;}

function WorkshopAssignmentsPage(){const{session}=useAuth();return session.permissions.includes('materialRequests.create')?<AppLayout title="Kế hoạch xưởng tiếp nhận"><PlanInbox audience="WORKSHOP"/></AppLayout>:<ResourcePage kind="plans"/>;}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/materials/catalog" element={<ResourcePage kind="materials"/>}/>
      <Route path="/finished-goods/catalog" element={<ResourcePage kind="products"/>}/>
      <Route path="/orders" element={<ResourcePage kind="orders"/>}/>
      <Route path="/purchases" element={<ResourcePage kind="purchases"/>}/>
      <Route path="/material-deliveries" element={<ResourcePage kind="materialDeliveries"/>}/>
      <Route path="/reports/alert-rules" element={<ResourcePage kind="alertRules"/>}/>
      <Route path="/material-requests" element={<ResourcePage kind="materialRequests"/>}/>
      <Route path="/warehouse-assignments" element={<Navigate to="/materials/issues" replace/>}/>
      <Route path="/product-requests" element={<ResourcePage kind="productRequests"/>}/>
      <Route path="/finished-goods/qc" element={<ResourcePage kind="productQc"/>}/>
      <Route path="/returns/qc" element={<ResourcePage kind="returnQc"/>}/>
      <Route path="/deliveries" element={<ResourcePage kind="deliveries"/>}/>
      <Route path="/returns/requests" element={<ResourcePage kind="returnRequests"/>}/>
      <Route path="/returns/receptions" element={<ResourcePage kind="returnReceptions"/>}/>
      <Route path="/returns/receipts" element={<ResourcePage kind="returnReceipts"/>}/>
      <Route path="/returns/unidentified" element={<ResourcePage kind="unknownReturns"/>}/>
      <Route path="/returns/dispositions" element={<ResourcePage kind="dispositions"/>}/>
      <Route path="/returns/rejected-receipts" element={<ResourcePage kind="rejectedReceipts"/>}/>
      <Route path="/inventory" element={<DataPage title="Tra cứu kho" views={inventoryViews}/>}/>

      <Route
        path="/production-plans"
        element={<WorkshopAssignmentsPage/>}
      />
      <Route
        path="/workshop-assignments"
        element={<WorkshopAssignmentsPage/>}
      />
      <Route
        path="/production-orders"
        element={<WorkshopAssignmentsPage/>}
      />

      <Route
        path="/materials/receipts"
        element={<ResourcePage kind="materialReceipts" />}
      />
      <Route
        path="/materials/issues"
        element={<ResourcePage kind="materialIssues" />}
      />
      <Route
        path="/materials/qc"
        element={<ResourcePage kind="materialQc" />}
      />

      <Route
        path="/finished-goods/receipts"
        element={<ResourcePage kind="productReceipts" />}
      />
      <Route
        path="/finished-goods/issues"
        element={<ResourcePage kind="saleIssues" />}
      />
      <Route
        path="/inventory-counts"
        element={<ResourcePage kind="stocktakes" renderDetail={record=><StocktakePanel record={record}/>}/>}
      />

      <Route path="/lots" element={<LotsPage/>} />
      <Route
        path="/storage-locations"
        element={<ResourcePage kind="warehouses"/>}
      />
      <Route
        path="/reports"
        element={<DataPage title="Báo cáo & Cảnh báo" views={reportViews}/>}
      />

      <Route path="/users" element={<PlaceholderPage title="Người dùng" />} />

      <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
