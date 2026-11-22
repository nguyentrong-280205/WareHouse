import WorkshopNoticeBell from './WorkshopNoticeBell';
import React, { useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';
import HeaderSearch from './HeaderSearch';
import WarehouseNoticeBell from './WarehouseNoticeBell';
import { useAuth } from '../../auth/useAuth';

function Header({ onOpenMobileSidebar, menuButton, mobileSidebarOpen, title, subtitle }) {
	const [showUserMenu, setShowUserMenu] = useState(false);
	const { session, logout } = useAuth();
	const displayName = session.displayName.replace(/^demo\s+/i, '').trim();
	const [logoutError, setLogoutError] = useState('');
	const [loggingOut, setLoggingOut] = useState(false);
	async function handleLogout() {
		setLoggingOut(true);
		setLogoutError('');
		try {
			await logout();
		} catch {
			setLogoutError('Không thể đăng xuất. Vui lòng thử lại.');
		} finally {
			setLoggingOut(false);
		}
	}

	return (
		<header className="wms-header sticky top-0 z-30 flex items-center justify-between gap-2 px-3 py-2 sm:px-4 lg:px-6">
			{/* Left side: Mobile menu toggle + Header Title / Breadcrumb */}
			<div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
				<button
					ref={menuButton}
					aria-label="Mở menu điều hướng"
					aria-controls="wms-navigation"
					aria-expanded={mobileSidebarOpen}
					onClick={onOpenMobileSidebar}
					className="wms-button wms-button--ghost wms-button--icon shrink-0 lg:hidden"
				>
					<Menu className="w-5 h-5" />
				</button>

				{title ? (
					<div className="flex flex-col min-w-0">
						<h1 className="wms-page-title text-lg leading-tight sm:text-2xl sm:leading-8">
							{title}
						</h1>
						{subtitle && (
							<p className="text-xs text-slate-500 truncate hidden sm:block">
								{subtitle}
							</p>
						)}
					</div>
				) : null}
			</div>

			{/* Right side: Search on mobile + Notification Bell + User Profile */}
			<div className="flex shrink-0 items-center gap-1 sm:gap-2">
				<HeaderSearch session={session} />
				{session.permissions.includes('materialRequests.create') ? (
					<WorkshopNoticeBell />
				) : session.permissions.includes('reports.read') ? (
					<WarehouseNoticeBell key={session.accountId} accountId={session.accountId} />
				) : null}

				{/* Divider */}
				<div className="hidden h-6 w-px bg-slate-200 sm:block" />

				{/* User Profile */}
				<div className="relative">
					<button
						onClick={() => setShowUserMenu(!showUserMenu)}
						aria-label={`Menu tài khoản ${displayName}`}
						aria-expanded={showUserMenu}
						className="wms-button wms-button--ghost px-2"
					>
						<div className="flex flex-col text-left hidden md:block">
							<span className="block text-xs font-semibold text-slate-900 leading-tight">
								{displayName}
							</span>
							<span className="block text-xs font-medium text-slate-600">
								{session.role}
							</span>
						</div>
						<ChevronDown className="size-4 text-slate-600" aria-hidden="true" />
					</button>

					{showUserMenu && (
						<div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs text-slate-700">
							<div className="px-3 py-2 border-b border-slate-100 md:hidden">
								<p className="font-semibold text-slate-900">{displayName}</p>
								<p className="text-[10px] text-slate-500">{session.role}</p>
							</div>
							<div className="border-t border-slate-100 my-1"></div>
							<button
								onClick={handleLogout}
								disabled={loggingOut}
								className="block w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium"
							>
								{loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
							</button>
							{logoutError && (
								<p role="alert" className="px-4 py-2 text-rose-600">
									{logoutError}
								</p>
							)}
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

export default Header;
