import React from 'react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { AlertTriangle, Battery, CircleDollarSign, Gauge, ShieldCheck, Zap } from 'lucide-react';

export default function Executive() {
  const { selectedSite } = useDemoData();
  const accessibleSites = selectedSite ? [selectedSite] : [];
  return (
    <PageFrame title="Executive Dashboard" description="Site availability, energy, risk, lifecycle and maintenance outlook for decision makers.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{[['Availability', '98.7%', ShieldCheck], ['Energy delivered', '7,300 MWh', Zap], ['Round-trip efficiency', '92.7%', Gauge], ['Average site SoH', '92.5%', Battery], ['Critical risks', '2', AlertTriangle], ['Maintenance cost', '$184k', CircleDollarSign]].map(([label, value, Icon]) => <div key={label} className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><Icon className="h-5 w-5 text-cyan-500" /><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p></div>)}</div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="text-base font-bold text-slate-900 dark:text-white">Top risks and next actions</h2><div className="mt-4 space-y-3">{[...accessibleSites].sort((a, b) => a.healthIndex - b.healthIndex).slice(0, 3).map((site, index) => <div key={site.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-xs font-bold text-rose-500">0{index + 1}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold">{site.name}</p><p className="mt-1 text-[11px] text-slate-500">{site.riskLevel} risk · owner: Reliability Manager</p></div><span className="text-[10px] font-bold text-cyan-600">Review</span></div>)}</div></div>
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="text-base font-bold text-slate-900 dark:text-white">AI summary</h2><p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Jodhpur requires immediate thermal-safety review following a simulated hot-cell event. Raipur shows the highest degradation risk and should be prioritized for HVAC and rack-health maintenance. Site availability remains close to target, with Chennai communications recovery as the main operational dependency.</p><span className="mt-5 inline-flex rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">Simulated executive insight</span></div>
      </div>
    </PageFrame>
  );
}
