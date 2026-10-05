import React from 'react';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const severityIcons = {
  Critical: {
    icon: AlertOctagon,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  Warning: {
    icon: AlertTriangle,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  Info: {
    icon: Info,
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  },
};

export default function AlertList({ alerts = [] }) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const style = severityIcons[alert.severity] || severityIcons.Info;
        const Icon = style.icon;

        return (
          <div
            key={alert.id}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className={`p-2 rounded-lg border ${style.color} shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/vehicle/${alert.vehicleId}`}
                    className="font-bold text-xs text-slate-900 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400"
                  >
                    {alert.vehicleId}
                  </Link>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    • {alert.title}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {alert.description}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
              {alert.timestamp}
            </span>
          </div>
        );
      })}
    </div>
  );
}
