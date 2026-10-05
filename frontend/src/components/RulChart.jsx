import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useTheme } from '../hooks/useTheme';

export default function RulChart({ series = [], rulYears = 4.2 }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  // Format dataset to create confidence area band: [lowerBound, upperBound]
  const chartData = series.map((item) => ({
    ...item,
    confidenceBand:
      item.lowerBound !== null && item.upperBound !== null
        ? [item.lowerBound, item.upperBound]
        : null,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* RUL Header Summary Stat */}
      <div className="flex items-center justify-between gap-4 mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {rulYears} Years
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Model estimate
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Estimated End of Life: EOL threshold 70% (2028 Q4)
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            +0.3 yrs vs baseline
          </span>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Confidence Interval ±5%</p>
        </div>
      </div>

      {/* Recharts Visualization */}
      <div className="flex-1 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

            <XAxis
              dataKey="year"
              stroke={textColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />

            <YAxis
              domain={[40, 100]}
              ticks={[40, 50, 60, 70, 80, 90, 100]}
              stroke={textColor}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              unit="%"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: isDark ? '#f8fafc' : '#0f172a',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value, name) => {
                if (Array.isArray(value)) {
                  return [`${value[0]}% - ${value[1]}%`, 'Confidence Bounds'];
                }
                return [`${value}%`, name];
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />

            {/* Horizontal Dashed 70% EOL Threshold Line */}
            <ReferenceLine
              y={70}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: 'EOL threshold 70%',
                fill: '#f43f5e',
                fontSize: 10,
                fontWeight: 700,
                position: 'insideTopRight',
                dy: -10,
              }}
            />

            {/* Confidence Band Area */}
            <Area
              type="monotone"
              dataKey="confidenceBand"
              name="95% Confidence Interval"
              stroke="none"
              fill="url(#confidenceBandGrad)"
              connectNulls
            />

            {/* Actual SoH Line */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual SoH"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10b981' }}
              connectNulls
            />

            {/* Predicted SoH Line */}
            <Line
              type="monotone"
              dataKey="predicted"
              name="Predicted SoH (ML model)"
              stroke="#06b6d4"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#06b6d4' }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
