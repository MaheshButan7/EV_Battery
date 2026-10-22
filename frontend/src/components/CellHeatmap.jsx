import React, { useState } from 'react';
import { Flame, Zap, Activity, AlertTriangle } from 'lucide-react';
import { formatVoltage, formatTemperature, formatResistance } from '../utils/formatters';
import { useDemoData } from '../hooks/useDemoData';

export default function CellHeatmap({ containers = [], siteId }) {
  const [selectedContainer, setSelectedContainer] = useState(0);
  const [selectedRack, setSelectedRack] = useState(0);
  const [metric, setMetric] = useState('temperature');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const { createManualWorkOrder } = useDemoData();

  const container = containers[selectedContainer];
  const rack = container?.racks[selectedRack];

  // LFP chemistry thresholds for 3 states
  const getCellStatus = (cell, m) => {
    if (m === 'temperature') {
      if (cell.temperature >= 32.0) return 'warning';
      if (cell.temperature >= 29.0) return 'elevated';
      return 'normal';
    }
    if (m === 'voltage') {
      if (cell.voltage < 3.21) return 'warning';
      if (cell.voltage < 3.25) return 'elevated';
      return 'normal';
    }
    if (m === 'internalResistance') {
      if (cell.internalResistance >= 0.29) return 'warning';
      if (cell.internalResistance >= 0.26) return 'elevated';
      return 'normal';
    }
    if (m === 'balance') return cell.balancingStatus === 'Review' ? 'warning' : 'normal';
    if (m === 'health') return cell.isAnomalous ? 'warning' : cell.voltage < 3.22 ? 'elevated' : 'normal';
    return 'normal';
  };

  const getCellColor = (cell) => {
    const status = getCellStatus(cell, metric);
    if (status === 'warning') return 'bg-rose-500 text-white';
    if (status === 'elevated') return 'bg-amber-500 text-slate-950 font-semibold';
    return 'bg-emerald-500 text-white';
  };

  const getMetricDisplay = (cell) => {
    if (metric === 'temperature') return `${cell.temperature.toFixed(1)}°`;
    if (metric === 'voltage') return `${cell.voltage.toFixed(3)}`;
    if (metric === 'internalResistance') return `${cell.internalResistance.toFixed(3)}`;
    if (metric === 'balance') return cell.balancingStatus === 'Review' ? 'Review' : 'OK';
    if (metric === 'health') return cell.isAnomalous ? 'Risk' : 'OK';
    return '';
  };

  if (!container || !rack) return <div className="text-slate-500 text-sm p-4">No cell data available.</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Selectors Row */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        {/* Container Selector */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 dark:text-slate-400">Container:</span>
          <div className="flex gap-1">
            {containers.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setSelectedContainer(i); setSelectedRack(0); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${selectedContainer === i
                  ? 'bg-cyan-500 text-white font-semibold shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-500'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

        {/* Rack Selector */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 dark:text-slate-400">Rack:</span>
          <div className="flex gap-1 flex-wrap">
            {container.racks.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setSelectedRack(i)}
                className={`px-3 py-1.5 rounded-lg transition-all ${selectedRack === i
                  ? 'bg-cyan-500 text-white font-semibold shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-500'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Toggle + Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-medium">
          {[
            { key: 'temperature', icon: Flame, iconClass: 'text-amber-500', label: 'Temperature' },
            { key: 'voltage', icon: Zap, iconClass: 'text-cyan-500', label: 'Voltage' },
            { key: 'internalResistance', icon: Activity, iconClass: 'text-emerald-500', label: 'IR (mΩ)' },
            { key: 'balance', icon: Activity, iconClass: 'text-violet-500', label: 'Balancing' },
            { key: 'health', icon: AlertTriangle, iconClass: 'text-rose-500', label: 'Health / risk' },
          ].map(({ key, icon: Icon, iconClass, label }) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                metric === key
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${iconClass}`} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /><span>Normal</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /><span>Elevated</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500 inline-block" /><span>Warning</span></div>
        </div>
      </div>

      {/* Hover strip */}
      <div className="sticky top-0 z-20 min-h-[52px] px-4 py-2.5 rounded-xl border border-cyan-500/25 bg-slate-100/95 text-xs shadow-md backdrop-blur-sm dark:border-cyan-400/25 dark:bg-slate-800/95 flex items-center">
        {hoveredCell ? (
          <div className="flex flex-col gap-1 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{hoveredCell.id}</span>
              <div className="flex items-center gap-4 font-mono text-slate-700 dark:text-slate-300">
                <span>V: <strong className="text-cyan-600 dark:text-cyan-400">{formatVoltage(hoveredCell.voltage)}</strong></span>
                <span>T: <strong className="text-amber-600 dark:text-amber-400">{formatTemperature(hoveredCell.temperature)}</strong></span>
                <span>SOC: <strong>{hoveredCell.soc?.toFixed(1) ?? '—'}%</strong></span>
                <span>IR: <strong className="text-emerald-600 dark:text-emerald-400">{hoveredCell.internalResistance.toFixed(3)} mΩ</strong></span>
                <span>Balance: <strong>{hoveredCell.balancingStatus || '—'}</strong></span>
              </div>
            </div>
            {hoveredCell.anomaly && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Predicted issue in {hoveredCell.anomaly.daysRemaining} days: {hoveredCell.anomaly.issue}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 italic">
            Hover over a cell to inspect telemetry — {container.name}, {rack.name} (10 modules × 50 cells = 500 cells)
          </span>
        )}
      </div>

      {/* Ten modules × 50 cells are shown for the selected rack. */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {rack.modules.map((module) => (
          <div key={module.id} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">{module.name}</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">12 Cells</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {module.cells.map((cell) => (
                <button
                  key={cell.id}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => setSelectedCell({ ...cell, containerName: container.name, rackName: rack.name, moduleName: module.name })}
                  type="button"
                  className={`relative h-9 rounded-lg font-mono text-[10px] font-bold flex flex-col items-center justify-center transition-transform hover:scale-105 ${getCellColor(cell)}`}
                  title={`${cell.id} | V: ${cell.voltage.toFixed(3)} V | T: ${cell.temperature.toFixed(1)} °C | IR: ${cell.internalResistance.toFixed(3)} mΩ${cell.anomaly ? ` | ⚠ ${cell.anomaly.issue} in ${cell.anomaly.daysRemaining}d` : ''}`}
                >
                  {cell.isAnomalous && (
                    <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white ring-1 ring-slate-900/20" />
                    </span>
                  )}
                  <span>C{String(cell.cellInModule).padStart(2, '0')}</span>
                  <span className="opacity-90 font-normal text-[9px]">{getMetricDisplay(cell)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectedCell && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" role="dialog" aria-modal="true" aria-label={`Telemetry for ${selectedCell.id}`}>
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">Cell telemetry</p><h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedCell.id}</h3><p className="mt-1 text-xs text-slate-500">{selectedCell.containerName} · {selectedCell.rackName} · {selectedCell.moduleName}</p></div>
            <button type="button" onClick={() => setSelectedCell(null)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Close</button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[['Voltage', formatVoltage(selectedCell.voltage)], ['Temperature', formatTemperature(selectedCell.temperature)], ['State of charge', `${selectedCell.soc?.toFixed(1) ?? '—'}%`], ['Internal resistance', `${selectedCell.internalResistance.toFixed(3)} mΩ`], ['Balancing state', selectedCell.balancingStatus || '—'], ['Health / risk', selectedCell.isAnomalous ? 'At risk' : 'Normal']].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{value}</p></div>)}
          </div>
          {selectedCell.anomaly ? <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200"><p className="font-bold">Prediction · {selectedCell.anomaly.modelConfidence} confidence</p><p className="mt-1">{selectedCell.anomaly.issue} in approximately {selectedCell.anomaly.daysRemaining} days.</p><p className="mt-2">{selectedCell.anomaly.action}</p></div> : <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300">No current anomaly detected for this cell.</div>}
          <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-slate-800"><h4 className="text-xs font-bold text-slate-900 dark:text-white">Investigation actions</h4><p className="mt-1 text-[11px] text-slate-500">Review historical charts and alarm records before creating an inspection task.</p><button type="button" onClick={() => createManualWorkOrder({ siteId, assetId: selectedCell.id, description: selectedCell.anomaly?.issue || `Inspect ${selectedCell.id}`, priority: selectedCell.anomaly?.priority || 'Minor', type: selectedCell.anomaly ? 'Predictive' : 'Condition-based' })} className="mt-4 w-full rounded-lg bg-cyan-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-cyan-700">Create inspection work order</button></div>
        </div>
      )}
    </div>
  );
}
