import React from 'react';

export default function MetricBar({ label, valueText, percentage = 50, color = 'cyan', minText, maxText }) {
  const colorClasses = {
    cyan: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
    emerald: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    amber: 'bg-gradient-to-r from-amber-600 to-amber-400',
    rose: 'bg-gradient-to-r from-rose-600 to-rose-400',
    blue: 'bg-gradient-to-r from-blue-600 to-blue-400',
  };

  const activeGradient = colorClasses[color] || colorClasses.cyan;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{valueText}</span>
      </div>
      <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${activeGradient}`}
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
