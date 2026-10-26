import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Battery,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock3,
  HeartPulse,
  Gauge,
  Activity,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageFrame from '../components/ui/PageFrame';
import { getAlarmPriorityStyle } from '../utils/formatters';
import { useDemoData } from '../hooks/useDemoData';
import { useTheme } from '../hooks/useTheme';

const chargeTrend = [
  { time: '01:00', soc: 72, temperature: 27 },
  { time: '03:00', soc: 79, temperature: 27 },
  { time: '05:00', soc: 81, temperature: 26 },
  { time: '07:00', soc: 79, temperature: 25 },
  { time: '09:00', soc: 72, temperature: 25 },
  { time: '11:00', soc: 63, temperature: 26 },
  { time: '13:00', soc: 57, temperature: 27 },
  { time: '15:00', soc: 54, temperature: 27 },
  { time: '17:00', soc: 56, temperature: 26 },
  { time: '19:00', soc: 63, temperature: 25 },
  { time: '21:00', soc: 70, temperature: 25 },
  { time: '23:00', soc: 68, temperature: 26 },
];

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function tooltipStyle() {
  return {
    backgroundColor: 'var(--app-tooltip-bg)',
    borderColor: 'var(--app-tooltip-border)',
    borderRadius: '0.5rem',
    fontSize: '11px',
    color: 'var(--app-tooltip-text)',
  };
}

function SiteLink({ site, selectSite, children, className = '' }) {
  return (
    <Link to={`/site/${site.id}`} onClick={() => selectSite(site.id)} className={className}>
      {children}
    </Link>
  );
}

