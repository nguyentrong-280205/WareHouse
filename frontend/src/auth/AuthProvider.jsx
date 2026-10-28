import { useCallback, useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import { AuthContext } from './AuthContext';
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { const { data } = await apiClient.get('/v1/auth/me'); setSession(data); setError(''); }
    catch (err) {
      setSession(null);
      setError(err.response?.status === 401 ? '' : 'Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let live = true;
    apiClient.get('/v1/auth/me').then(({ data }) => { if (live) setSession(data); })
      .catch(err => { if (live && err.response?.status !== 401) setError('Không thể kiểm tra phiên đăng nhập. Vui lòng thử lại.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  // The server extends idle expiry on authenticated business requests. Keep the UI timer
  // in sync with that response without a keep-alive poll that would prevent idle logout.
  useEffect(()=>{
    function update(response){const expiry=response?.headers?.['x-session-idle-expires-at'];if(expiry&&Number.isFinite(Date.parse(expiry)))setSession(current=>current&&Date.parse(expiry)>Date.parse(current.idleExpiresAt)?{...current,idleExpiresAt:new Date(Math.min(Date.parse(expiry),Date.parse(current.absoluteExpiresAt))).toISOString()}:current);return response;}
    const interceptor=apiClient.interceptors.response.use(update,error=>{update(error.response);return Promise.reject(error);});
    return()=>apiClient.interceptors.response.eject(interceptor);
  },[]);
  useEffect(() => {
    if (!session) return;
    const remaining = Math.min(Date.parse(session.idleExpiresAt), Date.parse(session.absoluteExpiresAt)) - Date.now();
    const timer = setTimeout(() => setSession(null), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [session]);
  // Revalidate current permissions/expiry on tab focus; never persist session/CSRF in browser storage.
  useEffect(() => {
    const focus = () => { if (session) void refresh(); };
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, [refresh, session]);
  async function login(username, password) {
    const { data } = await apiClient.post('/v1/auth/login', { username, password });
    setSession(data); setError('');
  }
  async function logout() {
    try {
      await apiClient.post('/v1/auth/logout', {}, { headers: { 'X-CSRF-Token': session.csrfToken, 'Idempotency-Key': crypto.randomUUID() } });
      setSession(null);
    } catch (err) {
      if (err.response?.status === 401) { setSession(null); return; }
      throw err;
    }
  }
  return <AuthContext.Provider value={{ session, loading, error, refresh, login, logout }}>{children}</AuthContext.Provider>;
}
