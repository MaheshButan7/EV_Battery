import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import NotificationCenter from './NotificationCenter';
import { useDemoData } from '../../hooks/useDemoData';

export default function Header({ onMenuClick, collapsed, onToggleSidebar }) {
  const location = useLocation();
  const insightSiteScope = location.pathname === '/ai-insights' && new URLSearchParams(location.search).get('scope') === 'site';
  const navigate = useNavigate();
  const { connection, selectedSite, accessibleSites, selectedSiteId, selectSite } = useDemoData();
  const isSitePage = location.pathname.startsWith('/site/');
  const siteIdMatch = isSitePage ? location.pathname.split('/site/')[1]?.split('/')[0] : null;
  const site = selectedSite?.id === siteIdMatch ? selectedSite : null;
  const pageLabels = {
    '/': 'Fleet Overview',
    '/map': 'GIS/ Site Map',
    '/alarms': 'Alarm & Event Management',
    '/assets': 'Asset Registry',
    '/asset-health': 'Asset Health',
    '/maintenance': 'Maintenance & CMMS',
    '/maintenance/permits': 'Permit-to-Work',
    '/inventory': 'Inventory',
    '/analytics': 'Performance Analytics',
    '/ai-insights': 'AI Insights',
    '/history': 'Historical Trends',
    '/reports': 'Reports',
    '/executive': 'Executive Reporting',
    '/hazards': 'Safety & Hazards',
    '/admin': 'Administration',
  };
  const sitePageLabels = {
    sld: 'Single Line Diagram',
    battery: 'Battery & Cells',
    pcs: 'PCS & Power Conversion',
  };
  const siteSubpath = isSitePage ? location.pathname.split('/').slice(3)[0] : null;
  const pageLabel = isSitePage ? (siteSubpath ? sitePageLabels[siteSubpath] : 'Site Operations') : pageLabels[location.pathname] || 'Operations';
  const siteContextPaths = [
    '/alarms',
    '/assets',
    '/asset-health',
    '/maintenance',
    '/maintenance/permits',
    '/inventory',
    '/analytics',
    '/ai-insights',
    '/history',
    '/reports',
  ];
  const showSiteSelector = isSitePage || (location.pathname === '/ai-insights' ? insightSiteScope : siteContextPaths.includes(location.pathname));
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <header className="sticky top-0 z-20 flex min-h-[4.5rem] flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-200/80 bg-[var(--app-header)] px-3 py-2 transition-colors dark:border-slate-800/80 sm:px-4 md:h-[4.5rem] md:flex-nowrap md:py-0 lg:px-8">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 lg:flex" title="Demo data connection status">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {connection}
        </div>
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:hover:bg-slate-800 dark:hover:text-white lg:block"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <nav aria-label="Current page" className="min-w-0 text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
          <span className="block max-w-[42vw] truncate sm:max-w-[240px]">{isSitePage && site?.name && pageLabel === 'Site Operations' ? site.name : pageLabel}</span>
        </nav>
      </div>

      {/* Right: Search, notifications and theme */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
        {/* Visual search */}
        <div className="relative hidden w-48 lg:block xl:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search assets, alarms, sites..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchQuery.trim()) {
                navigate(searchQuery.trim().toLowerCase().startsWith('alm') ? `/alarms?query=${encodeURIComponent(searchQuery.trim())}` : `/assets?query=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery('');
              }
            }}
            className="w-full rounded-xl border border-slate-200/90 bg-slate-100/80 py-2 pl-9 pr-3 text-xs text-slate-900 transition-all placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        {showSiteSelector && (
          <label className="flex min-w-0 items-center">
            <span className="sr-only">Active site</span>
            <select
              aria-label="Active site"
              value={selectedSiteId}
              onChange={(event) => handleSiteChange(event.target.value)}
              className="w-[104px] max-w-[30vw] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-700 outline-none transition-colors focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-[190px] sm:max-w-[190px] sm:px-2.5 sm:text-xs"
            >
              {accessibleSites.map((availableSite) => <option key={availableSite.id} value={availableSite.id}>{availableSite.name}</option>)}
            </select>
          </label>
        )}

        <NotificationCenter />

        <ThemeToggle />

      </div>
    </header>
  );
}
