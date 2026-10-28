import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, LockKeyhole } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
export default function LoginPage() {
  const { session, loading, login, error: connectionError, refresh } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading) return <p className="p-8 text-slate-500" role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (session) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const simpleDemo=['khach01','kehoach01','muahang01','giamdoc01','quanlykho01','nhanvienkho01','qc01','xuong01','kiemke01','uc01.staff','nguyentrong','vuthinh','truongthinh'].includes(username.trim().toLowerCase());
    if (!/^[a-z0-9][a-z0-9_.-]{0,99}$/.test(username.trim().toLowerCase()) || Array.from(password).length < (simpleDemo?6:12) || Array.from(password).length > 128) {
      setError(simpleDemo?'Kiểm tra tên đăng nhập và mật khẩu demo (6–128 ký tự).':'Kiểm tra tên đăng nhập và mật khẩu (12–128 ký tự).'); return;
    }
    setBusy(true); setError('');
    try { await login(username.trim().toLowerCase(), password); setPassword(''); navigate('/', { replace: true }); }
    catch (err) {
      setPassword('');
      const remaining = Number(err.response?.headers['retry-after']);
      setError(err.response?.status === 429 ? (Number.isFinite(remaining) && remaining > 0 ? `Đăng nhập tạm khóa. Vui lòng thử lại sau ${remaining} giây.` : 'Đăng nhập tạm khóa. Vui lòng thử lại sau.') : err.response?.status === 401 ? 'Tên đăng nhập hoặc mật khẩu không hợp lệ, hoặc tài khoản không khả dụng.' : 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <section className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
      <div className="flex items-center gap-3 mb-8"><div className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center"><Box className="w-6 h-6" /></div><div><p className="font-bold text-slate-900">WMS Nhà Máy</p><p className="text-xs text-slate-500">Quản lý kho toàn diện</p></div></div>
      <h1 className="text-2xl font-bold text-slate-900">Đăng nhập hệ thống</h1><p className="text-sm text-slate-500 mt-2 mb-6">Sử dụng tài khoản được cấp để tiếp tục.</p>
      {connectionError && <div role="alert" className="text-sm text-rose-700 mb-4">{connectionError} <button className="text-blue-600" onClick={refresh}>Thử lại</button></div>}
      <form onSubmit={submit} className="space-y-5">
        <div><label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-2">Tên đăng nhập</label><input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={100} value={username} onChange={e => setUsername(e.target.value)} disabled={busy} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div><label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label><input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 text-sm font-semibold flex items-center justify-center gap-2"><LockKeyhole className="w-4 h-4" />{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </section>
  </main>;
}
