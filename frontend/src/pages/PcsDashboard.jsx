import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSite } from '../services/api';
import ChartCard from '../components/ChartCard';
import PageFrame from '../components/ui/PageFrame';
import { Activity, Gauge, Zap } from 'lucide-react';

export default function PcsDashboard() {
  const { id } = useParams();
  const [site, setSite] = useState(null);

  useEffect(() => {
    getSite(id).then(setSite);
  }, [id]);

  if (!site) return <div className="p-8 text-sm text-slate-500">Loading PCS telemetry…</div>;
  const pcs = site.equipment.pcs;

  return (
    <PageFrame title="PCS" description={`${site.name} · Power conversion operating state, electrical measurements, and efficiency.`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Active power', `${pcs.activePowerMW} MW`, Zap],
          ['Reactive power', `${pcs.reactivePowerMVAr} MVAr`, Activity],
          ['Efficiency', `${pcs.efficiency}%`, Gauge],
          ['Frequency', `${pcs.frequency} Hz`, Activity],
        ].map(([label, value, Icon]) => (
          <div key={label} className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
            <Icon className="h-5 w-5 text-cyan-500" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="PCS operating state" subtitle="Current operating values">
          <div className="space-y-3 text-sm">
            {[
              ['Operating mode', pcs.mode],
              ['AC voltage', `${pcs.acVoltage} V`],
              ['DC voltage', `${pcs.dcVoltage} V`],
              ['State', pcs.status],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">{label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Derating and faults" subtitle="Condition assessment">
          <div className={`rounded-xl border p-4 ${site.id === 'BESS-PUNE' ? 'border-amber-500/30 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{site.id === 'BESS-PUNE' ? 'Temperature derating active' : 'No active PCS derating'}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{site.id === 'BESS-PUNE' ? 'Ambient heat has reduced the power setpoint for this demo scenario.' : 'PCS output is within the expected operating envelope.'}</p>
          </div>
        </ChartCard>
      </div>
    </PageFrame>
  );
}
