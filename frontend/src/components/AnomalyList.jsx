import React from 'react';
import { getAlarmPriorityStyle } from '../utils/formatters';
import { Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AnomalyList({ anomalies = [] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2.5">
        {anomalies.map((item, idx) => {
          const style = getAlarmPriorityStyle(item.priority);
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-lg border ${style.badge} shrink-0 mt-0.5`}>
                  <span className={`block w-2 h-2 rounded-full ${style.dot}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {item.location}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${style.badge}`}>
                      {item.priority}
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      Model estimate
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{item.issue}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.action}</p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 text-right">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  In {item.daysRemaining} days
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  Confidence: {item.modelConfidence}
                </span>
              </div>
            </div>
          );
        })}

        {/* All other systems/cells normal */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                All Other Cells & Equipment Operating Normally
              </span>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                Cell voltage variance &lt;15 mV across pack. Thermal delta within limits.
              </p>
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        </div>
      </div>
    </div>
  );
}
