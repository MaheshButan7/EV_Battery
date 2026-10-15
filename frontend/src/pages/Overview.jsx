import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BatteryCharging, CheckCircle2, Map, ShieldAlert } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getFleetOverview } from '../services/api';
import { useDemoData } from '../hooks/useDemoData';
import { useTheme } from '../hooks/useTheme';
import KpiCard from '../components/KpiCard';
import AlarmList from '../components/AlarmList';
import ChartCard from '../components/ChartCard';
import SimulatedDataBadge from '../components/ui/SimulatedDataBadge';
import Button from '../components/ui/Button';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';

function tooltipStyle(isDark) {
  return {
    backgroundColor: isDark ? '#0e1a2b' : '#ffffff',
    borderColor: isDark ? '#26364b' : '#dfe7f1',
    borderRadius: '0.75rem',
    fontSize: '11px',
    color: isDark ? '#f8fafc' : '#172033',
  };
}

export default function Overview() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { alarms, acknowledgeAlarm, createWorkOrderFromAlarm, selectedSite } = useDemoData();
  const [overview, setOverview] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFleetOverview()
      .then((overviewData) => {
        setOverview(overviewData);
        setSites(selectedSite ? [selectedSite] : []);
      })
      .finally(() => setLoading(false));
  }, [selectedSite]);

  const activeAlarms = useMemo(() => alarms.filter((alarm) => alarm.state === 'Active'), [alarms]);
  const criticalAlarms = activeAlarms.filter((alarm) => alarm.priority === 'Critical');
  const priorityAlarms = activeAlarms.filter((alarm) => ['Critical', 'Major'].includes(alarm.priority)).slice(0, 4);
  const reportingSites = selectedSite?.commsStatus === 'Online' ? 1 : 0;

  if (loading || !overview) {
    return <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">Loading site operations data…</div>;
  }

  const { kpis, energyLast7Days } = overview;
  const scopedKpis = selectedSite ? {
    ...kpis,
    installedCapacity: { ...kpis.installedCapacity, valueMW: selectedSite.capacityMW, valueMWh: selectedSite.capacityMWh },
    avgFleetSoh: { ...kpis.avgFleetSoh, value: selectedSite.soh },
    fleetAvailability: { ...kpis.fleetAvailability, value: selectedSite.availability },
  } : kpis;
  const siteRows = selectedSite ? [selectedSite] : [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 md:flex-row md:items-end dark:border-slate-800/80">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">OPERATIONS CONTROL VIEW</p>
          <h1 className="text-[1.65rem] font-bold tracking-[-0.025em] text-slate-950 dark:text-white">Site Operations Overview</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-500 dark:text-slate-400">
            A single operational view of site availability, power, battery condition, safety and alarm response.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SimulatedDataBadge />
          <Button as={Link} to="/map" variant="secondary" size="sm" icon={Map}>Open site map</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Site performance indicators">
        <KpiCard type="totalSites" label="Site reporting status" value={`${reportingSites} / 1`} delta={reportingSites ? 'Communications online' : 'Communications attention required'} deltaType={reportingSites ? 'positive' : 'warning'} />
        <KpiCard type="installedCapacity" label="Installed capacity" value={`${scopedKpis.installedCapacity.valueMW} MW`} delta={`${scopedKpis.installedCapacity.valueMWh} MWh energy capacity`} deltaType="neutral" />
        <KpiCard type="avgFleetSoh" label="Site SoH" value={scopedKpis.avgFleetSoh.value} suffix="%" delta={scopedKpis.avgFleetSoh.delta} deltaType="negative" />
        <KpiCard type="activeAlarms" label="Active alarms" value={activeAlarms.length} delta={`${criticalAlarms.length} Critical`} deltaType={criticalAlarms.length ? 'negative' : 'positive'} />
        <KpiCard type="fleetAvailability" label="Site availability" value={scopedKpis.fleetAvailability.value} suffix="%" delta={scopedKpis.fleetAvailability.delta} deltaType="negative" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]" aria-label="Priority operations">
        <div className="surface-card rounded-2xl border p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div><h2 className="text-base font-bold text-slate-950 dark:text-white">Priority site status</h2><p className="mt-1 text-xs text-slate-500">Sites ranked by risk and current operating condition.</p></div>
            <Link to="/asset-health" className="hidden items-center gap-1 text-xs font-bold text-cyan-700 sm:inline-flex dark:text-cyan-300">Asset health <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[660px] text-xs">
              <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800"><th className="pb-3">Site</th><th className="pb-3">Operating state</th><th className="pb-3">SoC / SoH</th><th className="pb-3">Availability</th><th className="pb-3">Alarms</th><th className="pb-3">Risk</th></tr></thead>
              <tbody>{siteRows.map((site) => <tr key={site.id} className="border-b border-slate-100 dark:border-slate-800/80"><td className="py-3"><Link to={`/site/${site.id}`} className="font-bold text-cyan-700 hover:text-cyan-900 dark:text-cyan-300">{site.name}</Link><span className="mt-0.5 block font-mono text-[10px] text-slate-400">{site.id}</span></td><td className="py-3"><StatusBadge status={site.status} /><span className="ml-2 text-[10px] text-slate-400">{site.commsStatus}</span></td><td className="py-3 tabular-nums text-slate-700 dark:text-slate-300">{site.soc}% / {site.soh}%</td><td className="py-3 tabular-nums text-slate-700 dark:text-slate-300">{site.availability}%</td><td className="py-3">{site.activeAlarms > 0 ? <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400"><AlertTriangle className="h-3 w-3" />{site.activeAlarms}</span> : <span className="text-slate-400">—</span>}</td><td className="py-3"><RiskBadge risk={site.riskLevel} /></td></tr>)}</tbody>
            </table>
          </div>
        </div>

        <ChartCard title="Energy movement" subtitle="Charged and discharged energy over the last 7 days" badgeText="MWh">
          <ResponsiveContainer width="100%" height={245}>
            <BarChart data={energyLast7Days} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
              <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle(isDark)} formatter={(value, name) => [`${value} MWh`, name === 'charged' ? 'Charged' : 'Discharged']} />
              <Bar dataKey="charged" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="discharged" fill="#06b6d4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]" aria-label="Alarm response">
        <ChartCard title="Priority alarm queue" subtitle="Critical and major alarms requiring operator review" badgeText={`${priorityAlarms.length} priority`}>
          {priorityAlarms.length > 0 ? <AlarmList alarms={priorityAlarms} onAcknowledge={acknowledgeAlarm} onCreateWorkOrder={createWorkOrderFromAlarm} /> : <div className="flex min-h-[160px] flex-col items-center justify-center text-center"><CheckCircle2 className="h-8 w-8 text-emerald-500" /><p className="mt-3 text-sm font-bold">No priority alarms</p><p className="mt-1 text-xs text-slate-500">All critical and major alarms are cleared or acknowledged.</p></div>}
        </ChartCard>
        <div className="surface-card rounded-2xl border p-5">
          <div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-500" /><h2 className="text-base font-bold text-slate-950 dark:text-white">Operator actions</h2></div>
          <div className="mt-5 space-y-3">
            <Link to="/alarms" className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-800 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/30"><span>Review all alarms and events</span><ArrowRight className="h-4 w-4 text-cyan-500" /></Link>
            <Link to="/maintenance" className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-800 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/30"><span>Open maintenance work orders</span><ArrowRight className="h-4 w-4 text-cyan-500" /></Link>
            <Link to="/maintenance/permits" className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-800 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/30"><span>Review safety permits</span><ArrowRight className="h-4 w-4 text-cyan-500" /></Link>
            <Link to="/reports" className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-800 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/30"><span>Generate operations report</span><ArrowRight className="h-4 w-4 text-cyan-500" /></Link>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60"><BatteryCharging className="h-4 w-4 text-cyan-500" /> Detailed cell, PCS, trend, map and predictive-maintenance analysis is available from the dedicated site and insight pages.</div>
    </div>
  );
}
