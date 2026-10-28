import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function AppLayout({ children, title, subtitle }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Wrapper */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Header */}
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
