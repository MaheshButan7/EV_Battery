import React, { useState } from 'react';
import { Flame, Zap, Activity, AlertTriangle } from 'lucide-react';
import { formatVoltage, formatTemperature, formatResistance } from '../utils/formatters';

export default function CellHeatmap({ modules = [] }) {
  const [metric, setMetric] = useState('temperature'); // 'temperature' | 'voltage' | 'internalResistance'
  const [hoveredCell, setHoveredCell] = useState(null);

  // Single threshold evaluation function for current cell telemetry
  const getCellStatus = (cell, currentMetric) => {
    if (currentMetric === 'temperature') {
      const t = cell.temperature;
      if (t >= 40.0) return 'warning';
      if (t >= 34.0) return 'elevated';
      return 'normal';
    }

    if (currentMetric === 'voltage') {
      const v = cell.voltage;
      if (v < 3.55) return 'warning';
      if (v < 3.65) return 'elevated';
      return 'normal';
    }

    if (currentMetric === 'internalResistance') {
      const ir = cell.internalResistance;
      if (ir >= 3.0) return 'warning';
      if (ir >= 2.4) return 'elevated';
      return 'normal';
    }

    return 'normal';
  };

  // Exactly three colors derived strictly from current telemetry value
  const getCellColor = (cell) => {
    const status = getCellStatus(cell, metric);
    if (status === 'warning') return 'bg-rose-500 text-white';
    if (status === 'elevated') return 'bg-amber-500 text-slate-950 font-semibold';
    return 'bg-emerald-500 text-white';
  };

  const getMetricDisplay = (cell) => {
    if (metric === 'temperature') return `${cell.temperature}°`;
    if (metric === 'voltage') return `${cell.voltage}V`;
    if (metric === 'internalResistance') return `${cell.internalResistance}`;
    return cell.id;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls: Metric Toggle & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => setMetric('temperature')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              metric === 'temperature'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Temperature
          </button>
          <button
            onClick={() => setMetric('voltage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              metric === 'voltage'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-500" />
            Voltage
          </button>
          <button
            onClick={() => setMetric('internalResistance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              metric === 'internalResistance'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Resistance (IR)
          </button>
        </div>

        {/* 3-State Legend */}
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
            <span>Elevated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
            <span>Warning</span>
          </div>
        </div>
      </div>

      {/* Hovered Cell Detail Strip */}
      <div className="min-h-[52px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        {hoveredCell ? (
          <div className="flex flex-col gap-1 w-full">
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Module {hoveredCell.moduleIndex} - Cell #{hoveredCell.cellNumber}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-slate-700 dark:text-slate-300">
                <span>Voltage: <strong className="text-cyan-600 dark:text-cyan-400">{formatVoltage(hoveredCell.voltage)}</strong></span>
                <span>Temp: <strong className="text-amber-600 dark:text-amber-400">{formatTemperature(hoveredCell.temperature)}</strong></span>
                <span>IR: <strong className="text-emerald-600 dark:text-emerald-400">{formatResistance(hoveredCell.internalResistance)}</strong></span>
              </div>
            </div>

            {/* Predicted Issue tooltip line */}
            {hoveredCell.anomaly ? (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>
                  Predicted issue in {hoveredCell.anomaly.daysRemaining} days: {hoveredCell.anomaly.issue}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 italic">
            Hover over any cell in the 96-cell pack matrix to inspect real-time telemetry values.
          </span>
        )}
      </div>

      {/* 8 Modules Grid (96 cells total) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {modules.map((module) => (
          <div
            key={module.id}
            className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {module.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                12 Cells
              </span>
            </div>

            {/* 12 Cells per Module (3x4 grid) */}
            <div className="grid grid-cols-4 gap-1.5">
              {module.cells.map((cell) => (
                <button
                  key={cell.id}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  type="button"
                  className={`relative h-9 rounded-lg font-mono text-[10px] font-bold flex flex-col items-center justify-center transition-transform hover:scale-105 ${getCellColor(
                    cell
                  )}`}
                  title={`Cell ${cell.cellNumber} | V: ${cell.voltage}V | T: ${cell.temperature}°C | IR: ${cell.internalResistance}mΩ${
                    cell.anomaly ? ` | Predicted issue in ${cell.anomaly.daysRemaining} days: ${cell.anomaly.issue}` : ''
                  }`}
                >
                  {/* Marker ring/dot for cells with a predicted anomaly */}
                  {cell.isAnomalous && (
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75 dark:bg-white" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900 dark:bg-white ring-1 ring-slate-950" />
                    </span>
                  )}
                  <span>C{cell.cellInModule}</span>
                  <span className="opacity-90 font-normal">{getMetricDisplay(cell)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
