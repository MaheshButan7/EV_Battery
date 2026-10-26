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
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-blue-500/10 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-300 dark:hover:bg-blue-400/10 dark:hover:text-blue-300 motion-reduce:transition-none"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="h-5 w-5 text-amber-500 dark:text-amber-400" strokeWidth={2} />
      ) : (
        <Moon aria-hidden="true" className="h-5 w-5 text-blue-700 dark:text-blue-300" strokeWidth={2} />
      )}
    </button>
  );
}
