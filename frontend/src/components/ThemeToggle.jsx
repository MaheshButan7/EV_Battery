import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/40 dark:hover:text-cyan-300 motion-reduce:transition-none"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="h-5 w-5 text-amber-400 transition-transform duration-200 group-hover:rotate-45 motion-reduce:transition-none" strokeWidth={2} />
      ) : (
        <Moon aria-hidden="true" className="h-5 w-5 text-indigo-600 transition-transform duration-200 group-hover:-rotate-12 motion-reduce:transition-none dark:text-indigo-300" strokeWidth={2} />
      )}
    </button>
  );
}
