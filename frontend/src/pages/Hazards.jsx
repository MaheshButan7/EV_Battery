import React from 'react';
import PageFrame from '../components/ui/PageFrame';
import { AlertTriangle, Flame, Radio, ShieldAlert, Thermometer } from 'lucide-react';
import { useDemoData } from '../hooks/useDemoData';

export default function Hazards() {
  const { selectedSite } = useDemoData();

  const items = [];
  if (selectedSite?.id === 'BESS-JODHUR') {
    items.push({ icon: Flame, label: 'Thermal', detail: 'Cell C1-R2-M4-C07 at 51 °C', severity: 'Critical' });
  }
  if (selectedSite?.id === 'BESS-RAIPUR') {
    items.push({ icon: Thermometer, label: 'HVAC', detail: 'Unit 1 unavailable; rack temperature rising', severity: 'Major' });
  }
  if (selectedSite?.commsStatus === 'Offline') {
    items.push({ icon: Radio, label: 'Communications', detail: 'Gateway offline; local buffer active', severity: 'Major' });
  }
  if (selectedSite && items.length === 0) {
    items.push({ icon: ShieldAlert, label: 'No active hazard', detail: 'Safety systems reporting normally', severity: 'Healthy' });
  }

  return (
    <PageFrame
      title="Safety & Hazards"
      description={`${selectedSite?.name || 'Selected site'} safety view for thermal, electrical, fire, environmental and communications risks.`}
    >
      {selectedSite ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {items.map(({ icon: Icon, label, detail, severity }) => (
            <div key={`${selectedSite.id}-${label}`} className="surface-card flex items-start gap-4 rounded-2xl border bg-white p-5 dark:bg-slate-900">
              <div className={`rounded-xl p-3 ${severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' : severity === 'Major' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">{selectedSite.name} · {label}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{severity}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><AlertTriangle className="h-3 w-3" /> Hazard assessment</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-card rounded-2xl border bg-white p-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          Select a site to view its safety and hazard status.
        </div>
      )}
    </PageFrame>
  );
}
