import React from 'react';

export default function ChartCard({ title, subtitle, badgeText, children, action }) {
  return (
    <div className="surface-card flex h-full min-w-0 flex-col rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5 lg:p-6">
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3 sm:mb-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold leading-5 tracking-tight text-slate-900 dark:text-white sm:text-base">
              {title}
            </h3>
            {badgeText && (
              <span className="shrink-0 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex min-h-[220px] w-full min-w-0 flex-1 flex-col justify-center sm:min-h-[260px]">
        {children}
      </div>
    </div>
  );
}
