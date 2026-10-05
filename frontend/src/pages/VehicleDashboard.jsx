import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVehicle, getVehicles } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/StatusBadge';
import SohRing from '../components/SohRing';
import MetricBar from '../components/MetricBar';
import RulChart from '../components/RulChart';
import CellHeatmap from '../components/CellHeatmap';
import AnomalyList from '../components/AnomalyList';
import ChartCard from '../components/ChartCard';
import { useTheme } from '../hooks/useTheme';
import {
  formatVoltage,
  formatTemperature,
  formatCurrent,
  formatNumber,
} from '../utils/formatters';
import {
  Zap,
  Clock,
  ChevronDown,
  RotateCcw,
  ZapOff,
  Flame,
  Activity,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function VehicleDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [vehicle, setVehicle] = useState(null);
  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const vehicleId = id || 'EV-4587';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const vehicleData = await getVehicle(vehicleId);
      const vehicleList = await getVehicles();
      setVehicle(vehicleData);
      setAllVehicles(vehicleList);
      setLoading(false);
    }
    fetchData();
  }, [vehicleId]);

  if (loading || !vehicle) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading Vehicle Telemetry Digital Twin...
      </div>
    );
  }

  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Top Vehicle Header Strip */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Vehicle Identity */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-black text-sm shadow-md shadow-cyan-500/20">
            EV
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {vehicle.id}
              </h1>
              <StatusBadge status={vehicle.status} />
              <RiskBadge risk={vehicle.riskLevel} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {vehicle.model} • Telemetry refreshed {vehicle.lastUpdated}
            </p>
          </div>
        </div>

        {/* Charging & Telemetry Strip + Switcher */}
        <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-3 lg:pt-0 lg:pl-6">
          {/* SoC & Charge state */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                  {vehicle.soc}% SoC
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {vehicle.chargingTimeRemaining || `${vehicle.status} mode active`}
              </span>
            </div>
          </div>

          {/* Vehicle Switcher Dropdown */}
          <div className="relative ml-auto lg:ml-0">
            <select
              value={vehicle.id}
              onChange={(e) => navigate(`/vehicle/${e.target.value}`)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white hover:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
            >
              {allVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} - {v.model} ({v.soh}% SoH)
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Summary Stats Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Cycle Count</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatNumber(vehicle.cycleCount)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Energy Throughput</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {vehicle.totalEnergyThroughputMWh || 142.8} MWh
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Avg Operating Temp</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatTemperature(vehicle.avgOperatingTemp || vehicle.temperature)}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Health Index Score</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {vehicle.healthIndexScore || 91} / 100
            </p>
          </div>
        </div>
      </div>

      {/* Main Top Grid: Battery Health Gauge & RUL Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battery Health Card */}
        <ChartCard
          title="Battery Health Overview"
          subtitle="Pack state of health & live electrical parameters"
        >
          <div className="flex flex-col gap-6">
            <SohRing soh={vehicle.soh} />

            <div className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <MetricBar
                label="State of Charge (SoC)"
                valueText={`${vehicle.soc}%`}
                percentage={vehicle.soc}
                color="cyan"
                minText="0%"
                maxText="100%"
              />
              <MetricBar
                label="Pack Temperature"
                valueText={formatTemperature(vehicle.temperature)}
                percentage={((vehicle.temperature - 15) / 35) * 100}
                color={vehicle.temperature > 40 ? 'rose' : vehicle.temperature > 33 ? 'amber' : 'emerald'}
                minText="15°C"
                maxText="50°C"
              />
              <MetricBar
                label="Pack Voltage"
                valueText={formatVoltage(vehicle.voltage)}
                percentage={((vehicle.voltage - 350) / 70) * 100}
                color="blue"
                minText="350V"
                maxText="420V"
              />
              <MetricBar
                label="Current Draw / Charge"
                valueText={formatCurrent(vehicle.current)}
                percentage={50 + (vehicle.current / 200) * 50}
                color="cyan"
                minText="-150A"
                maxText="+150A"
              />
            </div>
          </div>
        </ChartCard>

        {/* Predicted Remaining Useful Life */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Predicted Remaining Useful Life (RUL)"
            subtitle="Physics-informed machine learning degradation projection"
            badgeText="ML Forecast"
          >
            <RulChart series={vehicle.rulSeries} rulYears={vehicle.rul} />
          </ChartCard>
        </div>
      </div>

      {/* 96-Cell Pack Heatmap Grid (2D Matrix) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              2D Cell Telemetry Matrix (8 Modules × 12 Cells = 96 Cells)
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Live Digital Twin
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time voltage, thermal, and internal resistance (IR) monitoring per individual battery cell.
          </p>
        </div>

        <CellHeatmap modules={vehicle.pack.modules} />
      </div>

      {/* Bottom Grid: Predicted Anomalies & Battery Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predicted Anomalies List */}
        <ChartCard
          title="Predicted Cell Anomalies"
          subtitle="Proactive maintenance alerts & early warning system"
          badgeText="ML Model"
        >
          <AnomalyList anomalies={vehicle.predictedAnomalies} />
        </ChartCard>

        {/* Battery Performance: Actual vs Predicted */}
        <div className="lg:col-span-2">
          <ChartCard
            title="6-Month Energy Performance (Actual vs Predicted)"
            subtitle="Monthly throughput tracking against model expectation"
            badgeText="Model Estimate"
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={vehicle.performanceSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis stroke={textColor} fontSize={11} tickLine={false} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                  formatter={(val) => [`${val} kWh`, 'Energy']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="actualEnergy"
                  name="Actual Energy Delivered"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="predictedEnergy"
                  name="Predicted Baseline"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#06b6d4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
