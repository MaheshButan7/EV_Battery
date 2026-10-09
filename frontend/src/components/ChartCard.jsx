import React from 'react';

export default function ChartCard({ title, subtitle, badgeText, children, action }) {
  return (
    <div className="surface-card p-5 lg:p-6 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            {badgeText && (
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 min-h-[260px] w-full flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
