import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Battery, Gauge, Sparkles, Zap } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import ChartCard from '../components/ChartCard';
import { useDemoData } from '../hooks/useDemoData';
import { useTheme } from '../hooks/useTheme';

const prioritySeries = [
  { key: 'Critical', color: '#e11d48' },
  { key: 'Major', color: '#f97316' },
  { key: 'Warning', color: '#eab308' },
  { key: 'Minor', color: '#06b6d4' },
  { key: 'Info', color: '#94a3b8' },
];

function getMonthLabel(offset) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return date.toLocaleDateString(undefined, { month: 'short' });
}

function makePerformanceTrend(site) {
  return Array.from({ length: 6 }, (_, index) => {
    const progress = index / 5;
    const variation = Math.sin(index * 1.4) * 0.12 * (1 - progress);
    return {
      month: getMonthLabel(index - 5),
      availability: Number((site.availability + ((progress - 1) * 0.18) + variation).toFixed(1)),
      efficiency: Number((site.roundTripEfficiency + ((progress - 1) * 0.35) + variation * 0.7).toFixed(1)),
    };
  });
}

function makeBatteryOutlook(site) {
  const currentIndex = 6;
  const monthlyFade = site.rul > 0 ? Math.max(0.03, (site.soh - 80) / (site.rul * 12)) : 0.08;
  return Array.from({ length: 13 }, (_, index) => {
    const monthsFromNow = index - currentIndex;
    const value = site.soh - (monthsFromNow * monthlyFade);
    return {
      month: index === currentIndex ? 'Now' : getMonthLabel(monthsFromNow),
      observed: index <= currentIndex ? Number(value.toFixed(1)) : null,
      projection: index >= currentIndex ? Number(value.toFixed(1)) : null,
    };
  });
}

