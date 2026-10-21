import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import companyLogo from '../../assets/company_logo.webp';
import { PRODUCT_NAME } from '../../config';
import { ChevronDown, LogOut, X } from 'lucide-react';
import { navigationGroups } from '../../config/navigation';
import { useDemoData } from '../../hooks/useDemoData';
import { useAuth } from '../../hooks/useAuth';

function UserMenu({ collapsed, mobileOpen }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative flex-1 p-3 ${collapsed && !mobileOpen ? 'flex justify-center' : ''}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className={`flex w-full items-center gap-2 rounded-xl p-1.5 text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:hover:bg-slate-800 ${collapsed && !mobileOpen ? 'w-auto' : ''}`}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        aria-label="User menu"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-sm">
          {user?.name?.[0] ?? 'U'}
        </div>
        {(!collapsed || mobileOpen) && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight text-slate-900 dark:text-white">{user?.name ?? 'User'}</p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{user?.role ?? 'Viewer'}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      {menuOpen && (
        <div className={`absolute bottom-full z-50 mb-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 ${collapsed && !mobileOpen ? 'left-3' : 'left-3 right-3'}`}>
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{user?.email}</p>
            <p className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400">{user?.role}</p>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              onClick={async () => { setMenuOpen(false); await logout(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/10 focus:outline-none focus:ring-2 focus:ring-rose-500/50 dark:text-rose-400"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, setMobileOpen, currentSiteId = 'BESS-JODHUR' }) {
  const location = useLocation();
  const { alarms } = useDemoData();
  const activeAlarmCount = alarms.filter((alarm) => alarm.state === 'Active').length;

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-200/90 bg-[var(--app-nav)] transition-all duration-300 select-none dark:border-slate-800/90">
      {/* Brand Header */}
      <div className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-slate-200/90 px-4 dark:border-slate-800/90">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-500/20 bg-white p-1 shadow-sm dark:bg-slate-800">
            <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold tracking-tight text-slate-950 dark:text-white">{PRODUCT_NAME}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">Site Operations</span>
            </div>
          )}
        </div>
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden" aria-label="Close navigation">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {navigationGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {(!collapsed || mobileOpen) && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isSite = item.id === 'site';
              const path = isSite
                ? `/site/${currentSiteId}`
                : item.path.replace(':siteId', currentSiteId);
              const active = item.id === 'fleet'
                ? location.pathname === '/'
                : isSite
                  ? location.pathname === `/site/${currentSiteId}`
                : location.pathname === path;

              if (item.comingSoon) {
                return (
                  <div
                    key={item.id}
                    title={`${item.name} — coming soon`}
                    className={`flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2.5 text-slate-400 opacity-75 transition-colors hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800/30 ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      {(!collapsed || mobileOpen) && <span className="truncate text-xs font-medium">{item.name}</span>}
                    </div>
                    {(!collapsed || mobileOpen) && (
                      <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700/50 dark:bg-slate-800/80 dark:text-slate-500">
                        Soon
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={path}
                  title={collapsed && !mobileOpen ? item.name : undefined}
                  onClick={() => mobileOpen && setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'border border-cyan-500/20 bg-cyan-500/[0.09] font-semibold text-cyan-700 shadow-sm dark:bg-cyan-400/[0.10] dark:text-cyan-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  } ${collapsed && !mobileOpen ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-cyan-500 dark:text-cyan-400' : ''}`} />
                  {(!collapsed || mobileOpen) && <span className="min-w-0 truncate">{item.name}</span>}
                  {item.id === 'alarms' && activeAlarmCount > 0 && (!collapsed || mobileOpen) && <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{activeAlarmCount}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Account and collapse controls */}
      <div className="flex items-center border-t border-slate-200 dark:border-slate-800">
        <UserMenu collapsed={collapsed} mobileOpen={mobileOpen} />
      </div>
    </div>
  );

  return (
    <>
      <aside className={`sticky top-0 z-30 hidden h-dvh shrink-0 transition-all duration-300 lg:block ${collapsed ? 'w-20' : 'w-64'}`}>
        {sidebarContent}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:hidden transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
