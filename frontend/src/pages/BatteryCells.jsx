import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSite } from '../services/api';
import CellHeatmap from '../components/CellHeatmap';
import PageFrame from '../components/ui/PageFrame';

export default function BatteryCells() {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [selectedRackId, setSelectedRackId] = useState('');

  useEffect(() => {
    getSite(id).then(setSite);
  }, [id]);

  if (!site) return <div className="p-8 text-sm text-slate-500">Loading battery telemetry…</div>;
  const selectedRack = site.pack.rackSummary.find((rack) => rack.id === selectedRackId) || site.pack.rackSummary[0];

  return (
    <PageFrame
      title="Battery & Cells"
      description={`${site.name} · ${site.capacityMW} MW / ${site.capacityMWh} MWh · 5,000 cells`}
    >
      <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Cell health heatmap</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select a container and rack to inspect 500 cells at a time.
            </p>
          </div>
          <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-cyan-700 dark:text-cyan-300">
            {site.soh}% SOH
          </span>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Site SOC', `${site.soc}%`],
            ['Site SOH', `${site.soh}%`],
            ['State of energy', `${site.soeMWh} MWh`],
            ['Cell voltage spread', `${site.voltageImbalance} V`],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-lg font-bold tabular-nums">{value}</p></div>)}
        </div>
        <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800"><div><h3 className="text-xs font-bold">Rack and module electrical summary</h3><p className="mt-1 text-[10px] text-slate-500">Voltages are derived from the demo series-cell hierarchy; current and power are apportioned estimates.</p></div><label className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Rack<select aria-label="Choose rack summary" value={selectedRack?.id || ''} onChange={(event) => setSelectedRackId(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{site.pack.rackSummary.map((rack) => <option key={rack.id} value={rack.id}>{rack.containerName} · {rack.rackName}</option>)}</select></label></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[1120px] text-left text-[10px]">
            <thead className="bg-slate-50 font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50"><tr>{['Rack / module', 'SOC', 'Avg / max temp', 'Avg cell voltage', 'Module voltage', 'Rack voltage', 'Voltage spread', 'String current', 'Charge / discharge power', 'Balancing'].map((heading) => <th key={heading} className="px-3 py-2.5">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{[selectedRack].flatMap((rack) => [
              <tr key={rack.id} className="bg-cyan-500/[0.04] font-semibold"><td className="px-3 py-2.5">{rack.containerName} · {rack.rackName} (rack)</td><td className="px-3 py-2.5">{rack.averageSoc}%</td><td className="px-3 py-2.5">{rack.averageTemperature} / {rack.maxTemperature} °C</td><td className="px-3 py-2.5">{rack.averageCellVoltage} V</td><td className="px-3 py-2.5">—</td><td className="px-3 py-2.5">{rack.rackVoltage} V</td><td className="px-3 py-2.5">{rack.voltageSpread} V</td><td className="px-3 py-2.5">{rack.stringCurrentA} A</td><td className="px-3 py-2.5">{rack.chargeDischargePowerMW} MW</td><td className="px-3 py-2.5">{rack.balancingStatus}</td></tr>,
              ...rack.modules.map((module) => <tr key={`${rack.id}-${module.id}`}><td className="px-3 py-2.5 pl-7 text-slate-600 dark:text-slate-300">{rack.containerName} · {rack.rackName} · {module.name}</td><td className="px-3 py-2.5">{module.averageSoc}%</td><td className="px-3 py-2.5">{module.averageTemperature} / {module.maxTemperature} °C</td><td className="px-3 py-2.5">{module.averageCellVoltage} V</td><td className="px-3 py-2.5">{module.moduleVoltage} V</td><td className="px-3 py-2.5">—</td><td className="px-3 py-2.5">{module.voltageSpread} V</td><td className="px-3 py-2.5">—</td><td className="px-3 py-2.5">—</td><td className="px-3 py-2.5">{module.balancingStatus}</td></tr>),
            ])}</tbody>
          </table></div>
        </div>
        <CellHeatmap containers={site.pack.containers} siteId={site.id} />
      </div>
    </PageFrame>
  );
}
