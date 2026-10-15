import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import companyLogo from '../../assets/company_logo.webp';
import { PRODUCT_NAME } from '../../config';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { navigationGroups } from '../../config/navigation';
import { useDemoData } from '../../hooks/useDemoData';

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, currentSiteId = 'BESS-JODHUR' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { alarms, accessibleSites, selectedSiteId, selectSite } = useDemoData();
  const activeAlarmCount = alarms.filter((alarm) => alarm.state === 'Active').length;

  const handleSiteChange = (nextSiteId) => {
    selectSite(nextSiteId);

    const siteRoute = location.pathname.match(/^\/site\/[^/]+(\/.*)?$/);
    if (siteRoute) {
      navigate({
        pathname: `/site/${nextSiteId}${siteRoute[1] || ''}`,
        search: location.search,
        hash: location.hash,
      }, { replace: true });
    }
  };

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
        {(!collapsed || mobileOpen) && (
          <label className="block px-1">
            <span className="mb-1.5 block px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Active site</span>
            <select value={selectedSiteId} onChange={(event) => handleSiteChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {accessibleSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </label>
        )}
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

      {/* Collapse toggle (desktop) */}
      <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Operations Console · v1.0</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
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
