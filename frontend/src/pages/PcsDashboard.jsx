import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, AlertTriangle, ArrowUpRight, Gauge, Zap } from 'lucide-react';
import { getSite } from '../services/api';
import ChartCard from '../components/ChartCard';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { useTheme } from '../hooks/useTheme';

export default function PcsDashboard() {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [pcsIndex, setPcsIndex] = useState(1);
  const { accessibleAlarms } = useDemoData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tooltipStyle = { backgroundColor: isDark ? '#0e1a2b' : '#fff', border: `1px solid ${isDark ? '#26364b' : '#e2e8f0'}`, borderRadius: 12, color: isDark ? '#e2e8f0' : '#172033', fontSize: 11 };

  useEffect(() => {
    let active = true;
    getSite(id).then((value) => { if (active) setSite(value); });
    return () => { active = false; };
  }, [id]);

  const powerProfile = useMemo(() => site?.equipment.pcs.powerProfile.map((point) => ({
    ...point,
    power: Number((point.power / 2).toFixed(2)),
    efficiency: Number((site.equipment.pcs.efficiency - Math.min(1.2, Math.abs(point.power) * 0.025)).toFixed(1)),
  })) || [], [site]);

  if (!site) return <div className="p-8 text-sm text-slate-500">Loading PCS telemetry…</div>;
  const pcs = site.equipment.pcs;
  const unitPower = Number((pcs.actualPowerMW / 2).toFixed(2));
  const unitReactivePower = Number((pcs.reactivePowerMVAr / 2).toFixed(2));
  const unitAcCurrent = Math.round(pcs.acCurrentA / 2);
  const unitDcCurrent = Math.round(pcs.dcCurrentA / 2);
  const activeAlarms = accessibleAlarms.filter((alarm) => alarm.siteId === site.id && alarm.state !== 'Cleared' && /pcs|inverter|power conversion/i.test(`${alarm.assetId} ${alarm.title} ${alarm.description}`));
  const metrics = [
    ['Active power', `${unitPower} MW`, Zap],
    ['Reactive power', `${unitReactivePower} MVAr`, Activity],
    ['Conversion efficiency', `${pcs.efficiency}%`, Gauge],
    ['Grid frequency', `${pcs.frequency} Hz`, Activity],
    ['AC line current', `${unitAcCurrent.toLocaleString()} A`, Zap],
    ['DC current', `${unitDcCurrent.toLocaleString()} A`, Zap],
    ['AC line voltage', `${pcs.acVoltage} V`, Activity],
    ['DC bus voltage', `${pcs.dcVoltage} V`, Activity],
  ];

  return (
    <PageFrame title="PCS" description={`${site.name} · Power conversion telemetry, operating limits and alarm context.`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Power conversion unit<select value={pcsIndex} onChange={(event) => setPcsIndex(Number(event.target.value))} className="mt-1 block min-w-56 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><option value={1}>PCS-01</option><option value={2}>PCS-02</option></select></label>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${['Fault', 'Offline'].includes(pcs.status) ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : pcs.status === 'Warning' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>{pcs.status}</span>
        <Link to="/assets" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">Open asset record <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        <p className="w-full text-[10px] text-slate-500">Values are per PCS unit, split evenly from the site total for this frontend demo. Verify the deployed PCS topology and telemetry mapping.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="PCS telemetry metrics">
        {metrics.map(([label, value, Icon]) => <article key={label} className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900"><Icon className="h-4 w-4 text-cyan-500" /><p className="mt-3 text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p></article>)}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title={`PCS-0${pcsIndex} power and efficiency`} subtitle="Hourly site power apportioned equally to the selected demo PCS; efficiency curve is illustrative." badgeText="24 hours">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={powerProfile} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs><linearGradient id="pcsPowerFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2e8f0'} />
              <XAxis dataKey="hour" interval={3} fontSize={10} stroke={isDark ? '#94a3b8' : '#64748b'} />
              <YAxis yAxisId="power" fontSize={10} unit=" MW" stroke={isDark ? '#94a3b8' : '#64748b'} />
              <YAxis yAxisId="efficiency" orientation="right" domain={[90, 100]} fontSize={10} unit="%" stroke={isDark ? '#94a3b8' : '#64748b'} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value}${name === 'power' ? ' MW' : '%'}`, name === 'power' ? 'Active power' : 'Efficiency']} />
              <Area yAxisId="power" type="monotone" dataKey="power" stroke="#06b6d4" fill="url(#pcsPowerFill)" name="power" />
              <Line yAxisId="efficiency" type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} dot={false} name="efficiency" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
          <h2 className="text-sm font-bold">Operating state and dispatch</h2>
          <dl className="mt-3 divide-y divide-slate-100 text-xs dark:divide-slate-800">
            {[
              ['Operating mode', pcs.mode], ['State', pcs.status], ['Setpoint power', `${(pcs.setpointMW / 2).toFixed(2)} MW`], ['Actual power', `${unitPower} MW`], ['Setpoint error', `${(unitPower - pcs.setpointMW / 2).toFixed(2)} MW`], ['Derating', pcs.derating], ['Output direction', site.powerMW > 0 ? 'Charging' : site.powerMW < 0 ? 'Discharging' : 'Idle'],
            ].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 py-2.5"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-800 dark:text-slate-200">{value}</dd></div>)}
          </dl>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-[10px] leading-4 text-slate-500 dark:bg-slate-800/60">Setpoint, actual power and derating are demo values. Grid operator setpoints and OEM limits are not connected.</p>
        </section>
      </div>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><h2 className="text-sm font-bold">PCS faults and alarms</h2></div>
        {activeAlarms.length ? <div className="mt-3 space-y-2">{activeAlarms.map((alarm) => <article key={alarm.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-3 text-xs"><span className="font-semibold">{alarm.title || alarm.description}</span><span className="text-slate-500">{alarm.id} · {alarm.priority || alarm.severity}</span></article>)}</div> : <p className="mt-3 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">No active PCS-specific alarms in the demo alarm feed.</p>}
      </section>
    </PageFrame>
  );
}
