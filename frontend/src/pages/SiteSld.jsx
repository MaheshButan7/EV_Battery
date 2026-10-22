import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSite } from '../services/api';
import PageFrame from '../components/ui/PageFrame';
import { Activity, Battery, Circle, Gauge, GitBranch, Radio, Shield, Zap } from 'lucide-react';

function SldNode({ icon: Icon, label, value, status = 'Normal', tone = 'emerald', assetId, onSelect }) {
  const tones = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  };
  return (
    <button type="button" onClick={() => onSelect?.({ label, value, status, assetId })} className={`min-w-[150px] rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-3 text-lg font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
        <Circle className="h-2 w-2 fill-current" /> {status}
      </p>
      {assetId && <p className="mt-2 font-mono text-[9px] opacity-70">{assetId}</p>}
    </button>
  );
}

export default function SiteSld() {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);

  useEffect(() => {
    getSite(id).then(setSite);
  }, [id]);

  if (!site) return <div className="p-8 text-sm text-slate-500">Loading electrical topology…</div>;
  const eq = site.equipment;
  const critical = site.id === 'BESS-JODHUR';

  return (
    <PageFrame title="SLD" description={`${site.name} · Electrical topology and equipment status.`}>
      <div className="surface-card overflow-x-auto rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:p-8">
        <div className="flex min-w-[900px] items-center justify-center gap-3 py-10">
          <SldNode icon={Radio} label="Grid / Meter" value={`${eq.energyMeter.todayDischargedMWh} MWh`} status="Connected" tone="cyan" assetId={`${site.id}-MTR-01`} onSelect={setSelectedElement} />
          <GitBranch className="h-6 w-6 shrink-0 text-slate-400" />
          <SldNode icon={Zap} label="Transformer" value={`${eq.transformer.loadPercent}% load`} status={eq.transformer.status} assetId={`${site.id}-TRF-01`} onSelect={setSelectedElement} />
          <GitBranch className="h-6 w-6 shrink-0 text-slate-400" />
          <SldNode icon={Shield} label="Switchgear" value={eq.switchgear.breakerClosed ? 'Closed' : 'Open'} status={eq.switchgear.status} assetId={`${site.id}-SWG-01`} onSelect={setSelectedElement} />
          <GitBranch className="h-6 w-6 shrink-0 text-slate-400" />
          <SldNode icon={Gauge} label="PCS 1" value={`${eq.pcs.activePowerMW} MW`} status={eq.pcs.status} tone={critical ? 'amber' : 'emerald'} assetId={`${site.id}-PCS-01`} onSelect={setSelectedElement} />
          <GitBranch className="h-6 w-6 shrink-0 text-slate-400" />
          <SldNode icon={Battery} label="Battery DC Bus" value={`${site.soc}% SOC`} status={critical ? 'Check required' : 'Normal'} tone={critical ? 'rose' : 'emerald'} assetId={`${site.id}-BMS-01`} onSelect={setSelectedElement} />
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 border-t border-dashed border-slate-300 pt-6 dark:border-slate-700 sm:grid-cols-2 xl:grid-cols-5">
          <SldNode icon={Activity} label="Protection Relay" value="Armed" status="Healthy" assetId={`${site.id}-PR-01`} onSelect={setSelectedElement} />
          <SldNode icon={Radio} label="Edge Gateway" value={site.commsStatus} status={site.commsStatus === 'Offline' ? 'Buffered' : 'Synchronized'} tone={site.commsStatus === 'Offline' ? 'amber' : 'emerald'} assetId={`${site.id}-GW-01`} onSelect={setSelectedElement} />
          <SldNode icon={Shield} label="Fire Panel" value={critical ? 'Trouble' : 'Normal'} status={critical ? 'Investigate' : 'Healthy'} tone={critical ? 'rose' : 'emerald'} assetId={`${site.id}-FIRE-01`} onSelect={setSelectedElement} />
          <SldNode icon={Zap} label="Auxiliary Power" value="Online" status="Normal" tone="cyan" assetId={`${site.id}-AUX-01`} onSelect={setSelectedElement} />
          <SldNode icon={Activity} label="HVAC" value={eq.hvac[0].actualC + ' °C'} status={eq.hvac[0].status} assetId={`${site.id}-HVAC-01`} onSelect={setSelectedElement} />
        </div>
      </div>
      {selectedElement && <div className="surface-card flex flex-col gap-3 rounded-xl border border-cyan-500/20 bg-white p-4 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">Equipment detail</p><h2 className="mt-1 text-sm font-bold">{selectedElement.label}</h2><p className="mt-1 text-xs text-slate-500">{selectedElement.assetId} · {selectedElement.value} · {selectedElement.status}</p>{critical && <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-300">Alarm path highlighted for the Jodhpur hot-cell demo scenario.</p>}</div><Link to={`/assets?query=${encodeURIComponent(selectedElement.assetId)}`} className="rounded-lg bg-cyan-500/10 px-3 py-2 text-center text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">Open asset record</Link></div>}
    </PageFrame>
  );
}