function makeEnergyProfile(site) {
  const factors = [0.88, 0.96, 1.04, 0.93, 1.08, 1.02, 1];
  return factors.map((factor, index) => {
    const discharged = site.energyTodayMWh * factor;
    return {
      day: index === factors.length - 1 ? 'Today' : `Day ${index + 1}`,
      discharged: Number(discharged.toFixed(1)),
      charged: Number((discharged / (site.roundTripEfficiency / 100)).toFixed(1)),
    };
  });
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

function MetricCard({ label, value, Icon, note }) {
  return (
    <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
      <Icon className="h-5 w-5 text-cyan-500" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{note}</p>
    </div>
  );
}

export default function Analytics() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { selectedSite, accessibleSites, accessibleAlarms } = useDemoData();

  const performanceTrend = useMemo(
    () => selectedSite ? makePerformanceTrend(selectedSite) : [],
    [selectedSite],
  );
  const batteryOutlook = useMemo(
    () => selectedSite ? makeBatteryOutlook(selectedSite) : [],
    [selectedSite],
  );
  const energyProfile = useMemo(
    () => selectedSite ? makeEnergyProfile(selectedSite) : [],
    [selectedSite],
  );
  const activeAlarms = useMemo(
    () => accessibleAlarms.filter((alarm) => alarm.state === 'Active'),
    [accessibleAlarms],
  );
  const alarmDistribution = useMemo(() => accessibleSites.map((site) => {
    const row = { site: site.name.replace(/ (Grid Storage|Desert BESS|Coastal BESS|Industrial BESS)$/i, '') };
    prioritySeries.forEach(({ key }) => { row[key] = 0; });
    activeAlarms.filter((alarm) => alarm.siteId === site.id).forEach((alarm) => {
      const priority = alarm.priority === 'Information' ? 'Info' : alarm.priority;
      if (Object.prototype.hasOwnProperty.call(row, priority)) row[priority] += 1;
    });
    return row;
  }), [accessibleSites, activeAlarms]);

  const benchmark = useMemo(() => [...accessibleSites]
    .sort((a, b) => b.healthIndex - a.healthIndex)
    .map((site) => ({
      site: site.name.replace(/ (Grid Storage|Desert BESS|Coastal BESS|Industrial BESS)$/i, ''),
      availability: site.availability,
      soh: site.soh,
      efficiency: site.roundTripEfficiency,
    })), [accessibleSites]);

  if (!selectedSite) {
    return <PageFrame title="Analytics & Asset Performance" description="Select a site to view performance and asset health analytics." />;
  }

  const activeSiteAlarms = activeAlarms.filter((alarm) => alarm.siteId === selectedSite.id).length;
  const causeGroups = useMemo(() => {
    const groups = new Map();
    activeAlarms.forEach((alarm) => {
      const title = alarm.title || 'Unclassified alarm';
      const cause = /temp|thermal|cool/i.test(title) ? 'Thermal management / cooling'
        : /voltage|imbalance|soc/i.test(title) ? 'Battery electrical balance'
          : /gateway|communication|packet/i.test(title) ? 'Site communications'
            : /fire|smoke|gas/i.test(title) ? 'Safety system condition'
              : 'Equipment condition / controls';
      const current = groups.get(cause) || { cause, count: 0, examples: [] };
      current.count += 1;
      if (current.examples.length < 2) current.examples.push(title);
      groups.set(cause, current);
    });
    return [...groups.values()].sort((a, b) => b.count - a.count);
  }, [activeAlarms]);
  const metrics = [
    { label: 'Availability', value: `${selectedSite.availability.toFixed(1)}%`, Icon: Activity, note: 'Current site value · target 99%' },
    { label: 'Round-trip efficiency', value: `${selectedSite.roundTripEfficiency.toFixed(1)}%`, Icon: Gauge, note: 'Current site value' },
    { label: 'Energy delivered today', value: `${selectedSite.energyTodayMWh.toFixed(1)} MWh`, Icon: Zap, note: 'Site meter reading' },
    { label: 'Battery state of health', value: `${selectedSite.soh.toFixed(1)}%`, Icon: Battery, note: `Estimated remaining life · ${selectedSite.rul.toFixed(1)} years` },
  ];

  return (
    <PageFrame
      title="Analytics & Asset Performance"
      description={`${selectedSite.name} performance, energy and battery health, with alarm patterns across the fleet.`}
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Selected site performance indicators">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2" aria-label="Selected site trends">
        <ChartCard title="Operating performance" subtitle="Six-month trend for the selected site; latest point matches site KPIs" badgeText="%">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={performanceTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
              <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis domain={[85, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value, name) => [`${value}%`, name === 'availability' ? 'Availability' : 'Round-trip efficiency']} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value === 'availability' ? 'Availability' : 'Round-trip efficiency'} />
              <ReferenceLine y={99} stroke="#f59e0b" strokeDasharray="5 4" label={{ value: '99% availability target', fill: '#b45309', fontSize: 9 }} />
              <Line type="monotone" dataKey="availability" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Battery health outlook" subtitle={`${selectedSite.name} · six-month history and six-month illustrative projection`} badgeText="SoH %">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={batteryOutlook} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
              <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis domain={[70, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value) => [`${value}%`, 'State of health']} />
              <ReferenceLine y={80} stroke="#f97316" strokeDasharray="5 4" label={{ value: 'Review threshold', fill: '#c2410c', fontSize: 9 }} />
              <ReferenceLine x="Now" stroke={isDark ? '#64748b' : '#94a3b8'} strokeDasharray="3 4" />
              <Line type="monotone" dataKey="observed" name="History" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} connectNulls={false} />
              <Line type="monotone" dataKey="projection" name="Illustrative projection" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2" aria-label="Site benchmarking and fleet alarm distribution">
        <ChartCard title="Site performance benchmark" subtitle="Compare current availability, state of health and efficiency across accessible sites" badgeText="%">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={benchmark} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
              <XAxis dataKey="site" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
              <YAxis domain={[0, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value, name) => [`${value}%`, name === 'soh' ? 'State of health' : name === 'efficiency' ? 'Round-trip efficiency' : 'Availability']} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value === 'soh' ? 'State of health' : value === 'efficiency' ? 'Round-trip efficiency' : 'Availability'} />
              <Bar dataKey="availability" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="soh" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="efficiency" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active alarm distribution" subtitle={`Priority by site · ${activeAlarms.length} active alarms across ${accessibleSites.length} accessible sites`} badgeText="Fleet-wide">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={alarmDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
              <XAxis dataKey="site" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
              <YAxis allowDecimals={false} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(isDark)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {prioritySeries.map(({ key, color }) => <Bar key={key} dataKey={key} stackId="alarms" fill={color} />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <ChartCard title="Energy throughput" subtitle={`Illustrative charged and discharged energy for ${selectedSite.name}; today's value anchors the site demo reading`} badgeText="MWh">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={energyProfile} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
            <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value, name) => [`${value} MWh`, name === 'charged' ? 'Charged' : 'Discharged']} />
            <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value === 'charged' ? 'Charged' : 'Discharged'} />
            <Bar dataKey="charged" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="discharged" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="AI-generated operational insights">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI-generated operational insights</h2>
            <p className="mt-1 text-[10px] text-slate-500">Illustrative insights based on synthetic demo data · verify against site records before acting.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Performance</p><p className="mt-2 text-xs text-slate-700 dark:text-slate-200">{selectedSite.availability < 99 ? 'Availability is below the 99% reference target; review active alarms and recent outages.' : 'Availability is tracking above the 99% reference target.'}</p></div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Battery outlook</p><p className="mt-2 text-xs text-slate-700 dark:text-slate-200">Illustrative SOH projection indicates {selectedSite.soh < 90 ? 'degradation warrants a capacity and maintenance review.' : 'no immediate capacity threshold crossing in the demo outlook.'}</p></div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Operations</p><p className="mt-2 text-xs text-slate-700 dark:text-slate-200">{activeSiteAlarms ? `${activeSiteAlarms} active alarm${activeSiteAlarms === 1 ? '' : 's'} may affect performance; investigate alarm history for likely causes.` : 'No active alarms at this site in the demo data.'}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]" aria-label="Fleet reliability and root cause analytics">
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><div className="mb-4"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Fleet reliability and utilization</h2><p className="mt-1 text-[10px] text-slate-500">Current site indicators · utilization is estimated from instantaneous power / installed capacity.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-xs"><thead><tr className="border-b border-slate-200 text-left text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800"><th className="pb-3">Site</th><th className="pb-3">Availability</th><th className="pb-3">Utilization</th><th className="pb-3">SOH</th><th className="pb-3">Active alarms</th></tr></thead><tbody>{accessibleSites.map((site) => <tr key={site.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 font-semibold">{site.name.replace(/ (Grid Storage|Desert BESS|Coastal BESS|Industrial BESS)$/i, '')}</td><td className="py-3">{site.availability.toFixed(1)}%</td><td className="py-3">{(Math.abs(site.powerMW) / Math.max(site.capacityMW, 1) * 100).toFixed(0)}%</td><td className="py-3">{site.soh.toFixed(1)}%</td><td className="py-3">{activeAlarms.filter((alarm) => alarm.siteId === site.id).length}</td></tr>)}</tbody></table></div></div>
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Alarm patterns and likely causes</h2><p className="mt-1 text-[10px] text-slate-500">Rule-based grouping of simulated alarm titles; treat as investigation prompts, not confirmed root cause.</p><div className="mt-4 space-y-3">{causeGroups.map((group) => <div key={group.cause} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold">{group.cause}</h3><span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">{group.count} active</span></div><p className="mt-1 text-[10px] text-slate-500">Examples: {group.examples.join(' · ')}</p></div>)}{causeGroups.length === 0 && <p className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">No active alarm patterns to review.</p>}</div></div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4 text-xs">
        <span className="text-slate-700 dark:text-slate-200">Performance, health history, projections, and energy profiles provide a unified operational view.</span>
        <span className="text-slate-500">{activeSiteAlarms} active alarms at {selectedSite.name}</span>
      </div>
    </PageFrame>
  );
}
