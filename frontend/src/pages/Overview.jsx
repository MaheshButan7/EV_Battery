import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  Clock3,
  MapPin,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import PageFrame from '../components/ui/PageFrame';
import Button from '../components/ui/Button';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';
import { getAlarmPriorityStyle } from '../utils/formatters';
import { mockFleetOverview } from '../data/fleetOverview';
import { useDemoData } from '../hooks/useDemoData';
import { useTheme } from '../hooks/useTheme';

const priorityOrder = { Critical: 0, Major: 1, Minor: 2, Warning: 3, Info: 4, Information: 4 };

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function tooltipStyle(isDark) {
  return {
    backgroundColor: isDark ? '#0e1a2b' : '#ffffff',
    borderColor: isDark ? '#26364b' : '#dfe7f1',
    borderRadius: '0.75rem',
    fontSize: '11px',
    color: isDark ? '#f8fafc' : '#172033',
  };
}

function SiteLink({ site, selectSite, children, className = '' }) {
  return (
    <Link to={`/site/${site.id}`} onClick={() => selectSite(site.id)} className={className}>
      {children}
    </Link>
  );
}

export default function Overview() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    accessibleSites,
    accessibleAlarms,
    selectSite,
    acknowledgeAlarm,
    createWorkOrderFromAlarm,
  } = useDemoData();

  const activeAlarms = useMemo(
    () => accessibleAlarms.filter((alarm) => alarm.state === 'Active'),
    [accessibleAlarms],
  );
  const siteRows = useMemo(() => accessibleSites.map((site) => {
    const siteAlarms = activeAlarms.filter((alarm) => alarm.siteId === site.id);
    const criticalCount = siteAlarms.filter((alarm) => alarm.priority === 'Critical').length;
    const actionableAlarmCount = siteAlarms.filter((alarm) => !['Info', 'Information'].includes(alarm.priority)).length;
    return { ...site, activeAlarms: siteAlarms.length, criticalCount, actionableAlarmCount };
  }).sort((a, b) => b.criticalCount - a.criticalCount || b.activeAlarms - a.activeAlarms || b.healthIndex - a.healthIndex), [accessibleSites, activeAlarms]);

  const onlineSites = accessibleSites.filter((site) => site.commsStatus === 'Online');
  const capacityMW = accessibleSites.reduce((sum, site) => sum + site.capacityMW, 0);
  const capacityMWh = accessibleSites.reduce((sum, site) => sum + site.capacityMWh, 0);
  const fleetSoh = average(accessibleSites.map((site) => site.soh));
  const fleetAvailability = average(accessibleSites.map((site) => site.availability));
  const criticalAlarms = activeAlarms.filter((alarm) => alarm.priority === 'Critical').length;
  const priorityAlarms = [...activeAlarms]
    .sort((a, b) => (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5))
    .slice(0, 5);
  const statusCounts = accessibleSites.reduce((counts, site) => {
    counts[site.status] = (counts[site.status] || 0) + 1;
    return counts;
  }, {});
  const attentionSites = siteRows.filter((site) => site.riskLevel !== 'Low' || site.commsStatus !== 'Online' || site.actionableAlarmCount > 0);

  return (
    <PageFrame
      title="Fleet Overview"
      description="Fleet-wide visibility into site operations, battery health, communications and alarm response. Select a site from the sidebar to explore its detailed operating views."
      actions={<Button as={Link} to="/map" variant="secondary" size="sm" icon={MapPin}>Open site map</Button>}
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Fleet performance indicators">
        <KpiCard type="totalSites" label="Sites reporting" value={`${onlineSites.length} / ${accessibleSites.length}`} delta={`${accessibleSites.length - onlineSites.length} offline`} deltaType={onlineSites.length === accessibleSites.length ? 'positive' : 'warning'} />
        <KpiCard type="installedCapacity" label="Installed capacity" value={`${capacityMW} / ${capacityMWh}`} suffix="MW / MWh" delta="Across accessible sites" deltaType="neutral" />
        <KpiCard type="avgFleetSoh" label="Average fleet SoH" value={fleetSoh.toFixed(1)} suffix="%" delta="Mean across accessible sites" deltaType="neutral" />
        <KpiCard type="activeAlarms" label="Active alarms" value={activeAlarms.length} delta={`${criticalAlarms} critical`} deltaType={criticalAlarms ? 'negative' : 'positive'} />
        <KpiCard type="fleetAvailability" label="Fleet availability" value={fleetAvailability.toFixed(1)} suffix="%" delta="Mean across accessible sites" deltaType={fleetAvailability >= 99 ? 'positive' : 'warning'} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]" aria-label="Fleet status and operational attention">
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-white">Site status</h2>
              <p className="mt-1 text-xs text-slate-500">Current operating mode and communications across the fleet.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <span key={status} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {count} {status}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[670px] text-xs">
              <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800"><th className="pb-3">Site</th><th className="pb-3">Operating state</th><th className="pb-3">Communications</th><th className="pb-3">SoC / SoH</th><th className="pb-3">Alarms</th><th className="pb-3">Risk</th></tr></thead>
              <tbody>
                {siteRows.map((site) => (
                  <tr key={site.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/80">
                    <td className="py-3.5"><SiteLink site={site} selectSite={selectSite} className="font-bold text-cyan-700 hover:text-cyan-900 dark:text-cyan-300">{site.name}</SiteLink><span className="mt-0.5 block text-[10px] text-slate-400">{site.location}</span></td>
                    <td className="py-3.5"><StatusBadge status={site.status} /></td>
                    <td className="py-3.5"><span className={`inline-flex items-center gap-1.5 ${site.commsStatus === 'Online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}><Radio className="h-3.5 w-3.5" />{site.commsStatus}</span></td>
                    <td className="py-3.5 tabular-nums">{site.soc}% <span className="text-slate-400">/</span> {site.soh}%</td>
                    <td className="py-3.5">{site.activeAlarms > 0 ? <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400"><AlertCircle className="h-3.5 w-3.5" />{site.activeAlarms}</span> : <span className="text-slate-400">0</span>}</td>
                    <td className="py-3.5"><RiskBadge risk={site.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {attentionSites.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><AlertCircle className="h-4 w-4 text-amber-500" />{attentionSites.length} sites need operational review</span>
              <SiteLink site={attentionSites[0]} selectSite={selectSite} className="inline-flex items-center gap-1 font-bold text-cyan-700 dark:text-cyan-300">Review {attentionSites[0].name}<ArrowRight className="h-3.5 w-3.5" /></SiteLink>
            </div>
          )}
        </div>

        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h2 className="text-base font-bold text-slate-950 dark:text-white">Priority alarm queue</h2><p className="mt-1 text-xs text-slate-500">Highest priority active alarms across accessible sites.</p></div>
            <Link to="/alarms" className="shrink-0 text-xs font-bold text-cyan-700 dark:text-cyan-300">View all</Link>
          </div>
          <div className="space-y-2.5">
            {priorityAlarms.map((alarm) => {
              const style = getAlarmPriorityStyle(alarm.priority);
              const site = accessibleSites.find((item) => item.id === alarm.siteId);
              return (
                <div key={alarm.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{alarm.title}</p>
                      <SiteLink site={site} selectSite={selectSite} className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300"><MapPin className="h-3 w-3" />{site?.name || alarm.siteId}</SiteLink>
                    </div>
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${style.badge}`}>{alarm.priority === 'Information' ? 'Info' : alarm.priority}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{alarm.description}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Clock3 className="h-3 w-3" />{alarm.timestamp}</span>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => acknowledgeAlarm(alarm.id)} className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300">Acknowledge</button>
                      <button type="button" onClick={() => createWorkOrderFromAlarm(alarm.id)} className="rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[9px] font-semibold text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300">{alarm.workOrderId || 'Work order'}</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {priorityAlarms.length === 0 && <div className="flex min-h-40 flex-col items-center justify-center text-center"><ShieldCheck className="h-8 w-8 text-emerald-500" /><p className="mt-3 text-sm font-bold">No active alarms</p><p className="mt-1 text-xs text-slate-500">All accessible sites are clear.</p></div>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2" aria-label="Fleet performance trends">
        <ChartCard title="Fleet energy movement" subtitle="Daily energy charged and discharged across all sites" badgeText="MWh">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockFleetOverview.energyLast7Days} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
              <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value, name) => [`${value} MWh`, name === 'charged' ? 'Charged' : 'Discharged']} />
              <Bar dataKey="charged" name="Charged" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="discharged" name="Discharged" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fleet battery health" subtitle="Average state of health trend over the last 12 months" badgeText="SoH %">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockFleetOverview.sohTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="fleetSohFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.28} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
              <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis domain={[50, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value) => [`${value}%`, 'Average SoH']} />
              <Area type="monotone" dataKey="avgSoh" stroke="#06b6d4" strokeWidth={2.5} fill="url(#fleetSohFill)" activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4 text-xs">
        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><BatteryCharging className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />Select a site to open its battery, PCS, safety and maintenance details.</span>
        <Link to="/executive" className="inline-flex items-center gap-1 font-bold text-cyan-700 dark:text-cyan-300">Executive view <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
    </PageFrame>
  );
}
