import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, ChevronRight, User } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

export default function Header({ onMenuClick, currentVehicleId }) {
  const location = useLocation();
  const isVehiclePage = location.pathname.startsWith('/vehicle');
  const vehicleIdMatch = location.pathname.split('/vehicle/')[1] || currentVehicleId || 'EV-4587';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 lg:px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium">
          <Link
            to="/"
            className="text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            Fleet
          </Link>
          {isVehiclePage ? (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
              <span className="text-slate-900 dark:text-white font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {vehicleIdMatch}
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

      {/* Right: Search, Notifications, Theme, Profile */}
      <div className="flex items-center gap-3">
        {/* Visual Search Input */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search vehicle ID, model..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
            readOnly
          />
        </div>

        {/* Notification Bell Badge */}
        <button
          type="button"
          className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
        </button>

        {/* Dark/Light Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar Placeholder */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              Fleet Admin
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Fleet Operations</span>
          </div>
        </div>
      </div>
    </header>
  );
}
