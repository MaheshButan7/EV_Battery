import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSite } from '../services/api';
import CellHeatmap from '../components/CellHeatmap';
import PageFrame from '../components/ui/PageFrame';

export default function BatteryCells() {
  const { id } = useParams();
  const [site, setSite] = useState(null);

  useEffect(() => {
    getSite(id).then(setSite);
  }, [id]);

  if (!site) return <div className="p-8 text-sm text-slate-500">Loading battery telemetry…</div>;

  return (
    <PageFrame
      title="Battery & Cells"
      description={`${site.name} · ${site.capacityMW} MW / ${site.capacityMWh} MWh · 5,000 synthetic cells`}
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
        <CellHeatmap containers={site.pack.containers} />
      </div>
    </PageFrame>
  );
}
