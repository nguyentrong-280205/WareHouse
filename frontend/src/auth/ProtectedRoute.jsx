import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { canAccessPath } from './access';
import AppLayout from '../components/layout/AppLayout';
export default function ProtectedRoute() {
  const { session, loading, error, refresh } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <p className="p-8 text-slate-500" role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (error) return <div className="p-8 text-slate-700"><p role="alert">{error}</p><button onClick={refresh} className="mt-4 text-blue-600">Thử lại</button></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!canAccessPath(session, pathname)) return <AppLayout title="Quyền truy cập"><div className="bg-white rounded-2xl border border-slate-200 p-6"><p role="alert">Bạn không có quyền truy cập chức năng này.</p><Link to="/" className="text-blue-600 block mt-4">Về trang chủ</Link></div></AppLayout>;
  return <Outlet />;
}
