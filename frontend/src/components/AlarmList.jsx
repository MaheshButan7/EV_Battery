import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Info, Siren, AlertCircle } from 'lucide-react';
import { getAlarmPriorityStyle } from '../utils/formatters';

const priorityIcons = {
  Critical: AlertOctagon,
  Major: Siren,
  Minor: AlertTriangle,
  Warning: AlertCircle,
  Info: Info,
};

export default function AlarmList({ alarms = [] }) {
  return (
    <div className="space-y-2.5">
      {alarms.map((alarm) => {
        const style = getAlarmPriorityStyle(alarm.priority);
        const Icon = priorityIcons[alarm.priority] || Info;

        return (
          <div
            key={alarm.id}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className={`p-2 rounded-lg border ${style.badge} shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {alarm.siteId && (
                    <Link
                      to={`/site/${alarm.siteId}`}
                      className="font-bold text-xs text-slate-900 dark:text-white hover:text-cyan-500 dark:hover:text-cyan-400"
                    >
                      {alarm.siteId}
                    </Link>
                  )}
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    • {alarm.title}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${style.badge}`}>
                    {alarm.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {alarm.description}
                </p>
                {alarm.equipment && (
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    {alarm.equipment}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
              {alarm.timestamp}
            </span>
          </div>
        );
      })}
    </div>
  );
}
