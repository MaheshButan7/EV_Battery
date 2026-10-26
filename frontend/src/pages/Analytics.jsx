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
import { Activity, Battery, Gauge, BrainCircuit, Zap } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import ChartCard from '../components/ChartCard';
import { useDemoData } from '../hooks/useDemoData';
import { useTheme } from '../hooks/useTheme';

const prioritySeries = [
  { key: 'Critical', color: '#e11d48' },
  { key: 'Major', color: '#f97316' },
  { key: 'Warning', color: '#eab308' },
  { key: 'Minor', color: 'var(--app-accent)' },
  { key: 'Info', color: '#94a3b8' },
];
const MINUTE = 60 * 1000;

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

function makeSocTrend(site) {
  const now = new Date();
  return Array.from({ length: 13 }, (_, index) => {
    const progress = index / 12;
    const hoursAgo = (12 - index) * 2;
    const time = new Date(now.getTime() - hoursAgo * 60 * MINUTE).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const variation = index === 12 ? 0 : Math.sin(progress * Math.PI * 3) * 4 + (1 - progress) * 2;
    return { time, soc: Number(Math.max(0, Math.min(100, site.soc - variation)).toFixed(1)) };
  });
}

function makeAlarmTrend(alarms) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * 24 * 60 * MINUTE);
    return { date, key: date.toLocaleDateString(), day: date.toLocaleDateString([], { weekday: 'short', day: 'numeric' }), raised: 0, acknowledged: 0 };
  });
  alarms.forEach((alarm) => {
    const raised = new Date(alarm.timestamp);
    const raisedDay = days.find((day) => day.key === raised.toLocaleDateString());
    if (raisedDay) raisedDay.raised += 1;
    if (alarm.acknowledgedAt) {
      const acknowledgedDay = days.find((day) => day.key === new Date(alarm.acknowledgedAt).toLocaleDateString());
      if (acknowledgedDay) acknowledgedDay.acknowledged += 1;
    }
  });
  return days;
}

