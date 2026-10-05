import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import companyLogo from '../../assets/company_logo.webp';
import {
  LayoutDashboard,
  Zap,
  HeartPulse,
  TrendingUp,
  Flame,
  Activity,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, currentVehicleId = 'EV-4587' }) {
  const location = useLocation();

  const navItems = [
    {
      name: 'Overview',
      path: '/',
      icon: LayoutDashboard,
      active: location.pathname === '/',
      disabled: false,
    },
    {
      name: 'Battery Digital Twin',
      path: `/vehicle/${currentVehicleId}`,
      icon: Zap,
      active: location.pathname.startsWith('/vehicle'),
      disabled: false,
    },
    {
      name: 'Health & SoH',
      icon: HeartPulse,
      disabled: true,
    },
    {
      name: 'Predictions',
      icon: TrendingUp,
      disabled: true,
    },
    {
      name: 'Thermal Analysis',
      icon: Flame,
      disabled: true,
    },
    {
      name: 'Usage & Performance',
      icon: Activity,
      disabled: true,
    },
    {
      name: 'Reports',
      icon: FileBarChart,
      disabled: true,
    },
    {
      name: 'Settings',
      icon: Settings,
      disabled: true,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 select-none">
      {/* Top Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 overflow-hidden">
            <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                Baellchen EV Twin
              </span>
              <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 tracking-wider uppercase">
                Battery Analytics
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={idx}
                title={`${item.name} (Coming soon)`}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-75 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${collapsed && !mobileOpen ? 'justify-center' : ''
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-5 h-5 shrink-0" />
                  {(!collapsed || mobileOpen) && (
                    <span className="text-xs font-medium truncate">{item.name}</span>
                  )}
                </div>
                {(!collapsed || mobileOpen) && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/50">
                    Soon
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={idx}
              to={item.path}
              onClick={() => mobileOpen && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${item.active
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                } ${collapsed && !mobileOpen ? 'justify-center px-2' : ''}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${item.active ? 'text-cyan-500 dark:text-cyan-400' : ''
                  }`}
              />
              {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle Button (Desktop) */}
      <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            v2.4.0 • POC Demo
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto"
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
          }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:hidden transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
