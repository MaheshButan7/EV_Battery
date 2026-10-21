import React from 'react';
import { Link } from 'react-router-dom';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { Activity, ArrowRight, BrainCircuit, Thermometer } from 'lucide-react';

export default function AssetHealth() {
  const { createWorkOrderFromAlarm, accessibleAlarms, accessibleSites, selectSite } = useDemoData();
  const risks = accessibleSites.map((site) => ({
    ...site,
    issue: site.id === 'BESS-JODHUR' ? 'Thermal runaway risk' : site.id === 'BESS-RAIPUR' ? 'Capacity fade and HVAC fault' : site.id === 'BESS-CHENNAI' ? 'Gateway communication loss' : 'PCS heat derating',
    confidence: site.id === 'BESS-JODHUR' ? '93.1%' : site.id === 'BESS-RAIPUR' ? '91.4%' : '87.0%',
    rulRange: `${Math.max(2, Math.round(site.rul - 1.5))}–${Math.round(site.rul + 1.5)} years`,
  })).sort((a, b) => a.healthIndex - b.healthIndex);
  const averageHealth = accessibleSites.length
    ? accessibleSites.reduce((sum, site) => sum + site.healthIndex, 0) / accessibleSites.length
    : 0;
  const atRiskCount = accessibleSites.filter((site) => site.riskLevel !== 'Low' || site.healthIndex < 85).length;
  const sourceAlarmFor = (siteId) => accessibleAlarms.find((alarm) => alarm.siteId === siteId && !['Info', 'Information'].includes(alarm.priority));
  return (
    <PageFrame title="Asset Health & Predictive Maintenance" description="Health scores, degradation signals and explainable recommendations across all BESS sites.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[['Average site health', averageHealth.toFixed(1), Activity], ['Sites at risk', atRiskCount, Thermometer], ['Health indicators', accessibleSites.length * 4, BrainCircuit]].map(([label, value, Icon]) => <div key={label} className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><Icon className="h-5 w-5 text-cyan-500" /><p className="mt-3 text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{value}</p></div>)}
      </div>
      <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Assets requiring attention</h2>
        <div className="mt-4 space-y-3">
          {risks.map((site) => {
            const sourceAlarm = sourceAlarmFor(site.id);
            return <div key={site.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link to={`/site/${site.id}`} onClick={() => selectSite(site.id)} className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{site.name}</Link><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800">{site.healthIndex}/100 health</span><span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">RUL {site.rulRange}</span></div><p className="mt-1 text-xs text-slate-500">{site.issue}</p><div className="mt-3 h-2 max-w-md rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-2 rounded-full ${site.healthIndex < 85 ? 'bg-rose-500' : site.healthIndex < 92 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${site.healthIndex}%` }} /></div></div><div className="flex items-center gap-2"><span className="text-right text-[10px] text-slate-500">Confidence<br /><strong className="text-slate-800 dark:text-slate-200">{site.confidence}</strong></span>{sourceAlarm && <button type="button" onClick={() => createWorkOrderFromAlarm(sourceAlarm.id)} className="rounded-lg bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">{sourceAlarm.workOrderId || 'Create work order'}</button>}<ArrowRight className="h-4 w-4 text-slate-400" /></div></div>;
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4 text-xs text-slate-700 dark:text-slate-300"><strong>Health model:</strong> recommendations combine equipment signals, degradation trends, and maintenance thresholds.</div>
    </PageFrame>
  );
}