function isOverdue(workOrder) {
  if (!workOrder.dueDate || workOrder.status === 'Done') return false;
  const due = new Date(`${workOrder.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function tooltipStyle() {
  return {
    backgroundColor: 'var(--app-tooltip-bg)',
    borderColor: 'var(--app-tooltip-border)',
    borderRadius: '0.75rem',
    fontSize: '11px',
    color: 'var(--app-tooltip-text)',
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
  const { selectedSite, accessibleSites, accessibleAlarms, workOrders } = useDemoData();

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
  const socTrend = useMemo(() => selectedSite ? makeSocTrend(selectedSite) : [], [selectedSite]);
  const alarmTrend = useMemo(() => makeAlarmTrend(accessibleAlarms), [accessibleAlarms]);
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

  if (!selectedSite) {
    return <PageFrame title="Analytics & Asset Performance" description="Select a site to view performance and asset health analytics." />;
  }

  const activeSiteAlarms = activeAlarms.filter((alarm) => alarm.siteId === selectedSite.id).length;
  const completedWorkOrders = workOrders.filter((item) => item.status === 'Done').length;
  const overdueWorkOrders = workOrders.filter(isOverdue).length;
  const totalLaborHours = workOrders.reduce((sum, item) => sum + (Number(item.laborHours) || 0), 0);
  const workOrdersByStatus = ['New', 'Scheduled', 'Assigned', 'In progress', 'Waiting parts', 'Waiting approval', 'Done']
    .map((status) => ({ status, count: workOrders.filter((item) => item.status === status).length }))
    .filter((item) => item.count > 0);
  const metrics = [
    { label: 'Availability', value: `${selectedSite.availability.toFixed(1)}%`, Icon: Activity, note: 'Current site value · target 99%' },
    { label: 'Round-trip efficiency', value: `${selectedSite.roundTripEfficiency.toFixed(1)}%`, Icon: Gauge, note: 'Current site value' },
    { label: 'Energy delivered today', value: `${selectedSite.energyTodayMWh.toFixed(1)} MWh`, Icon: Zap, note: 'Site meter reading' },
    { label: 'Battery state of health', value: `${selectedSite.soh.toFixed(1)}%`, Icon: Battery, note: `Estimated remaining life · ${selectedSite.rul.toFixed(1)} years` },
    { label: 'State of charge', value: `${selectedSite.soc.toFixed(1)}%`, Icon: Battery, note: 'Current site reading' },
  ];

  return (
    <PageFrame
      title="Analytics & Asset Performance"
      description={`${selectedSite.name} performance, energy and battery health, with alarm patterns across the fleet.`}
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Selected site performance indicators">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3" aria-label="Selected site trends">
        <ChartCard title="Operating performance" subtitle="Illustrative six-month sample anchored to current KPIs" badgeText="%">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={performanceTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis domain={[85, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value, name) => [`${value}%`, name === 'availability' ? 'Availability' : 'Round-trip efficiency']} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value === 'availability' ? 'Availability' : 'Round-trip efficiency'} />
              <ReferenceLine y={99} stroke="#f59e0b" strokeDasharray="5 4" label={{ value: '99% availability target', fill: '#b45309', fontSize: 9 }} />
              <Line type="monotone" dataKey="availability" stroke="var(--app-accent)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Battery health outlook" subtitle={`${selectedSite.name} · six-month history and six-month illustrative projection`} badgeText="SoH %">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={batteryOutlook} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis domain={[70, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}%`, 'State of health']} />
              <ReferenceLine y={80} stroke="#f97316" strokeDasharray="5 4" label={{ value: 'Review threshold', fill: '#c2410c', fontSize: 9 }} />
              <ReferenceLine x="Now" stroke={isDark ? '#64748b' : '#94a3b8'} strokeDasharray="3 4" />
              <Line type="monotone" dataKey="observed" name="History" stroke="var(--app-accent)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} connectNulls={false} />
              <Line type="monotone" dataKey="projection" name="Illustrative projection" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="State of charge" subtitle="Illustrative 24-hour profile · latest point matches current site SOC" badgeText="SOC %">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={socTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis dataKey="time" interval="preserveStartEnd" minTickGap={24} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
              <YAxis domain={[0, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}%`, 'State of charge']} />
              <Line type="monotone" dataKey="soc" name="State of charge" stroke="var(--app-accent)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2" aria-label="Site benchmarking and fleet alarm distribution">
        <ChartCard title="Site performance benchmark" subtitle="Compare current availability, state of health and efficiency across accessible sites" badgeText="%">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={benchmark} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis dataKey="site" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
              <YAxis domain={[0, 100]} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} formatter={(value, name) => [`${value}%`, name === 'soh' ? 'State of health' : name === 'efficiency' ? 'Round-trip efficiency' : 'Availability']} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value === 'soh' ? 'State of health' : value === 'efficiency' ? 'Round-trip efficiency' : 'Availability'} />
              <Bar dataKey="availability" fill="var(--app-accent)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="soh" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="efficiency" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active alarm distribution" subtitle={`Priority by site · ${activeAlarms.length} active alarms across ${accessibleSites.length} accessible sites`} badgeText="Fleet-wide">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={alarmDistribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis dataKey="site" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
              <YAxis allowDecimals={false} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {prioritySeries.map(({ key, color }) => <Bar key={key} dataKey={key} stackId="alarms" fill={color} />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <ChartCard title="Energy throughput" subtitle={`Illustrative charged and discharged energy for ${selectedSite.name}; today's value anchors the site demo reading`} badgeText="MWh">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={energyProfile} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
            <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle()} formatter={(value, name) => [`${value} MWh`, name === 'charged' ? 'Charged' : 'Discharged']} />
            <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => value === 'charged' ? 'Charged' : 'Discharged'} />
            <Bar dataKey="charged" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="discharged" fill="var(--app-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2" aria-label="Alarm and maintenance analytics">
        <ChartCard title="Alarm activity trend" subtitle={`Alarm records raised and acknowledged · last seven days · ${accessibleAlarms.length} fleet records`} badgeText="Events">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={alarmTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
              <YAxis allowDecimals={false} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="raised" name="Raised" stroke="var(--app-accent)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="acknowledged" name="Acknowledged" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Maintenance workload" subtitle={`${selectedSite.name} · work orders by current status`} badgeText="Work orders">
          <div className="mb-2 flex flex-wrap gap-2 text-[10px]">
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 font-semibold text-cyan-800 dark:text-cyan-200">{workOrders.length - completedWorkOrders} open</span>
            <span className="rounded-full bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-700 dark:text-rose-300">{overdueWorkOrders} overdue</span>
            <span className="rounded-full bg-slate-500/10 px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-300">{totalLaborHours.toFixed(1)} labor hours logged</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={workOrdersByStatus} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? 'var(--app-tooltip-border)' : 'var(--app-chart-grid)'} />
              <XAxis type="number" allowDecimals={false} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} />
              <YAxis type="category" dataKey="status" width={104} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Bar dataKey="count" name="Work orders" fill="var(--app-accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Operational insight examples">
        <div className="flex items-start gap-3">
          <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-300" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Operational insight examples</h2>
            <p className="mt-1 text-[10px] text-slate-500">Rule-based examples using illustrative demo data. No trained AI/ML model is connected.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
