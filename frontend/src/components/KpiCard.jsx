import React from 'react';
import { Building2, HeartPulse, AlertTriangle, Zap, Shield, TrendingUp, TrendingDown } from 'lucide-react';

const iconMap = {
  // BESS KPI types
  totalSites: Building2,
  installedCapacity: Zap,
  avgFleetSoh: HeartPulse,
  activeAlarms: AlertTriangle,
  fleetAvailability: Shield,
};

const colorMap = {
  totalSites: { bg: 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400', glow: 'border-blue-500/20' },
  installedCapacity: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400', glow: 'border-cyan-500/20' },
  avgFleetSoh: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', glow: 'border-emerald-500/20' },
  activeAlarms: { bg: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400', glow: 'border-rose-500/20' },
  fleetAvailability: { bg: 'bg-slate-500/10 dark:bg-slate-500/15 text-slate-600 dark:text-slate-300', glow: 'border-slate-500/20' },
};

export default function KpiCard({ type, label, value, delta, deltaType, suffix = '' }) {
  const Icon = iconMap[type] || Building2;
  const style = colorMap[type] || colorMap.totalSites;

  return (
    <div className="surface-card relative flex flex-col justify-between overflow-hidden border p-5">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`p-2.5 rounded-lg ${style.bg}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-[1.8rem] font-bold tracking-[-0.035em] text-slate-950 dark:text-white tabular-nums">
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
