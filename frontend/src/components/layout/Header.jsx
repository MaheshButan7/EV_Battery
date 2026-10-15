import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, ChevronRight, LogOut, ChevronDown } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../hooks/useAuth';
import { useDemoData } from '../../hooks/useDemoData';

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lastUpdated, connection, alarms, isSimulated, selectedSite } = useDemoData();
  const activeAlarmCount = alarms.filter((alarm) => alarm.state === 'Active').length;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isSitePage = location.pathname.startsWith('/site/');
  const siteIdMatch = isSitePage ? location.pathname.split('/site/')[1]?.split('/')[0] : null;
  const site = selectedSite?.id === siteIdMatch ? selectedSite : null;
  const pageLabels = {
    '/': 'Operational Overview',
    '/map': 'Site Map',
    '/alarms': 'Alarm & Event Management',
    '/assets': 'Asset Registry',
    '/asset-health': 'Asset Health',
    '/maintenance': 'Maintenance & CMMS',
    '/maintenance/permits': 'Permit-to-Work',
    '/inventory': 'Inventory',
    '/analytics': 'Performance Analytics',
    '/history': 'Historical Trends',
    '/reports': 'Reports',
    '/executive': 'Executive Reporting',
    '/hazards': 'Safety & Hazards',
    '/admin': 'Administration',
  };
  const sitePageLabels = {
    sld: 'Site Single-Line Diagram',
    battery: 'Battery & Cells',
    pcs: 'PCS & Power Conversion',
  };
  const siteSubpath = isSitePage ? location.pathname.split('/').slice(3)[0] : null;
  const pageLabel = isSitePage ? (siteSubpath ? sitePageLabels[siteSubpath] : 'Site Operations') : pageLabels[location.pathname] || 'Operations';
  const [searchQuery, setSearchQuery] = useState('');

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Esc to close
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b border-slate-200/80 bg-[var(--app-header)] px-4 backdrop-blur-xl transition-colors dark:border-slate-800/80 lg:px-8">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 lg:flex" title={`Last data refresh ${lastUpdated.toLocaleTimeString()}`}>
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {isSimulated ? 'Data source: simulated' : connection}
        </div>
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] font-medium">
          <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            Sites
          </Link>
          {isSitePage ? (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.08] px-2.5 py-1 font-semibold text-cyan-700 dark:text-cyan-300">
                {site?.name || siteIdMatch}
              </span>
              {pageLabel !== 'Site Operations' && <><ChevronRight className="h-3.5 w-3.5 text-slate-400" /><span className="font-semibold text-slate-900 dark:text-white">{pageLabel}</span></>}
            </>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="font-semibold text-slate-900 dark:text-white">{pageLabel}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Search, Demo chip, Notifications, Theme, User menu */}
      <div className="flex items-center gap-3">
        {/* Visual search */}
        <div className="relative hidden md:block w-56">
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

        {/* Notification bell */}
        <button
          type="button"
          onClick={() => navigate('/alarms')}
          className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {activeAlarmCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {activeAlarmCount}
            </span>
          )}
        </button>

        <ThemeToggle />

        {/* User avatar + dropdown */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.name?.[0] ?? 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{user?.name ?? 'User'}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{user?.role ?? 'Viewer'}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
                <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">{user?.role}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
