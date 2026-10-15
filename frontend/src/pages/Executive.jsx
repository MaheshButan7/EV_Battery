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
  AlertTriangle,
  ArrowUpRight,
  Battery,
  CircleDollarSign,
  Gauge,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import ChartCard from '../components/ChartCard';
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

const kpiDefinitions = [
  { label: 'Fleet availability', icon: ShieldCheck, format: (value) => `${value.toFixed(1)}%` },
  { label: 'Energy delivered · MTD', icon: Zap, format: () => '7,300 MWh' },
  { label: 'Round-trip efficiency', icon: Gauge, format: (value) => `${value.toFixed(1)}%` },
  { label: 'Average fleet SoH', icon: Battery, format: (value) => `${value.toFixed(1)}%` },
  { label: 'Critical active alarms', icon: AlertTriangle, format: (value) => value },
  { label: 'Maintenance spend · YTD', icon: CircleDollarSign, format: () => '$184k' },
];

export default function Executive() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { accessibleSites, accessibleAlarms, selectSite } = useDemoData();
  const siteById = useMemo(() => new Map(accessibleSites.map((site) => [site.id, site])), [accessibleSites]);
  const activeAlarms = useMemo(
    () => accessibleAlarms.filter((alarm) => alarm.state === 'Active'),
    [accessibleAlarms],
  );
  const topRisks = useMemo(() => [...activeAlarms]
    .filter((alarm) => !['Info', 'Information'].includes(alarm.priority))
    .sort((a, b) => (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5))
    .slice(0, 3), [activeAlarms]);

  const values = [
    average(accessibleSites.map((site) => site.availability)),
    null,
    average(accessibleSites.map((site) => site.roundTripEfficiency)),
    average(accessibleSites.map((site) => site.soh)),
    activeAlarms.filter((alarm) => alarm.priority === 'Critical').length,
    null,
  ];
  const criticalCount = values[4];
  const atRiskSites = accessibleSites.filter((site) => site.riskLevel === 'High').length;
  const leadRisk = topRisks[0];
  const leadRiskSite = leadRisk ? siteById.get(leadRisk.siteId) : null;

  return (
    <PageFrame
      title="Executive Dashboard"
      description="Fleet-wide performance, material risks and decision priorities across every site."
      actions={<span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />All sites · {accessibleSites.length}</span>}
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Fleet executive indicators">
        {kpiDefinitions.map(({ label, icon: Icon, format }, index) => (
          <div key={label} className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
            <Icon className="h-5 w-5 text-cyan-500" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {format(values[index])}
            </p>
            {(index === 0 || index === 4) && (
              <p className="mt-1 text-[10px] text-slate-500">
                {index === 0 ? 'Mean across accessible sites · target 99%' : 'Across all accessible sites'}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]" aria-label="Fleet risks and outlook">
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Priority risks and next actions</h2>
              <p className="mt-1 text-xs text-slate-500">Highest priority active alarms across the fleet.</p>
            </div>
            <Link to="/alarms" className="shrink-0 text-xs font-bold text-cyan-700 dark:text-cyan-300">View alarms <ArrowUpRight className="inline h-3.5 w-3.5" /></Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {topRisks.map((alarm, index) => {
              const site = siteById.get(alarm.siteId);
              return (
                <div key={alarm.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${alarm.priority === 'Critical' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{alarm.title}</p>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${alarm.priority === 'Critical' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>{alarm.priority}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">{alarm.description}</p>
                    {site && <Link to={`/site/${site.id}`} onClick={() => selectSite(site.id)} className="mt-1.5 inline-block text-[10px] font-semibold text-cyan-700 hover:underline dark:text-cyan-300">{site.name} · Review site</Link>}
                  </div>
                </div>
              );
            })}
            {topRisks.length === 0 && <div className="rounded-xl bg-emerald-500/[0.07] p-4 text-xs text-emerald-700 dark:text-emerald-300">No active priority alarms across the fleet.</div>}
          </div>
        </div>

        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Fleet outlook</h2>
          <p className="mt-1 text-xs text-slate-500">A concise readout of the current simulated fleet data.</p>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {criticalCount > 0
              ? `${criticalCount} critical ${criticalCount === 1 ? 'alarm is' : 'alarms are'} active across the fleet${leadRiskSite ? `, led by ${leadRisk?.title} at ${leadRiskSite.name}` : ''}.`
              : 'There are no active critical alarms across the fleet.'}
            {atRiskSites > 0 ? ` ${atRiskSites} ${atRiskSites === 1 ? 'site has' : 'sites have'} high operational risk and should remain on the leadership watchlist.` : ' No sites are currently rated high risk.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-300">Simulated insight</span>
            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700">{accessibleSites.length} sites in scope</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2" aria-label="Fleet performance trends">
        <ChartCard title="Fleet energy movement" subtitle="Daily energy charged and discharged across all sites" badgeText="MWh">
          <ResponsiveContainer width="100%" height={260}>
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
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mockFleetOverview.sohTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="executiveFleetSohFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.28} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
              <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis domain={[50, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value) => [`${value}%`, 'Average SoH']} />
              <Area type="monotone" dataKey="avgSoh" stroke="#06b6d4" strokeWidth={2.5} fill="url(#executiveFleetSohFill)" activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4 text-xs">
        <span className="text-slate-700 dark:text-slate-200">For equipment-level operating details, open a site from the fleet overview.</span>
        <Link to="/" className="inline-flex items-center gap-1 font-bold text-cyan-700 dark:text-cyan-300">Open fleet overview <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
    </PageFrame>
  );
}
