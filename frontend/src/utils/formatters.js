export function formatNumber(val, decimals = 0) {
  if (val === null || val === undefined) return '--';
  return Number(val).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(val, decimals = 1) {
  if (val === null || val === undefined) return '--%';
  return `${Number(val).toFixed(decimals)}%`;
}

export function formatVoltage(val) {
  if (val === null || val === undefined) return '-- V';
  return `${Number(val).toFixed(2)} V`;
}

export function formatTemperature(val) {
  if (val === null || val === undefined) return '-- °C';
  return `${Number(val).toFixed(1)} °C`;
}

export function formatCurrent(val) {
  if (val === null || val === undefined) return '-- A';
  const num = Number(val);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)} A`;
}

export function formatResistance(val) {
  if (val === null || val === undefined) return '-- mΩ';
  return `${Number(val).toFixed(2)} mΩ`;
}

export function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case 'charging':
      return {
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-500',
        label: 'Charging',
      };
    case 'driving':
      return {
        badge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        dot: 'bg-cyan-500',
        label: 'Driving',
      };
    case 'idle':
      return {
        badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
        label: 'Idle',
      };
    case 'fault':
      return {
        badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        dot: 'bg-rose-500 animate-pulse',
        label: 'Fault',
      };
    default:
      return {
        badge: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
        dot: 'bg-slate-400',
        label: status || 'Unknown',
      };
  }
}

export function getRiskStyle(risk) {
  switch (risk?.toLowerCase()) {
    case 'high':
      return {
        badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold',
        dot: 'bg-rose-500',
        label: 'High',
      };
    case 'medium':
      return {
        badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium',
        dot: 'bg-amber-500',
        label: 'Medium',
      };
    case 'low':
      return {
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-500',
        label: 'Low',
      };
    default:
      return {
        badge: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
        dot: 'bg-slate-400',
        label: risk || 'Normal',
      };
  }
}
