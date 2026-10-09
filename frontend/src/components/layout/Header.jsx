import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, ChevronRight, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../hooks/useAuth';

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isVehiclePage = location.pathname.startsWith('/site');
  const siteIdMatch = location.pathname.split('/site/')[1];

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
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 lg:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium">
          <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
            Fleet
          </Link>
          {isVehiclePage ? (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {siteIdMatch}
              </span>
            </>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-semibold">Overview</span>
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
            placeholder="Search sites, alarms..."
            readOnly
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-default"
          />
        </div>

        {/* Notification bell */}
        <button
          type="button"
          className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
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
