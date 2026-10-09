import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSite, getSiteAlarms, getSites } from '../services/api';
import ChartCard from '../components/ChartCard';
import SohRing from '../components/SohRing';
import MetricBar from '../components/MetricBar';
import RulChart from '../components/RulChart';
import CellHeatmap from '../components/CellHeatmap';
import AnomalyList from '../components/AnomalyList';
import AlarmList from '../components/AlarmList';
import { StatusBadge } from '../components/StatusBadge';
import { useTheme } from '../hooks/useTheme';
import { getAlarmPriorityStyle, formatPowerMW } from '../utils/formatters';
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
  MapPin, Wifi, WifiOff, RefreshCw, ChevronDown,
  Zap, Thermometer, Activity, Battery, Shield,
  Wrench, Clock, User, AlertTriangle,
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

// ─── Equipment Grid ───────────────────────────────────────────────────────────
function EquipmentCard({ icon: Icon, label, status, lines = [], warn = false }) {
  const good = ['active', 'running', 'normal', 'closed', 'online'].includes(status?.toLowerCase());
  const isFault = status?.toLowerCase() === 'fault';
  const tone = isFault
    ? 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300'
    : warn
      ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300'
      : good
        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300'
        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600';
  const dot = isFault ? 'bg-rose-500' : warn ? 'bg-amber-500' : good ? 'bg-emerald-500' : 'bg-slate-400';

  return (
    <div className="flex min-h-[142px] flex-col gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 transition-colors hover:border-cyan-500/30 hover:bg-white dark:hover:bg-slate-800/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300">
            <Icon className="w-4 h-4 shrink-0" />
          </span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        </div>
      </div>
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${tone}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {status}
      </span>
      <div className="space-y-1">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-1.5 text-[11px] dark:border-slate-700/70">
            <span className="text-slate-500 dark:text-slate-400">{l.label}</span>
            <span className="text-right font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">{l.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Work Order priority chip ─────────────────────────────────────────────────
function WoPriority({ priority }) {
  const s = getAlarmPriorityStyle(priority);
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${s.badge}`}>
      {priority}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SiteDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  const [site, setSite] = useState(null);
  const [allSites, setAllSites] = useState([]);
  const [siteAlarms, setSiteAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSite(id), getSites(), getSiteAlarms(id)]).then(([s, list, alarms]) => {
      setSite(s);
      setAllSites(list);
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
  const powerAbs = Math.abs(site.powerMW);
  const isCharging = site.status === 'Charging';
  const isDischarging = site.status === 'Discharging';

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

      {/* ── Site Header Strip ───────────────────────────────────────────── */}
      <div className="surface-card flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {site.id}
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{site.name}</h1>
            <StatusBadge status={site.status} />
            {/* Comms indicator */}
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded border ${
              site.commsStatus === 'Online'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}>
              {site.commsStatus === 'Online'
                ? <Wifi className="w-3 h-3" />
                : <WifiOff className="w-3 h-3" />}
              {site.commsStatus}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{site.location}</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{formatPowerMW(site.powerMW)}</span>
            <span className="flex items-center gap-1"><Battery className="w-3 h-3" />SoC {site.soc}%</span>
            <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />Updated {site.lastUpdated}</span>
          </div>
        </div>

        {/* Site Switcher */}
        <div className="relative shrink-0">
          <button
            onClick={() => setSwitcherOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            id="site-switcher-btn"
          >
            Switch Site <ChevronDown className="w-4 h-4" />
          </button>
          {switcherOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-50">
              {allSites.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { navigate(`/site/${s.id}`); setSwitcherOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-xl last:rounded-b-xl ${s.id === site.id ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                >
                  <span>{s.name}</span>
                  <span className="text-xs font-mono text-slate-400">{s.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 1: Battery Health + KPI Strip ─────────────────────────── */}
      <div className="surface-card grid grid-cols-1 items-center gap-6 rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:grid-cols-[240px_minmax(0,1fr)] lg:p-6">
        <div className="flex flex-col items-center">
          <div className="self-start">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Battery Health</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{site.id} — LFP Chemistry</p>
          </div>
          <SohRing soh={site.soh} />
          </div>
        <div className="grid grid-cols-1 gap-5 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:py-2 lg:pl-7">
          <MetricBar
            label="State of Charge"
            valueText={`${site.soc}%`}
            percentage={site.soc}
            color="cyan"
            minText="0%"
            maxText="100%"
          />
          <MetricBar
            label="Avg Cell Temp"
            valueText={`${site.temperature} °C`}
            percentage={((site.temperature - 20) / 30) * 100}
            color={site.temperature > 35 ? 'rose' : site.temperature > 30 ? 'amber' : 'emerald'}
            minText="20°C"
            maxText="50°C"
          />
          <MetricBar
            label="DC Bus Voltage"
            valueText={`${site.dcVoltage} V`}
            percentage={((site.dcVoltage - 1200) / 100) * 100}
            color="blue"
            minText="1200 V"
            maxText="1300 V"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Round-Trip Efficiency', value: `${site.roundTripEfficiency}%`, sub: 'Measured RTE', icon: Activity },
          { label: 'Energy Today', value: `${site.energyTodayMWh} MWh`, sub: 'Charged + Discharged', icon: Zap },
          { label: 'Availability', value: `${site.availability}%`, sub: '30-day rolling', icon: Shield },
          { label: 'Cycles (Total)', value: site.cycles.toLocaleString(), sub: 'Full charge cycles', icon: RefreshCw },
          { label: 'Health Index', value: `${site.healthIndex}`, sub: 'Composite score / 100', icon: Activity },
          { label: 'RUL Estimate', value: `${site.rul} yrs`, sub: 'To EOL (SoH 70%)', icon: Clock },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="surface-card group flex min-h-[132px] flex-col gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900 hover:-translate-y-0.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
            </div>
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

      {/* ── Row 3: RUL + Cell Heatmap ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Remaining Useful Life (RUL) Forecast"
          subtitle="ML model projection with 95% confidence interval to EOL (SoH 70%)"
          badgeText="Predictive"
        >
          <div style={{ minHeight: 360 }}>
            <RulChart series={site.rulSeries} rulYears={site.rul} />
          </div>
        </ChartCard>

        <div className="surface-card p-6 rounded-2xl bg-white dark:bg-slate-900 border">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Cell Health Heatmap</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Container → Rack → Module → Cell. Colour by current telemetry value.
            </p>
          </div>
          <CellHeatmap containers={site.pack.containers} />
        </div>
      </div>

      {/* ── Row 4: Anomaly Predictions ────────────────────────────────── */}
      <div className="surface-card p-6 rounded-2xl bg-white dark:bg-slate-900 border space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Predictive Anomaly Alerts</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ML model–flagged issues with predicted time-to-fault and recommended actions.
          </p>
        </div>
        <AnomalyList anomalies={site.predictedAnomalies} />
      </div>

      {/* ── Row 5: Battery Performance (RTE actual vs predicted) ─────── */}
      <ChartCard
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
      </ChartCard>

      {/* ── Row 6: Equipment & Safety ─────────────────────────────────── */}
      <div className="surface-card p-6 rounded-2xl bg-white dark:bg-slate-900 border space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Equipment & Safety</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            PCS, transformer, switchgear, HVAC, fire suppression, UPS, energy meter, environment.
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
            lines={[
              { label: 'Last Test', value: eq.fireSuppression.lastTestDate },
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
            ]}
          />
        </div>
      </div>

      {/* ── Row 7: Site Alarms ────────────────────────────────────────── */}
      <ChartCard
        title="Site Alarms"
        subtitle={`Active and recent alarms for ${site.id}`}
        badgeText="Live"
      >
        {siteAlarms.length > 0 ? (
          <AlarmList alarms={siteAlarms} />
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
            No active alarms for this site.
          </p>
        )}
      </ChartCard>

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
            {site.workOrders.length} Work Orders
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
              {site.workOrders.map((wo) => (
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

    </div>
  );
}
