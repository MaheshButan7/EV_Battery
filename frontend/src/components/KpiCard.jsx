import React from 'react';
import {
  Truck,
  HeartPulse,
  AlertTriangle,
  Zap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const iconMap = {
  totalVehicles: Truck,
  avgFleetSoh: HeartPulse,
  activeAlerts: AlertTriangle,
  vehiclesCharging: Zap,
  projectedReplacements: RefreshCw,
};

const colorMap = {
  totalVehicles: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400',
    glow: 'border-blue-500/20',
  },
  avgFleetSoh: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    glow: 'border-emerald-500/20',
  },
  activeAlerts: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400',
    glow: 'border-rose-500/20',
  },
  vehiclesCharging: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    glow: 'border-cyan-500/20',
  },
  projectedReplacements: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
    glow: 'border-amber-500/20',
  },
};

export default function KpiCard({ type, label, value, delta, deltaType, suffix = '' }) {
  const Icon = iconMap[type] || Truck;
  const style = colorMap[type] || colorMap.totalVehicles;

  return (
    <div className={`relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group`}>
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl ${style.bg} transition-transform group-hover:scale-105 duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {suffix}
          </span>
        )}
      </div>

      {/* Footer Delta Indicator */}
      <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
        {deltaType === 'positive' && (
          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            {delta}
          </span>
        )}
        {deltaType === 'negative' && (
          <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
            <TrendingDown className="w-3.5 h-3.5" />
            {delta}
          </span>
        )}
        {deltaType === 'warning' && (
          <span className="text-amber-600 dark:text-amber-400 font-semibold">
            {delta}
          </span>
        )}
        {deltaType === 'neutral' && (
          <span className="text-slate-500 dark:text-slate-400">
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
