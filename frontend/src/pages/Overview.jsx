import React, { useEffect, useState } from 'react';
import { getFleetOverview, getVehicles } from '../services/api';
import KpiCard from '../components/KpiCard';
import ChartCard from '../components/ChartCard';
import VehicleTable from '../components/VehicleTable';
import AlertList from '../components/AlertList';
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
} from 'recharts';

export default function Overview() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [fleetData, setFleetData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const overview = await getFleetOverview();
      const list = await getVehicles();
      setFleetData(overview);
      setVehicles(list);
      setLoading(false);
    }
    fetchData();
  }, []);

  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  if (loading || !fleetData) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading Fleet Telemetry...
      </div>
    );
  }

  const { kpis, sohTrend, sohDistribution, fleetStatusCounts, recentAlerts } = fleetData;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fleet Digital Twin & Predictive Health
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time battery state of health, anomaly forecasts, and fleet lifecycle management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            24 Active Telemetry Streams
          </span>
        </div>
      </div>

      {/* KPI Cards Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          type="totalVehicles"
          label={kpis.totalVehicles.label}
          value={kpis.totalVehicles.value}
          delta={kpis.totalVehicles.delta}
          deltaType={kpis.totalVehicles.deltaType}
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
          type="activeAlerts"
          label={kpis.activeAlerts.label}
          value={kpis.activeAlerts.value}
          delta={kpis.activeAlerts.delta}
          deltaType={kpis.activeAlerts.deltaType}
        />
        <KpiCard
          type="vehiclesCharging"
          label={kpis.vehiclesCharging.label}
          value={kpis.vehiclesCharging.value}
          delta={kpis.vehiclesCharging.delta}
          deltaType={kpis.vehiclesCharging.deltaType}
        />
        <KpiCard
          type="projectedReplacements"
          label={kpis.projectedReplacements.label}
          value={kpis.projectedReplacements.value}
          delta={kpis.projectedReplacements.delta}
          deltaType={kpis.projectedReplacements.deltaType}
        />
      </div>

      {/* Visual Analytics Row: SoH Trend & Distribution & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet SoH Trend (12 Months) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Fleet SoH Trend (12 Months)"
            subtitle="Historical average State of Health trajectory across all 24 vehicles"
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
                <XAxis dataKey="month" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis domain={[80, 100]} ticks={[80, 85, 90, 95, 100]} stroke={textColor} fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
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

        {/* Fleet Status Donut Chart */}
        <ChartCard
          title="Fleet Operational Status"
          subtitle="Real-time vehicle operational breakdown"
        >
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
                  {fleetStatusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={isDark ? '#0f172a' : '#ffffff'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-3 w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {fleetStatusCounts.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Middle Row: SoH Distribution & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SoH Distribution Bar Chart */}
        <ChartCard
          title="SoH Distribution Buckets"
          subtitle="Vehicle count per health band"
        >
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={sohDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="range" stroke={textColor} fontSize={10} tickLine={false} />
              <YAxis stroke={textColor} fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: isDark ? '#f8fafc' : '#0f172a',
                }}
                formatter={(val) => [`${val} Vehicles`, 'Count']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {sohDistribution.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Alerts Feed */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Recent Fleet Alerts"
            subtitle="Prioritized anomaly & diagnostic alerts"
            badgeText="Live Feed"
          >
            <AlertList alerts={recentAlerts} />
          </ChartCard>
        </div>
      </div>

      {/* Vehicles Needing Attention Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Vehicles Needing Attention
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked by battery risk assessment score. Click any row to inspect full cell-level Digital Twin.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {vehicles.length} Vehicles Monitored
          </span>
        </div>

        <VehicleTable vehicles={vehicles} />
      </div>
    </div>
  );
}
