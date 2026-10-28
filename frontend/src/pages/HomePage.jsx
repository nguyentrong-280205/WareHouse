import PlanInbox from '../features/PlanInbox';
import MaterialAssignmentsPage from '../features/MaterialAssignmentsPage';
import React,{useEffect,useState} from 'react';
import AppLayout from '../components/layout/AppLayout';
import WelcomeBanner from '../components/home/WelcomeBanner';
import QuickActions from '../components/home/QuickActions';
import QuickAccess from '../components/home/QuickAccess';
import RecentActivity from '../components/home/RecentActivity';
import Notifications from '../components/home/Notifications';
import { useAuth } from '../auth/useAuth';
import api from '../services/apiClient';
import {activityRows,noticeRows} from '../features/live-overview';

function HomePage() {
  const { session } = useAuth();
  const showWarehouseOverview = session.permissions.some(p => ['reports.read', 'inventory.search'].includes(p));
  const[activities,setActivities]=useState([]),[notices,setNotices]=useState([]),[error,setError]=useState('');
  useEffect(()=>{const controller=new AbortController(),reports=session.permissions.includes('reports.read');if(showWarehouseOverview)api.get('/v1'+(reports?'/reports/movements':'/inventory/ledger'),{signal:controller.signal,params:{page:1,pageSize:8}}).then(r=>setActivities(activityRows(r.data.data))).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.error?.message||'Không tải được hoạt động gần đây.');});if(reports)api.get('/v1/reports/alerts',{signal:controller.signal,params:{page:1,pageSize:8}}).then(r=>setNotices(noticeRows(r.data.data))).catch(e=>{if(!controller.signal.aborted)setError(e.response?.data?.error?.message||'Không tải được cảnh báo.');});return()=>controller.abort();},[session.permissions,showWarehouseOverview]);
  return (
    <AppLayout title="Trang chủ">
      <div className="space-y-6">
        {/* Banner */}
        <WelcomeBanner />
        {session.permissions.includes('materialRequests.create')&&<PlanInbox audience="WORKSHOP"/>}
        {session.permissions.some(p=>['issues.allocate','issues.postMaterial'].includes(p))&&<MaterialAssignmentsPage embedded/>}

        {/* Quick Actions (4 Cards) */}
        <QuickActions />

        {/* Quick Access (6 Cards) */}
        <QuickAccess />
        {error&&<p role="alert" className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}

        {/* Bottom Row: Recent Activities & Notifications */}
        {showWarehouseOverview && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity activities={activities}/>
          {session.permissions.includes('reports.read')&&<Notifications items={notices}/>}
        </div>}
      </div>
    </AppLayout>
  );
}

export default HomePage;
