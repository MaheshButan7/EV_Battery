import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Zap, BatteryCharging } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import SiteLocationMap from '../components/SiteLocationMap';
import { useDemoData } from '../hooks/useDemoData';

function SiteHealthRow({ site, selectSite }) {
  const isAttention = site.riskLevel !== 'Low' || site.commsStatus !== 'Online' || site.activeAlarms > 0;
  return (
    <Link
      to={`/site/${site.id}`}
      onClick={() => selectSite(site.id)}
      className="block border-b border-slate-100 py-3.5 last:border-0 dark:border-slate-800"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{site.name.replace(/ (Grid Storage|Desert BESS|Coastal BESS|Industrial BESS)/, '')}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{site.location} Zone</p>
        </div>
        <span className={`rounded-md px-2 py-1.5 text-[10px] font-bold ${isAttention ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
          {isAttention ? 'Attention' : 'Normal'}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div><p className="text-[10px] text-slate-400">Availability</p><p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">{site.availability}%</p></div>
        <div><p className="text-[10px] text-slate-400">Battery health</p><p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">{site.soh}%</p></div>
        <div><p className="text-[10px] text-slate-400">Active alarms</p><p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">{site.activeAlarms}</p></div>
      </div>
      <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${site.availability}%` }} /></div>
    </Link>
  );
}

function MetricCard({ icon: Icon, iconClass, label, value, detail }) {
  return (
    <div className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`rounded-md p-1.5 ${iconClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

export default function FleetMap() {
  const { accessibleSites, selectSite } = useDemoData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [layers, setLayers] = useState({ alarms: true, communications: true, health: true, availability: true, weather: true });
  const [fitKey, setFitKey] = useState(0);
  const weatherBySite = { 'BESS-PUNE': '31 °C · Clear', 'BESS-JODHUR': '36 °C · Dry', 'BESS-CHENNAI': '29 °C · Humid', 'BESS-RAIPUR': '32 °C · Cloudy' };
  const filteredSites = useMemo(() => accessibleSites.filter((site) => {
    const matchesQuery = `${site.name} ${site.location} ${site.id}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (statusFilter === 'Offline' ? site.commsStatus === 'Offline' : statusFilter === 'Attention' ? site.riskLevel !== 'Low' || site.activeAlarms > 0 : site.status === statusFilter);
    return matchesQuery && matchesStatus;
  }).map((site) => ({ ...site, weather: weatherBySite[site.id] || '32 °C · Clear' })), [accessibleSites, query, statusFilter]);
  const healthySites = accessibleSites.filter((site) => site.commsStatus === 'Online' && site.activeAlarms === 0).length;
  const netPower = useMemo(() => accessibleSites.reduce((sum, site) => sum + site.powerMW, 0), [accessibleSites]);
  const energyToday = useMemo(() => accessibleSites.reduce((sum, site) => sum + site.energyTodayMWh, 0), [accessibleSites]);

  return (
    <PageFrame title="GIS / Site Map" description="Geographic view of site health, communications, and operating status.">
      <section className="surface-card flex flex-col gap-4 rounded-2xl border bg-white p-4 dark:bg-slate-900 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3"><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Search sites<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Site or location" className="mt-1 block min-w-52 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900"><option>All</option><option>Attention</option><option>Offline</option><option>Charging</option><option>Discharging</option><option>Fault</option></select></label></div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">{[['alarms', 'Alarms'], ['communications', 'Communications'], ['health', 'Battery health'], ['availability', 'Availability'], ['weather', 'Weather']].map(([key, label]) => <label key={key} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-300"><input type="checkbox" checked={layers[key]} onChange={(event) => setLayers((current) => ({ ...current, [key]: event.target.checked }))} className="accent-cyan-600" />{label}</label>)}</div>
      </section>
      <section className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="min-h-[420px]"><SiteLocationMap sites={filteredSites} onSelectSite={selectSite} layers={layers} fitKey={fitKey} onFitFleet={() => setFitKey((value) => value + 1)} /></div>
        <section className="surface-card h-full min-w-0 rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Site health & communications</h2>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Fleet indicators with drill-down context</p>
          </div>
          <div>
            {filteredSites.map((site) => <SiteHealthRow key={site.id} site={site} selectSite={selectSite} />)}
            {filteredSites.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No sites match these filters.</p>}
          </div>
        </section>
      </section>
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Fleet map metrics">
        <MetricCard icon={Cloud} iconClass="bg-emerald-500/10 text-emerald-600" label="Communications" value={`${healthySites}/${accessibleSites.length} healthy`} detail="Site link status" />
        <MetricCard icon={Zap} iconClass="bg-blue-500/10 text-blue-500" label="Net active power" value={`${netPower.toFixed(1)} MW`} detail="Selected site scope" />
        <MetricCard icon={BatteryCharging} iconClass="bg-emerald-500/10 text-emerald-600" label="Energy today" value={`${energyToday.toFixed(1)} MWh`} detail="Sum across selected scope" />
      </section>
    </PageFrame>
  );
}
