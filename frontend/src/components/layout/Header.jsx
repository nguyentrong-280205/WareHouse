import WorkshopNoticeBell from './WorkshopNoticeBell';
import React, { useState } from 'react';
import { Bell, ChevronDown, Menu } from 'lucide-react';
import SearchBox from '../common/SearchBox';
import { useAuth } from '../../auth/useAuth';

function Header({ onOpenMobileSidebar, title, subtitle }) {
  const [searchValue, setSearchValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { session, logout } = useAuth();
  const displayName = session.displayName.replace(/^demo\s+/i, '').trim();
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const showWarehouseOverview = session.permissions.some(p => ['reports.read', 'inventory.search'].includes(p));
  async function handleLogout() {
    setLoggingOut(true); setLogoutError('');
    try { await logout(); }
    catch { setLogoutError('Không thể đăng xuất. Vui lòng thử lại.'); }
    finally { setLoggingOut(false); }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left side: Mobile menu toggle + Header Title / Breadcrumb */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title ? (
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full max-w-md hidden sm:block">
            <SearchBox
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Right side: Search on mobile + Notification Bell + User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* SearchBox shown in header when title is present */}
        {title && (
          <div className="w-64 md:w-80 hidden md:block">
            <SearchBox
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        )}

        {/* Notifications */}
        {session.permissions.includes('materialRequests.create')?<WorkshopNoticeBell/>:showWarehouseOverview && <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900">Thông báo</span>
                <span className="text-xs text-blue-600 cursor-pointer font-medium hover:underline">
                  Đánh dấu đã đọc
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto px-4 space-y-3">
                <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-100 text-xs">
                  <div className="font-semibold text-rose-700">Tồn kho thấp: Hạt nhựa PP</div>
                  <div className="text-slate-600 mt-0.5">Tồn kho hiện tại: 450 kg (≤ 500 kg)</div>
                  <div className="text-[10px] text-slate-400 mt-1">10:20</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100 text-xs">
                  <div className="font-semibold text-amber-700">Sắp hết hạn: Hóa chất HC-01</div>
                  <div className="text-slate-600 mt-0.5">Lô HC-01-2408 hết hạn sau 5 ngày</div>
                  <div className="text-[10px] text-slate-400 mt-1">08:45</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-xs">
                  <div className="font-semibold text-blue-700">Kiểm kê hôm nay: Kho nguyên liệu</div>
                  <div className="text-slate-600 mt-0.5">Kế hoạch kiểm kê ca 2</div>
                  <div className="text-[10px] text-slate-400 mt-1">Hôm nay</div>
                </div>
              </div>
            </div>
          )}
        </div>}

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label={`Menu tài khoản ${displayName}`}
            aria-expanded={showUserMenu}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="flex flex-col text-left hidden md:block">
              <span className="block text-xs font-semibold text-slate-900 leading-tight">
                {displayName}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">
                {session.role}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs text-slate-700">
              <div className="px-3 py-2 border-b border-slate-100 md:hidden">
                <p className="font-semibold text-slate-900">{displayName}</p>
                <p className="text-[10px] text-slate-500">{session.role}</p>
              </div>
              <div className="border-t border-slate-100 my-1"></div>
              <button onClick={handleLogout} disabled={loggingOut} className="block w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium">
                {loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
              </button>
              {logoutError && <p role="alert" className="px-4 py-2 text-rose-600">{logoutError}</p>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
