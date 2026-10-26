import React from 'react';

export default function MetricBar({ label, valueText, percentage = 50, color = 'cyan', minText, maxText }) {
  const colorClasses = {
    cyan: 'bg-cyan-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    rose: 'bg-rose-600',
    blue: 'bg-blue-600',
  };

  const activeColor = colorClasses[color] || colorClasses.cyan;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{valueText}</span>
      </div>
      <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${activeColor}`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      {(minText || maxText) && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <span>{minText}</span>
          <span>{maxText}</span>
        </div>
      )}
    </div>
  );
}
