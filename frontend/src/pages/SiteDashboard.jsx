import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSite, getSiteAlarms } from '../services/api';
import ChartCard from '../components/ChartCard';
import SohRing from '../components/SohRing';
import MetricBar from '../components/MetricBar';
import SimulatedDataBadge from '../components/ui/SimulatedDataBadge';
import { useDemoData } from '../hooks/useDemoData';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../hooks/useTheme';
import { formatPowerMW } from '../utils/formatters';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  MapPin, Wifi, WifiOff, RefreshCw,
  Zap, Thermometer, Activity, Battery, Shield,
  ArrowUpRight,
} from 'lucide-react';

function tooltipStyle(isDark) {
  return {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    borderRadius: '0.75rem',
    fontSize: '12px',
    color: isDark ? '#f8fafc' : '#0f172a',
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SiteDashboard() {
  const { id } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const { alarms } = useDemoData();

  const [site, setSite] = useState(null);
  const [siteAlarms, setSiteAlarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSite(id), getSiteAlarms(id)]).then(([s, alarms]) => {
      setSite(s);
      setSiteAlarms(alarms);
      setLoading(false);
    });
  }, [id]);

  if (loading || !site) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading site data…
      </div>
    );
  }

  const eq = site.equipment;
  const visibleSiteAlarms = alarms.filter((alarm) => alarm.siteId === site.id);
  const powerAbs = Math.abs(site.powerMW);
  const isCharging = site.status === 'Charging';
  const isDischarging = site.status === 'Discharging';
  const activeAlarms = visibleSiteAlarms.filter((alarm) => alarm.state === 'Active');
  const priorityAlarms = activeAlarms.filter((alarm) => ['Critical', 'Major'].includes(alarm.priority));
  const equipmentItems = [
    { label: 'PCS', status: eq.pcs.status },
    { label: 'Transformer', status: eq.transformer.status },
    { label: 'Switchgear', status: eq.switchgear.status },
    { label: 'Fire protection', status: eq.fireSuppression.status },
    { label: 'UPS', status: eq.ups.status },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-8">

      {/* ── Site identity and control actions ───────────────────────────── */}
      <section className="surface-card overflow-hidden rounded-2xl border">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-200/80 p-5 dark:border-slate-800/80 lg:flex-row lg:items-start lg:p-6">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">SITE OPERATIONS</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{site.name}</h1>
              <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
              {site.id}
              </span>
              <StatusBadge status={site.status} />
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${
                site.commsStatus === 'Online'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}>
                {site.commsStatus === 'Online' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                Telemetry {site.commsStatus}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Live operating condition, dispatch telemetry and site-level response priorities.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-cyan-600" />{site.location}</span>
              <span className="inline-flex items-center gap-1.5"><Battery className="h-3.5 w-3.5 text-cyan-600" />{site.capacityMW} MW / {site.capacityMWh} MWh</span>
              <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5 text-cyan-600" />Updated {site.lastUpdated}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <SimulatedDataBadge />
          <Link
            to={`/site/${site.id}/sld`}
            className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-500/20 dark:text-cyan-300"
          >
            Open SLD
          </Link>
          <Link
            to={`/site/${site.id}/battery`}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Battery health
          </Link>
          <Link
            to={`/site/${site.id}/pcs`}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Power conversion
          </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200/80 border-t border-slate-200/80 dark:divide-slate-800/80 dark:border-slate-800/80 sm:grid-cols-4 xl:grid-cols-8 xl:divide-y-0">
          {[
            { label: 'Current power', value: formatPowerMW(site.powerMW), note: isCharging ? 'Charging' : isDischarging ? 'Discharging' : 'Idle', tone: site.status === 'Fault' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-950 dark:text-white' },
            { label: 'State of charge', value: `${site.soc}%`, note: 'SOC', tone: 'text-slate-950 dark:text-white' },
            { label: 'State of health', value: `${site.soh}%`, note: `${site.rul} yrs estimated RUL`, tone: site.soh < 90 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-950 dark:text-white' },
            { label: 'State of energy', value: `${site.soeMWh} MWh`, note: `of ${site.capacityMWh} MWh`, tone: 'text-slate-950 dark:text-white' },
            { label: 'Max cell temperature', value: `${site.maxCellTemperature} °C`, note: 'Across all cells', tone: site.maxCellTemperature > 45 ? 'text-rose-600 dark:text-rose-300' : 'text-slate-950 dark:text-white' },
            { label: 'Voltage imbalance', value: `${site.voltageImbalance} V`, note: 'Cell spread', tone: site.voltageImbalance > 0.1 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-950 dark:text-white' },
            { label: 'Availability', value: `${site.availability}%`, note: '30-day rolling', tone: 'text-slate-950 dark:text-white' },
            { label: 'Round-trip efficiency', value: `${site.roundTripEfficiency}%`, note: 'Measured RTE', tone: 'text-slate-950 dark:text-white' },
          ].map((metric) => (
            <div key={metric.label} className="min-w-0 px-4 py-4 first:pl-5 last:pr-5 lg:px-5">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{metric.label}</p>
              <p className={`mt-1.5 truncate text-xl font-bold tracking-tight tabular-nums ${metric.tone}`}>{metric.value}</p>
              <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{metric.note}</p>
            </div>
          ))}
        </div>
      </section>

      {site.commsStatus !== 'Online' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Communication link unavailable</p>
            <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-200/80">
              Last telemetry received {site.lastUpdated}. Local gateway buffering is active; values remain marked as last known state until the link recovers.
            </p>
          </div>
        </div>
      )}

      {/* ── Battery and operating telemetry ───────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface-card grid grid-cols-1 items-center gap-6 rounded-2xl border p-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:p-6">
          <div className="flex flex-col items-center">
            <div className="self-start">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">Battery condition</p>
              <h2 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">LFP storage system</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{site.id} · live site telemetry</p>
            </div>
            <SohRing soh={site.soh} />
          </div>
          <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:py-2 lg:pl-7">
            <MetricBar label="State of charge" valueText={`${site.soc}%`} percentage={site.soc} color="cyan" minText="0%" maxText="100%" />
            <MetricBar label="Average cell temperature" valueText={`${site.temperature} °C`} percentage={((site.temperature - 20) / 30) * 100} color={site.temperature > 35 ? 'rose' : site.temperature > 30 ? 'amber' : 'emerald'} minText="20°C" maxText="50°C" />
            <MetricBar label="DC bus voltage" valueText={`${site.dcVoltage} V`} percentage={((site.dcVoltage - 1200) / 100) * 100} color="blue" minText="1200 V" maxText="1300 V" />
          </div>
        </section>

        <section className="surface-card rounded-2xl border p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">Control room</p>
              <h2 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Readiness status</h2>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${site.status === 'Fault' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
              {site.status === 'Fault' ? 'Action required' : 'Operational'}
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {equipmentItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs last:border-0 last:pb-0 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                  <span className={`h-1.5 w-1.5 rounded-full ${['Active', 'Running', 'Normal', 'Closed', 'Online'].includes(item.status) ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <Link to="/assets" className="mt-4 inline-flex text-xs font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300">View asset registry →</Link>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {[
          { label: 'Round-trip efficiency', value: `${site.roundTripEfficiency}%`, sub: 'Measured RTE', icon: Activity },
          { label: 'Energy moved today', value: `${site.energyTodayMWh} MWh`, sub: 'Charged + discharged', icon: Zap },
          { label: 'Availability', value: `${site.availability}%`, sub: '30-day rolling', icon: Shield },
          { label: 'Total cycles', value: site.cycles.toLocaleString(), sub: 'Equivalent full cycles', icon: RefreshCw },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="surface-card group flex min-h-[118px] flex-col gap-3 rounded-2xl border p-4 hover:-translate-y-0.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
            </div>

            <section className="surface-card rounded-2xl border p-5 lg:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">Battery hierarchy</p>
                  <h2 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Container operating summary</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Container-level SOC, maximum temperature and voltage spread for operator triage.</p>
                </div>
                <Link to={`/site/${site.id}/battery`} className="text-xs font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300">Inspect cells →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-xs">
                  <thead className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                    <tr>
                      <th className="pb-3 pr-4">Container</th>
                      <th className="pb-3 pr-4">Racks</th>
                      <th className="pb-3 pr-4">SOC</th>
                      <th className="pb-3 pr-4">Max temperature</th>
                      <th className="pb-3">Voltage spread</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {site.pack.containerSummary.map((container) => (
                      <tr key={container.id}>
                        <td className="py-3 pr-4 font-semibold text-slate-800 dark:text-slate-200">{container.name}</td>
                        <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{container.rackCount}</td>
                        <td className="py-3 pr-4 font-semibold tabular-nums text-slate-800 dark:text-slate-200">{container.soc}%</td>
                        <td className={`py-3 pr-4 font-semibold tabular-nums ${container.maxTemperature > 45 ? 'text-rose-600 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>{container.maxTemperature} °C</td>
                        <td className={`py-3 font-semibold tabular-nums ${container.voltageSpread > 0.1 ? 'text-amber-600 dark:text-amber-300' : 'text-slate-800 dark:text-slate-200'}`}>{container.voltageSpread} V</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <span className="text-2xl font-bold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">
              {value}
            </span>
            <span className="mt-auto text-[11px] text-slate-500 dark:text-slate-400">{sub}</span>
          </div>
        ))}
      </div>

      {/* ── Row 2: 24h Power/SoC Profile ──────────────────────────────── */}
      <ChartCard
        title="24-Hour Power & SoC Profile"
        subtitle="Hourly average AC power; charging is positive and discharging is negative. SoC is integrated using site capacity and efficiency."
        badgeText="24h model"
      >
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={site.powerProfile} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="chargingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="dischargingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="hour" stroke={axisColor} fontSize={10} tickLine={false} interval={2} />
            <YAxis yAxisId="power" stroke={axisColor} fontSize={11} tickLine={false} unit=" MW" domain={[-35, 35]} ticks={[-30, -20, -10, 0, 10, 20, 30]} />
            <YAxis yAxisId="soc" orientation="right" stroke={axisColor} fontSize={11} tickLine={false} unit="%" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
            <Tooltip
              contentStyle={tooltipStyle(isDark)}
              formatter={(val, name) => {
                if (name === 'power') {
                  const direction = val > 0 ? 'Charging' : val < 0 ? 'Discharging' : 'Idle';
                  return [`${val > 0 ? '+' : ''}${val} MW`, direction];
                }
                return [`${val}%`, 'State of Charge'];
              }}
            />
            <ReferenceLine yAxisId="power" y={0} stroke={axisColor} strokeWidth={1.2} />
            <Legend
              content={() => (
                <div className="flex items-center justify-center gap-5 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Charging</span>
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" />Discharging</span>
                  <span className="inline-flex items-center gap-2"><span className="h-0.5 w-3 bg-amber-500" />SoC</span>
                </div>
              )}
            />
            <Bar
              yAxisId="power"
              dataKey="power"
              name="power"
              radius={[3, 3, 0, 0]}
            >
              {site.powerProfile.map((point) => (
                <Cell
                  key={point.hour}
                  fill={point.power < 0 ? 'url(#dischargingGrad)' : 'url(#chargingGrad)'}
                />
              ))}
            </Bar>
            <Line
              yAxisId="soc"
              dataKey="soc"
              name="soc"
              type="monotone"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Detailed predictive analysis is available from Asset Health. */}

      <section className="surface-card rounded-2xl border p-5 lg:p-6">
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">Dedicated operational views</p>
          <h2 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Continue investigation</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Detailed equipment, safety, alarm, predictive and maintenance workflows are available on their dedicated pages.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Power conversion', detail: 'PCS values, efficiency and faults.', path: `/site/${site.id}/pcs` },
            { title: 'Safety & hazards', detail: 'Thermal, fire and environmental risks.', path: '/hazards' },
            { title: 'Alarm management', detail: 'Acknowledge and action site alarms.', path: '/alarms' },
            { title: 'Asset health', detail: 'RUL, anomalies and recommendations.', path: '/asset-health' },
            { title: 'Maintenance & CMMS', detail: 'Work orders, permits and execution.', path: '/maintenance' },
            { title: 'Historical trends', detail: 'Long-term site telemetry analysis.', path: '/history' },
          ].map((view) => (
            <Link key={view.title} to={view.path} className="group rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/5 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-cyan-400/5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{view.title}</span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-cyan-500" />
              </div>
              <p className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{view.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Historical performance analysis is available from Performance Analytics. */}
      {false && <ChartCard
        title="Battery Performance — RTE Actual vs Predicted"
        subtitle="Round-trip efficiency over last 6 months. Deviation from prediction indicates accelerated degradation."
      >
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={site.performanceSeries} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="month" stroke={axisColor} fontSize={11} tickLine={false} />
            <YAxis
              domain={[90, 96]}
              ticks={[90, 91, 92, 93, 94, 95, 96]}
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              contentStyle={tooltipStyle(isDark)}
              formatter={(val, name) => [`${val}%`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
            <Bar dataKey="actualRTE" name="Actual RTE" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Line
              dataKey="predictedRTE"
              name="Predicted RTE"
              type="monotone"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#06b6d4' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>}

      {/* ── Row 6: Equipment & Safety ─────────────────────────────────── */}
      {false && <div className="surface-card p-6 rounded-2xl bg-white dark:bg-slate-900 border space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Equipment & Safety</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            PCS, transformer, switchgear, protection, HVAC, fire, environment, gateway and auxiliary systems.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <EquipmentCard
            icon={Zap}
            label={eq.pcs.label}
            status={eq.pcs.status}
            lines={[
              { label: 'Active Power', value: `${eq.pcs.activePowerMW} MW` },
              { label: 'AC Voltage', value: `${eq.pcs.acVoltage} V` },
              { label: 'Efficiency', value: `${eq.pcs.efficiency}%` },
              { label: 'Mode', value: eq.pcs.mode },
            ]}
          />
          <EquipmentCard
            icon={Activity}
            label={eq.transformer.label}
            status={eq.transformer.status}
            lines={[
              { label: 'Oil Temp', value: `${eq.transformer.oilTemp} °C` },
              { label: 'Load', value: `${eq.transformer.loadPercent}%` },
            ]}
          />
          <EquipmentCard
            icon={Shield}
            label={eq.switchgear.label}
            status={eq.switchgear.status}
            lines={[
              { label: 'Breaker', value: eq.switchgear.breakerClosed ? 'Closed' : 'Open' },
            ]}
          />
          {eq.hvac.map((h) => (
            <EquipmentCard
              key={h.id}
              icon={Thermometer}
              label={h.label}
              status={h.status}
              warn={h.actualC > h.setpointC + 1.5}
              lines={[
                { label: 'Setpoint', value: `${h.setpointC} °C` },
                { label: 'Actual', value: `${h.actualC} °C` },
              ]}
            />
          ))}
          <EquipmentCard
            icon={AlertTriangle}
            label={eq.fireSuppression.label}
            status={eq.fireSuppression.status}
            warn={eq.fireSuppression.status === 'Trouble'}
            lines={[
              { label: 'Last Test', value: eq.fireSuppression.lastTestDate },
              { label: 'Smoke Detection', value: eq.environment.smokeDetector },
              { label: 'Gas Detection', value: eq.environment.gasDetector },
            ]}
          />
          <EquipmentCard
            icon={Battery}
            label={eq.ups.label}
            status={eq.ups.status}
            lines={[
              { label: 'Battery Level', value: `${eq.ups.batteryLevel}%` },
            ]}
          />
          <EquipmentCard
            icon={Activity}
            label={eq.energyMeter.label}
            status={eq.energyMeter.status}
            lines={[
              { label: 'Charged Today', value: `${eq.energyMeter.todayChargedMWh} MWh` },
              { label: 'Discharged Today', value: `${eq.energyMeter.todayDischargedMWh} MWh` },
            ]}
          />
          <EquipmentCard
            icon={MapPin}
            label={eq.environment.label}
            status={`${eq.environment.ambientTempC} °C`}
            lines={[
              { label: 'Humidity', value: `${eq.environment.humidity}%` },
              { label: 'Door', value: eq.environment.doorStatus },
              { label: 'Flood Sensor', value: eq.environment.floodSensor },
              { label: 'Security Sensors', value: eq.environment.securitySensors },
            ]}
          />
          <EquipmentCard
            icon={Wifi}
            label="Edge Gateway"
            status={site.commsStatus === 'Online' ? 'Online' : 'Buffered'}
            lines={[
              { label: 'Last telemetry', value: site.lastUpdated },
              { label: 'Data state', value: site.commsStatus === 'Online' ? 'Synchronized' : 'Buffering locally' },
            ]}
          />
        </div>
      </div>}

      {false && <>
      {/* ── Row 7: Site Alarms ────────────────────────────────────────── */}
      <ChartCard
        title="Site Alarms"
        subtitle={`Active and recent alarms for ${site.id}`}
        badgeText="Live"
      >
        {visibleSiteAlarms.length > 0 ? (
          <AlarmList
            alarms={visibleSiteAlarms}
            onAcknowledge={acknowledgeAlarm}
            onCreateWorkOrder={createWorkOrderFromAlarm}
          />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
            No active alarms for this site.
          </p>
        )}
      </ChartCard>

      {events.filter((event) => event.siteId === site.id).length > 0 && (
        <div className="surface-card rounded-2xl border bg-white p-6 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Operator Events</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Actions recorded during this demo session.</p>
          </div>
          <div className="space-y-2">
            {events.filter((event) => event.siteId === site.id).slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-200">{event.type}</span>
                <span className="font-mono text-slate-400 dark:text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 8: Maintenance / Work Orders ─────────────────────────── */}
      <div className="surface-card p-6 rounded-2xl bg-white dark:bg-slate-900 border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Maintenance — Work Orders</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Open and upcoming work orders for this site.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {visibleWorkOrders.length} Work Orders
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {['WO ID', 'Type', 'Description', 'Priority', 'Due Date', 'Assignee'].map((col) => (
                  <th key={col} className="text-left font-semibold text-slate-500 dark:text-slate-400 pb-2 pr-4 last:pr-0">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleWorkOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-700 dark:text-slate-200">{wo.id}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{wo.type}</td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 max-w-xs">{wo.description}</td>
                  <td className="py-3 pr-4"><WoPriority priority={wo.priority} /></td>
                  <td className="py-3 pr-4 font-mono text-slate-600 dark:text-slate-300">{wo.dueDate}</td>
                  <td className="py-3 flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <User className="w-3 h-3 text-slate-400" />{wo.assignee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>}

    </div>
  );
}
