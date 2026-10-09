import React, { useEffect, useState } from 'react';
import { getFleetOverview, getSites } from '../services/api';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import SiteTable from '../components/SiteTable';
import AlarmList from '../components/AlarmList';
import SiteLocationMap from '../components/SiteLocationMap';
import { useTheme } from '../hooks/useTheme';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

// Tooltip style factory
function tooltipStyle(isDark) {
  return {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    borderRadius: '0.75rem',
    fontSize: '12px',
    color: isDark ? '#f8fafc' : '#0f172a',
  };
}

export default function Overview() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  const [fleetData, setFleetData] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFleetOverview(), getSites()]).then(([overview, siteList]) => {
      setFleetData(overview);
      setSites(siteList);
      setLoading(false);
    });
  }, []);

  if (loading || !fleetData) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading fleet telemetry…
      </div>
    );
  }

  const { kpis, sohTrend, sohBySite, energyLast7Days, fleetStatusCounts, recentAlarms } = fleetData;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fleet Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time state of health, energy throughput, and predictive analytics across all BESS sites.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          5 Sites Live
        </span>
      </div>

      {/* KPI Row — 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          type="totalSites"
          label={kpis.totalSites.label}
          value={kpis.totalSites.value}
          delta={kpis.totalSites.delta}
          deltaType={kpis.totalSites.deltaType}
        />
        <KpiCard
          type="installedCapacity"
          label={kpis.installedCapacity.label}
          value={`${kpis.installedCapacity.valueMW} MW`}
          delta={kpis.installedCapacity.delta}
          deltaType={kpis.installedCapacity.deltaType}
        />
        <KpiCard
          type="avgFleetSoh"
          label={kpis.avgFleetSoh.label}
          value={kpis.avgFleetSoh.value}
          suffix="%"
          delta={kpis.avgFleetSoh.delta}
          deltaType={kpis.avgFleetSoh.deltaType}
        />
        <KpiCard
          type="activeAlarms"
          label={kpis.activeAlarms.label}
          value={kpis.activeAlarms.value}
          delta={kpis.activeAlarms.delta}
          deltaType={kpis.activeAlarms.deltaType}
        />
        <KpiCard
          type="fleetAvailability"
          label={kpis.fleetAvailability.label}
          value={kpis.fleetAvailability.value}
          suffix="%"
          delta={kpis.fleetAvailability.delta}
          deltaType={kpis.fleetAvailability.deltaType}
        />
      </div>

      {/* Row 2: SoH Trend + Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet SoH Trend (12 months) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Fleet SoH Trend (12 Months)"
            subtitle="Average State of Health across all 5 sites"
            badgeText="Telemetry"
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={sohTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sohTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis
                  domain={[80, 100]}
                  ticks={[80, 84, 88, 92, 96, 100]}
                  stroke={axisColor}
                  fontSize={11}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={tooltipStyle(isDark)}
                  formatter={(val) => [`${val}%`, 'Avg Fleet SoH']}
                />
                <Area
                  type="monotone"
                  dataKey="avgSoh"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#sohTrendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Fleet Status Donut */}
        <ChartCard title="Fleet Operational Status" subtitle="Real-time site status breakdown">
          <div className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={fleetStatusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {fleetStatusCounts.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={entry.fill}
                      stroke={isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle(isDark)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {fleetStatusCounts.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 3: Energy 7-Day + SoH by Site */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy charged vs discharged last 7 days */}
        <ChartCard
          title="Energy Throughput — Last 7 Days"
          subtitle="Fleet-wide charged vs discharged (MWh)"
          badgeText="Energy"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={energyLast7Days}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barCategoryGap="30%"
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" stroke={axisColor} fontSize={11} tickLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} unit=" MWh" />
              <Tooltip
                contentStyle={tooltipStyle(isDark)}
                formatter={(val, name) => [`${val} MWh`, name === 'charged' ? 'Charged' : 'Discharged']}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(val) => (val === 'charged' ? 'Charged' : 'Discharged')}
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Bar dataKey="charged" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="discharged" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* SoH by Site */}
        <ChartCard
          title="SoH by Site"
          subtitle="Current State of Health per site (%)"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={sohBySite}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis
                type="number"
                domain={[60, 100]}
                ticks={[60, 70, 80, 90, 100]}
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="site"
                stroke={axisColor}
                fontSize={11}
                tickLine={false}
                width={72}
              />
              <Tooltip
                contentStyle={tooltipStyle(isDark)}
                formatter={(val) => [`${val}%`, 'SoH']}
              />
              <ReferenceLine x={70} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5} />
              <Bar dataKey="soh" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {sohBySite.map((entry, i) => (
                  <Cell key={`soh-${i}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 4: India Map + Recent Alarms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SiteLocationMap sites={sites} />
        </div>
        <div className="lg:col-span-2">
          <ChartCard
            title="Recent Fleet Alarms"
            subtitle="Prioritised alarm feed across all sites"
            badgeText="Live Feed"
          >
            <AlarmList alarms={recentAlarms} />
          </ChartCard>
        </div>
      </div>

      {/* Row 5: Sites Needing Attention */}
      <div className="surface-card p-6 rounded-2xl bg-white dark:bg-slate-900 border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Sites Needing Attention
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked by risk level and active alarms. Click any row to open the site dashboard.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {sites.length} Sites Monitored
          </span>
        </div>
        <SiteTable sites={sites} />
      </div>
    </div>
  );
}
