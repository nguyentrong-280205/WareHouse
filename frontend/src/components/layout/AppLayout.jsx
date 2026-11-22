import { useRef, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function AppLayout({ children, title, subtitle }) {
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const menuButton = useRef(null);

	function closeMobileSidebar() {
		if (mobileSidebarOpen) {
			setMobileSidebarOpen(false);
			menuButton.current?.focus();
		}
	}

	return (
		<div className="wms-app flex flex-col">
			<a
				href="#wms-main"
				className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3"
			>
				Bỏ qua menu, đến nội dung
			</a>
			{/* Sidebar */}
			<Sidebar
				isOpen={mobileSidebarOpen}
				onClose={closeMobileSidebar}
				isCollapsed={isCollapsed}
				toggleCollapse={() => setIsCollapsed(!isCollapsed)}
			/>

			{/* Main Wrapper */}
			<div
				className={`flex min-w-0 flex-1 flex-col transition-all duration-150 ${
					isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
				}`}
			>
				{/* Header */}
				<Header
					onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
					menuButton={menuButton}
					mobileSidebarOpen={mobileSidebarOpen}
					title={title}
					subtitle={subtitle}
				/>

				{/* Main Content Area */}
				<main id="wms-main" tabIndex={-1} className="wms-main flex-1 space-y-6">
					{children}
				</main>
			</div>
		</div>
	);
}

export default AppLayout;
