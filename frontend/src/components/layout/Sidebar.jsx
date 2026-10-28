import React, {useEffect,useState} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Download,
  Upload,
  ShieldCheck,
  PackageCheck,
  PackageMinus,
  ClipboardCheck,
  Boxes,
  MapPin,
  BarChart3,
  User,
  Box,
  PanelLeftClose,
  X,
} from 'lucide-react';
import { navigationSections } from '../../data/navigationData';
import { useAuth } from '../../auth/useAuth';
import { canAccessPath } from '../../auth/access';
import api from '../../services/apiClient';

const iconMap = {
  Home,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Download,
  Upload,
  ShieldCheck,
  PackageCheck,
  PackageMinus,
  ClipboardCheck,
  Boxes,
  MapPin,
  BarChart3,
  User,
};

function Sidebar({ isOpen, onClose, isCollapsed, toggleCollapse }) {
  const location = useLocation();
  const { session } = useAuth();
  const [counts,setCounts]=useState({});
  useEffect(()=>{
    const controller=new AbortController();let pending=false;
    async function load(){
      if(pending||document.hidden||controller.signal.aborted)return;pending=true;
      try{
        const jobs=[],permissions=session.permissions;
        if(permissions.includes('issues.allocate'))jobs.push(['/materials/issues','/v1/material-assignments',{page:1,pageSize:1,pending:'true'}]);
        else if(permissions.includes('issues.postMaterial'))jobs.push(['/materials/issues','/v1/issues',{page:1,pageSize:1,kind:'MATERIAL',status:'DA_XAC_NHAN'}]);
        if(permissions.includes('purchases.create'))jobs.push(['/purchases','/v1/production-plans/receiving-queue',{audience:'PURCHASING',page:1,pageSize:1}]);
        if(permissions.includes('plans.create'))jobs.push(['/production-plans','/v1/production-plans/receiving-queue',{audience:'PLANNING',page:1,pageSize:1}]);
        if(permissions.includes('materialRequests.create'))jobs.push(['/workshop-assignments','/v1/production-plans/receiving-queue',{audience:'WORKSHOP',page:1,pageSize:1}]);
        const results=await Promise.allSettled(jobs.map(([,url,params])=>api.get(url,{params,signal:controller.signal})));
        if(!controller.signal.aborted){const next={};results.forEach((result,i)=>{if(result.status==='fulfilled')next[jobs[i][0]]=result.value.data.meta?.total||0;});setCounts(next);}
      }finally{pending=false;}
    }
    void load();window.addEventListener('focus',load);document.addEventListener('visibilitychange',load);window.addEventListener('warehouse:pending-refresh',load);
    return()=>{controller.abort();window.removeEventListener('focus',load);document.removeEventListener('visibilitychange',load);window.removeEventListener('warehouse:pending-refresh',load);};
  },[session.permissions,location.pathname]);
  const visibleSections = navigationSections.map(section => ({ ...section, items: section.items.filter(item => canAccessPath(session, item.path)) })).filter(section => section.items.length);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 bg-white border-r border-slate-200/80 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Box className="w-6 h-6 stroke-[2.2]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 text-base leading-tight truncate">
                  WMS Nhà Máy
                </span>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Quản lý kho toàn diện
                </span>
              </div>
            )}
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              <PanelLeftClose className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-3">
          {visibleSections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? 'pt-3 border-t border-slate-100' : ''}>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const IconComponent = iconMap[item.iconName] || Box;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={() => onClose && onClose()}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`
                      }
                    >
                      <IconComponent
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                      {counts[item.path]>0&&<span aria-label={`${counts[item.path]} công việc đang chờ`} className={`${isCollapsed?'absolute right-1 top-1':'ml-auto'} shrink-0 min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white`}>{counts[item.path]>99?'99+':counts[item.path]}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