function MetricCard({ icon: Icon, iconClass, label, value, detail }) {
  return (
    <div className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`rounded-md p-1.5 ${iconClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5 ${className}`}>
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-5 text-slate-900 dark:text-white sm:text-base">{title}</h2>
          {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export default function Overview() {
  const [rankingMetric, setRankingMetric] = useState('healthIndex');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { accessibleSites, accessibleAlarms, selectSite } = useDemoData();
  const activeAlarms = useMemo(() => accessibleAlarms.filter((alarm) => alarm.state === 'Active'), [accessibleAlarms]);
  const onlineSites = accessibleSites.filter((site) => site.commsStatus === 'Online');
  const capacityMW = accessibleSites.reduce((sum, site) => sum + site.capacityMW, 0);
  const fleetSoh = average(accessibleSites.map((site) => site.soh));
  const fleetAvailability = average(accessibleSites.map((site) => site.availability));
  const fleetPower = accessibleSites.reduce((sum, site) => sum + site.powerMW, 0);
  const fleetEnergy = accessibleSites.reduce((sum, site) => sum + site.energyTodayMWh, 0);
  const fleetRte = average(accessibleSites.map((site) => site.roundTripEfficiency));
  const priorityAlarms = [...activeAlarms].sort((a, b) => (
    ({ Critical: 0, Major: 1, Warning: 2, Minor: 3, Info: 4 }[a.priority] ?? 5)
      - ({ Critical: 0, Major: 1, Warning: 2, Minor: 3, Info: 4 }[b.priority] ?? 5)
  )).slice(0, 4);
  const rankingOptions = { healthIndex: 'Health score', availability: 'Availability', roundTripEfficiency: 'Round-trip efficiency', energyTodayMWh: 'Energy throughput' };
  const rankedSites = [...accessibleSites].sort((a, b) => b[rankingMetric] - a[rankingMetric]);

  return (
    <PageFrame title="Fleet Overview" description="Fleet status, energy performance, site health, and priority alerts.">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Fleet performance indicators">
        <MetricCard icon={Building2} iconClass="bg-emerald-500/10 text-emerald-600" label="Sites in fleet" value={`${onlineSites.length} / ${accessibleSites.length}`} detail="All registered demo sites" />
        <MetricCard icon={Zap} iconClass="bg-cyan-500/10 text-cyan-600" label="Installed capacity" value={`${capacityMW} MW`} detail="Across all four sites" />
        <MetricCard icon={Zap} iconClass="bg-cyan-500/10 text-cyan-600" label="Fleet active power" value={`${fleetPower.toFixed(1)} MW`} detail="Net instantaneous output" />
        <MetricCard icon={Battery} iconClass="bg-blue-500/10 text-blue-600" label="Stored energy" value={`${accessibleSites.reduce((sum, site) => sum + (site.soc / 100) * site.capacityMWh, 0).toFixed(1)} MWh`} detail="Estimated from SOC and capacity" />
        <MetricCard icon={Battery} iconClass="bg-emerald-500/10 text-emerald-600" label="Fleet state of charge" value={`${average(accessibleSites.map((site) => site.soc)).toFixed(1)}%`} detail="Mean across all sites" />
        <MetricCard icon={HeartPulse} iconClass="bg-emerald-500/10 text-emerald-600" label="Fleet state of health" value={`${fleetSoh.toFixed(1)}%`} detail="Mean across all sites" />
        <MetricCard icon={Activity} iconClass="bg-amber-500/10 text-amber-600" label="Fleet availability" value={`${fleetAvailability.toFixed(1)}%`} detail="Mean across all sites · target 99%" />
        <MetricCard icon={Gauge} iconClass="bg-cyan-500/10 text-cyan-600" label="Round-trip efficiency" value={`${fleetRte.toFixed(1)}%`} detail="Mean across all sites" />
        <MetricCard icon={AlertTriangle} iconClass="bg-rose-500/10 text-rose-500" label="Active fleet alarms" value={activeAlarms.length} detail="All sites · all severities" />
        <MetricCard icon={Zap} iconClass="bg-teal-500/10 text-teal-600" label="Energy throughput" value={`${fleetEnergy.toFixed(1)} MWh`} detail="Delivered today across fleet" />
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1fr]" aria-label="Fleet trends and status">
        <Panel title="Energy & state of charge" subtitle="24h view · sampled at 1 minute" action={<div className="flex items-center gap-2 text-[9px] text-slate-500"><span className="rounded border border-slate-200 px-1.5 py-1 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">24H</span><span>7D</span><span>30D</span><Clock3 className="ml-1 h-3 w-3" /><span>1 minute</span><ChevronDown className="h-3 w-3" /></div>} className="min-h-[265px]">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chargeTrend} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
              <defs><linearGradient id="socFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--app-accent)" stopOpacity={0.2} /><stop offset="100%" stopColor="var(--app-accent)" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis dataKey="time" stroke={isDark ? '#94a3b8' : '#7b8da1'} fontSize={9} tickLine={false} />
              <YAxis domain={[0, 100]} stroke={isDark ? '#94a3b8' : '#7b8da1'} fontSize={9} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value, name) => [`${value}%`, name === 'soc' ? 'SOC' : 'Temperature']} />
              <Area type="monotone" dataKey="soc" stroke="var(--app-accent)" strokeWidth={2} fill="url(#socFill)" />
              <Line type="monotone" dataKey="temperature" stroke="#e5a22b" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-1 flex justify-center gap-4 text-[10px] text-slate-500"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-cyan-500" />SOC %</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#e5a22b]" />Temperature °C</span></div>
        </Panel>

        <Panel title="Fleet status" subtitle="Operational snapshot by site" className="min-h-[265px]">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {accessibleSites.map((site) => {
              const siteAlarms = activeAlarms.filter((alarm) => alarm.siteId === site.id).length;
              const healthy = site.commsStatus === 'Online' && site.riskLevel === 'Low';
              return (
                <SiteLink key={site.id} site={site} selectSite={selectSite} className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0">
                  <span className={`h-2 w-2 rounded-full ${healthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div className="min-w-0 flex-1"><p className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{site.name.replace(/ (Grid Storage|Desert BESS|Coastal BESS|Industrial BESS)/, '')}</p><p className="truncate text-[9px] text-slate-400">{site.location} · {site.commsStatus === 'Online' ? 'Healthy communications' : 'Communications offline'}</p></div>
                  <div className="text-right"><p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{site.soc}%</p><p className="text-[8px] text-slate-400">SOC</p></div>
                  <div className="text-right"><p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{site.availability}%</p><p className="text-[8px] text-slate-400">AVAILABILITY</p></div>
                  <span className={`rounded px-2 py-1 text-[9px] font-bold ${healthy ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>{siteAlarms ? 'Attention' : 'Normal'}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </SiteLink>
              );
            })}
          </div>
        </Panel>
      </section>

      <Panel title="Site ranking" subtitle="Compare sites by a selected operational KPI" action={<label className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wide text-slate-500">Rank by<select value={rankingMetric} onChange={(event) => setRankingMetric(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900">{Object.entries(rankingOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{rankedSites.map((site, index) => <SiteLink key={site.id} site={site} selectSite={selectSite} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold">{site.name}</span><span className="mt-0.5 block text-[9px] text-slate-500">{rankingOptions[rankingMetric]}</span></span><strong className="text-xs">{rankingMetric === 'energyTodayMWh' ? `${site[rankingMetric].toFixed(1)} MWh` : `${site[rankingMetric].toFixed(1)}%`}</strong></SiteLink>)}</div>
      </Panel>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_1fr]" aria-label="Fleet alarms and energy">
        <Panel title="Priority alarm queue" subtitle="Active and acknowledged items across the fleet" action={<Link to="/alarms" className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">View all <ChevronRight className="inline h-3 w-3" /></Link>}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {priorityAlarms.map((alarm) => {
              const style = getAlarmPriorityStyle(alarm.priority);
              const site = accessibleSites.find((item) => item.id === alarm.siteId);
              return <div key={alarm.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"><span className={`h-6 w-0.5 rounded ${alarm.priority === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}`} /><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-slate-800 dark:text-slate-100">{alarm.title}</p><p className="mt-0.5 text-[9px] text-slate-400">{site?.name || alarm.siteId} · {alarm.equipment} · {alarm.timestamp}</p></div><span className={`rounded px-2 py-1 text-[9px] font-bold ${style.badge}`}>{alarm.priority}</span></div>;
            })}
          </div>
        </Panel>
        <Panel title="Fleet energy today" subtitle="Daily energy delivered by site" className="min-h-[245px]">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={accessibleSites.map((site) => ({ site: site.name.split(' ')[0], energy: site.energyTodayMWh }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis dataKey="site" stroke={isDark ? '#94a3b8' : '#7b8da1'} fontSize={9} tickLine={false} />
              <YAxis stroke={isDark ? '#94a3b8' : '#7b8da1'} fontSize={9} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value} MWh`, 'Energy']} />
              <Bar dataKey="energy" fill="#15978b" radius={[4, 4, 0, 0]} barSize={54} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </section>
    </PageFrame>
  );
}
