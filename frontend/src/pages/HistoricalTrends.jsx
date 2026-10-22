import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Download, Pause, Play, Search } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import ChartCard from '../components/ChartCard';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';
import { useTheme } from '../hooks/useTheme';
import { getSite } from '../services/api';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const rangeOptions = {
  Live: { duration: 15 * MINUTE, label: 'Last 15 minutes', resolutions: [{ value: '1s', ms: 1_000 }, { value: '10s', ms: 10_000 }, { value: '1m', ms: MINUTE }] },
  '1h': { duration: HOUR, label: 'Last hour', resolutions: [{ value: '10s', ms: 10_000 }, { value: '1m', ms: MINUTE }, { value: '5m', ms: 5 * MINUTE }] },
  '24h': { duration: DAY, label: 'Last 24 hours', resolutions: [{ value: '1m', ms: MINUTE }, { value: '5m', ms: 5 * MINUTE }, { value: '1h', ms: HOUR }] },
  '7d': { duration: 7 * DAY, label: 'Last 7 days', resolutions: [{ value: '5m', ms: 5 * MINUTE }, { value: '1h', ms: HOUR }, { value: '1d', ms: DAY }] },
  '30d': { duration: 30 * DAY, label: 'Last 30 days', resolutions: [{ value: '1h', ms: HOUR }, { value: '6h', ms: 6 * HOUR }, { value: '1d', ms: DAY }] },
  '1y': { duration: 365 * DAY, label: 'Last year', resolutions: [{ value: '1d', ms: DAY }, { value: '1w', ms: 7 * DAY }, { value: '1mo', ms: 30 * DAY }] },
  '3y': { duration: 3 * 365 * DAY, label: 'Last 3 years', resolutions: [{ value: '1mo', ms: 30 * DAY }, { value: '1y', ms: 365 * DAY }] },
};

const signalOptions = {
  cellTemperature: { label: 'Cell temperature', shortLabel: 'Cell temp', unit: '°C', digits: 1, color: '#f97316' },
  moduleTemperature: { label: 'Module temperature', shortLabel: 'Module temp', unit: '°C', digits: 1, color: '#fb923c' },
  rackTemperature: { label: 'Rack temperature', shortLabel: 'Rack temp', unit: '°C', digits: 1, color: '#ea580c' },
  ambientTemperature: { label: 'Ambient temperature', shortLabel: 'Ambient temp', unit: '°C', digits: 1, color: '#f43f5e' },
  cellVoltage: { label: 'Cell voltage', shortLabel: 'Cell voltage', unit: 'V', digits: 3, color: '#06b6d4' },
  moduleVoltage: { label: 'Module voltage', shortLabel: 'Module voltage', unit: 'V', digits: 1, color: '#0891b2' },
  rackVoltage: { label: 'Rack voltage', shortLabel: 'Rack voltage', unit: 'V', digits: 1, color: '#0e7490' },
  acVoltage: { label: 'PCS AC voltage', shortLabel: 'AC voltage', unit: 'V', digits: 1, color: '#0284c7' },
  dcVoltage: { label: 'PCS DC voltage', shortLabel: 'DC voltage', unit: 'V', digits: 1, color: '#2563eb' },
  stringCurrent: { label: 'Battery string current', shortLabel: 'String current', unit: 'A', digits: 1, color: '#8b5cf6' },
  acCurrent: { label: 'PCS AC current', shortLabel: 'AC current', unit: 'A', digits: 0, color: '#7c3aed' },
  dcCurrent: { label: 'PCS DC current', shortLabel: 'DC current', unit: 'A', digits: 0, color: '#6d28d9' },
  activePower: { label: 'Site active power', shortLabel: 'Active power', unit: 'MW', digits: 1, color: '#8b5cf6' },
  reactivePower: { label: 'PCS reactive power', shortLabel: 'Reactive power', unit: 'MVAr', digits: 2, color: '#a855f7' },
  energyThroughput: { label: 'Daily energy throughput', shortLabel: 'Throughput', unit: 'MWh', digits: 1, color: '#14b8a6' },
  frequency: { label: 'Grid frequency', shortLabel: 'Frequency', unit: 'Hz', digits: 2, color: '#64748b' },
  efficiency: { label: 'PCS efficiency', shortLabel: 'PCS efficiency', unit: '%', digits: 1, color: '#10b981' },
  roundTripEfficiency: { label: 'Round-trip efficiency', shortLabel: 'RTE', unit: '%', digits: 1, color: '#059669' },
  stateOfCharge: { label: 'State of charge', shortLabel: 'SOC', unit: '%', digits: 1, color: '#eab308' },
  stateOfHealth: { label: 'State of health', shortLabel: 'SOH', unit: '%', digits: 1, color: '#84cc16' },
  stateOfEnergy: { label: 'State of energy', shortLabel: 'SOE', unit: 'MWh', digits: 1, color: '#22c55e' },
  humidity: { label: 'Ambient humidity', shortLabel: 'Humidity', unit: '%', digits: 1, color: '#38bdf8' },
  internalResistance: { label: 'Cell internal resistance', shortLabel: 'Resistance', unit: 'mΩ', digits: 3, color: '#a3e635' },
};

function signalGroup(key) {
  if (['cellTemperature', 'moduleTemperature', 'rackTemperature', 'ambientTemperature'].includes(key)) return 'temperature';
  if (key === 'cellVoltage') return 'cell-voltage';
  if (key === 'moduleVoltage') return 'module-voltage';
  if (key === 'rackVoltage') return 'rack-voltage';
  if (['acVoltage', 'dcVoltage'].includes(key)) return 'pcs-voltage';
  if (key === 'stringCurrent') return 'string-current';
  if (['acCurrent', 'dcCurrent'].includes(key)) return 'pcs-current';
  if (key === 'activePower') return 'active-power';
  if (key === 'reactivePower') return 'reactive-power';
  if (key === 'energyThroughput') return 'throughput';
  if (key === 'frequency') return 'frequency';
  if (['efficiency', 'roundTripEfficiency'].includes(key)) return 'efficiency';
  if (['stateOfCharge', 'stateOfHealth'].includes(key)) return 'battery-percent';
  if (key === 'stateOfEnergy') return 'state-of-energy';
  if (key === 'humidity') return 'humidity';
  return 'resistance';
}

function signalBase(site, asset, signal) {
  const [, containerId, rackId, moduleId] = asset.match(/C(\d+)-R(\d+)(?:-M(\d+))?/) || [];
  const container = site?.pack?.containers?.find((item) => item.id === `Cont${containerId}`);
  const rack = site?.pack?.rackSummary?.find((item) => item.id === `Cont${containerId}-R${rackId}`) || site?.pack?.rackSummary?.[0];
  const selectedModule = container?.racks?.find((item) => item.id === `R${rackId}`)?.modules?.find((item) => item.id === `M${moduleId}`);
  const cell = selectedModule?.cells?.[6];
  const module = rack?.modules?.find((item) => item.id === `M${moduleId}`) || rack?.modules?.[0];
  const pcs = site?.equipment?.pcs;
  const values = {
    cellTemperature: cell?.temperature ?? module?.averageTemperature ?? rack?.averageTemperature ?? site?.temperature ?? 30,
    moduleTemperature: module?.averageTemperature ?? site?.temperature ?? 30,
    rackTemperature: rack?.averageTemperature ?? site?.temperature ?? 30,
    ambientTemperature: site?.equipment?.environment?.ambientTempC ?? site?.temperature ?? 30,
    cellVoltage: cell?.voltage ?? module?.averageCellVoltage ?? rack?.averageCellVoltage ?? 3.28,
    moduleVoltage: module?.moduleVoltage ?? (rack?.rackVoltage / rack?.moduleCount) ?? 164,
    rackVoltage: rack?.rackVoltage ?? 1640,
    acVoltage: pcs?.acVoltage ?? 690,
    dcVoltage: pcs?.dcVoltage ?? site?.dcVoltage ?? 1250,
    stringCurrent: rack?.stringCurrentA ?? 350,
    acCurrent: pcs?.acCurrentA ?? 3500,
    dcCurrent: pcs?.dcCurrentA ?? 4000,
    activePower: site?.powerMW ?? 0,
    reactivePower: pcs?.reactivePowerMVAr ?? 2.4,
    energyThroughput: site?.energyTodayMWh ?? 30,
    frequency: pcs?.frequency ?? 50,
    efficiency: pcs?.efficiency ?? 98,
    roundTripEfficiency: site?.roundTripEfficiency ?? 93,
    stateOfCharge: cell?.soc ?? rack?.averageSoc ?? site?.soc ?? 50,
    stateOfHealth: site?.soh ?? 95,
    stateOfEnergy: site?.soeMWh ?? (site?.capacityMWh && site?.soc != null ? site.capacityMWh * site.soc / 100 : 20),
    humidity: site?.equipment?.environment?.humidity ?? 60,
    internalResistance: cell?.internalResistance ?? 0.25,
  };
  return values[signal] ?? 0;
}

function createSeed(value) {
  return value.split('').reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 7) || 1;
}

function makeRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function formatTimestamp(timestamp, range) {
  const date = new Date(timestamp);
  if (['Live', '1h', '24h'].includes(range)) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (['7d', '30d'].includes(range)) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  if (range === '1y') {
    return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
}

function generateSeries({ site, asset, signal, range, resolution, customStart, customEnd }) {
  if (!site) return [];
  const customDuration = Math.max(60 * 60 * 1000, new Date(`${customEnd}T23:59:59`).getTime() - new Date(`${customStart}T00:00:00`).getTime());
  const rangeConfig = range === 'custom'
    ? { duration: customDuration, resolutions: [{ value: '1h', ms: HOUR }, { value: '1d', ms: DAY }] }
    : rangeOptions[range];
  const step = rangeConfig.resolutions.find((item) => item.value === resolution)?.ms || rangeConfig.resolutions[0].ms;
  const count = Math.ceil(rangeConfig.duration / step) + 1;
  const end = range === 'custom' ? new Date(`${customEnd}T23:59:59`).getTime() : Date.now();
  const start = range === 'custom' ? new Date(`${customStart}T00:00:00`).getTime() : end - rangeConfig.duration;
  const random = makeRandom(createSeed(`${site.id}:${signal}:${range}:${resolution}`));
  const base = signalBase(site, asset, signal);

  return Array.from({ length: count }, (_, index) => {
    const timestamp = start + Math.min(index * step, rangeConfig.duration);
    const progress = index / Math.max(1, count - 1);
    const noise = random() - 0.5;
    let value;

    if (['cellTemperature', 'moduleTemperature', 'rackTemperature', 'ambientTemperature'].includes(signal)) {
      const hotspotRise = site.id === 'BESS-JODHUR' && progress > 0.92
        ? ((progress - 0.92) / 0.08) * (51 - base)
        : 0;
      value = base + Math.sin(progress * Math.PI * 8) * 1.25 + noise * 0.55 + hotspotRise;
    } else if (['cellVoltage', 'moduleVoltage', 'rackVoltage', 'acVoltage', 'dcVoltage'].includes(signal)) {
      const variance = base < 10 ? 0.015 : base < 1000 ? 0.7 : 2.2;
      value = base + Math.sin(progress * Math.PI * 10) * variance + noise * variance * 0.3;
      if (site.id === 'BESS-JODHUR' && progress > 0.72 && progress < 0.76) value -= 0.1;
    } else if (['activePower', 'reactivePower'].includes(signal)) {
      const dailyCycle = Math.sin((timestamp / DAY) * Math.PI * 2);
      const variation = Math.max(0.2, Math.min(5, site.capacityMW * 0.3));
      value = (site.status === 'Offline' || site.status === 'Fault' ? 0 : base * 0.72) + dailyCycle * variation + noise * 0.8;
    } else if (signal === 'energyThroughput') {
      value = Math.max(0, base * (0.9 + Math.sin(progress * Math.PI * 4) * 0.08 + noise * 0.025));
    } else if (['stringCurrent', 'acCurrent', 'dcCurrent'].includes(signal)) {
      value = base * (0.8 + Math.sin(progress * Math.PI * 8) * 0.15 + noise * 0.05);
    } else if (['stateOfCharge', 'stateOfHealth', 'stateOfEnergy', 'humidity', 'frequency', 'efficiency', 'roundTripEfficiency'].includes(signal)) {
      value = base + Math.sin(progress * Math.PI * 4) * (signal === 'frequency' ? 0.08 : signal.includes('Efficiency') || signal === 'efficiency' ? 0.25 : 1.2) + noise * 0.1;
    } else if (signal === 'internalResistance') {
      value = base + Math.sin(progress * Math.PI * 6) * 0.006 + noise * 0.002;
    }

    return {
      timestamp,
      time: formatTimestamp(timestamp, range),
      value: Number(value.toFixed(signalOptions[signal].digits)),
    };
  });
}

function downloadSeries(series, siteName, signals, extension = 'csv') {
  const header = ['Timestamp', ...signals.flatMap((key) => [`${signalOptions[key].label} (${signalOptions[key].unit})`])];
  const rows = series.map((point) => [new Date(point.timestamp).toISOString(), ...signals.map((key) => point[key])]);
  const body = [header, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const content = extension === 'xls'
    ? `<table><thead><tr>${header.map((value) => `<th>${value}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value) => `<td>${String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</td>`).join('')}</tr>`).join('')}</tbody></table>`
    : `\uFEFF${body}\r\n`;
  const blob = new Blob([content], { type: extension === 'xls' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-trends.${extension}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function HistoricalTrends() {
  const { selectedSite, accessibleSites, selectSite } = useDemoData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [trendSite, setTrendSite] = useState(null);
  const [range, setRange] = useState('24h');
  const [signal, setSignal] = useState('cellTemperature');
  const [assetType, setAssetType] = useState('C1-R2-M4-C07');
  const [selectedSignals, setSelectedSignals] = useState(['cellTemperature']);
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * DAY).toISOString().slice(0, 10);
  const [customStart, setCustomStart] = useState(weekAgo);
  const [customEnd, setCustomEnd] = useState(today);
  const [resolution, setResolution] = useState('5m');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackCount, setPlaybackCount] = useState(null);
  useEffect(() => {
    let active = true;
    if (selectedSite?.id) getSite(selectedSite.id).then((site) => { if (active) setTrendSite(site); });
    return () => { active = false; };
  }, [selectedSite?.id]);
  const selectedRange = rangeOptions[range] || { duration: 7 * DAY, label: 'Custom range', resolutions: [{ value: '1h', ms: HOUR }, { value: '1d', ms: DAY }] };
  const selectedSignal = signalOptions[signal];
  const selectedResolution = selectedRange.resolutions.some((item) => item.value === resolution)
    ? resolution
    : selectedRange.resolutions[0].value;
  const selectedSeries = useMemo(
    () => {
      const source = Object.fromEntries(selectedSignals.map((key) => [key, generateSeries({ site: trendSite || selectedSite, asset: assetType, signal: key, range, resolution: selectedResolution, customStart, customEnd })]));
      const anchor = source[selectedSignals[0]] || [];
      return anchor.map((point, index) => ({ ...point, ...Object.fromEntries(selectedSignals.map((key) => [key, source[key]?.[index]?.value ?? null])) }));
    },
    [selectedSite, trendSite, assetType, selectedSignals, range, selectedResolution, customStart, customEnd],
  );

  useEffect(() => {
    setIsPlaying(false);
    setPlaybackCount(selectedSeries.length);
  }, [selectedSeries]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (playbackCount >= selectedSeries.length) {
      setIsPlaying(false);
      return undefined;
    }
    const increment = Math.max(1, Math.ceil(selectedSeries.length / 80));
    const timer = window.setTimeout(() => {
      setPlaybackCount((current) => Math.min(selectedSeries.length, (current || 0) + increment));
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isPlaying, playbackCount, selectedSeries.length]);

  const visibleSeries = selectedSeries.slice(0, playbackCount ?? selectedSeries.length);
  const siteName = selectedSite?.name || 'Selected site';
  const assetPath = `${siteName} / ${assetType}`;
  const tickInterval = Math.max(0, Math.floor(selectedSeries.length / 7) - 1);

  const changeRange = (nextRange) => {
    setRange(nextRange);
    setResolution((rangeOptions[nextRange] || { resolutions: [{ value: '1h' }] }).resolutions[0].value);
  };

  const toggleSignal = (key) => setSelectedSignals((current) => current.includes(key)
    ? current.length > 1 ? current.filter((item) => item !== key) : current
    : signalGroup(key) === signalGroup(current[0]) ? [...current, key] : [key]);

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (playbackCount >= selectedSeries.length) setPlaybackCount(1);
    setIsPlaying(true);
  };

  const exportSeries = (extension) => downloadSeries(visibleSeries, siteName, selectedSignals, extension);

  return (
    <PageFrame title="Historical Trends" description="Explore site telemetry over selectable time windows and sampling resolutions.">
      <div className="surface-card flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900">
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500"><span className="mb-1.5 block">Site</span><select value={selectedSite?.id || ''} onChange={(event) => selectSite(event.target.value)} className="min-w-40 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium normal-case tracking-normal dark:border-slate-700">{accessibleSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>
        <div className="min-w-[220px] flex-1">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Selected asset</span>
          <select aria-label="Select asset" value={assetType} onChange={(event) => setAssetType(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200">{['C1-R2-M4-C07', 'C1-R2-M4', 'C1-R2', 'PCS-01', 'HVAC-01', 'Transformer', 'Site meter', 'Site environment'].map((asset) => <option key={asset} value={asset}>{asset}</option>)}</select>
          <span className="mt-1 block truncate text-[9px] text-slate-400">{assetPath}</span>
        </div>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span className="mb-1.5 block">Signal</span>
          <select value={signal} onChange={(event) => { setSignal(event.target.value); setSelectedSignals((current) => current.some((key) => signalGroup(key) === signalGroup(event.target.value)) ? current.filter((key) => signalGroup(key) === signalGroup(event.target.value)) : [event.target.value]); }} className="min-w-48 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200">
            {Object.entries(signalOptions).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
          </select>
        </label>
        <fieldset className="flex max-h-24 min-w-52 flex-wrap gap-x-3 gap-y-1 overflow-y-auto rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"><legend className="px-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">Comparable overlays</legend>{Object.entries(signalOptions).filter(([key]) => signalGroup(key) === signalGroup(signal)).map(([value, option]) => <label key={value} className="flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-300"><input type="checkbox" checked={selectedSignals.includes(value)} onChange={() => toggleSignal(value)} className="accent-cyan-600" />{option.shortLabel}</label>)}</fieldset>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span className="mb-1.5 block">Time range</span>
          <select value={range} onChange={(event) => changeRange(event.target.value)} className="min-w-32 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200">
            {Object.keys(rangeOptions).map((value) => <option key={value} value={value}>{value}</option>)}<option value="custom">Custom range</option>
          </select>
        </label>
        {range === 'custom' && <><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500"><span className="mb-1.5 block">From</span><input type="date" max={customEnd} value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-2 py-2.5 text-xs dark:border-slate-700" /></label><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500"><span className="mb-1.5 block">To</span><input type="date" min={customStart} max={today} value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-2 py-2.5 text-xs dark:border-slate-700" /></label></>}
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span className="mb-1.5 block">Resolution</span>
          <select value={selectedResolution} onChange={(event) => setResolution(event.target.value)} className="min-w-24 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200">
            {selectedRange.resolutions.map((option) => <option key={option.value} value={option.value}>{option.value}</option>)}
          </select>
        </label>
      </div>

      <ChartCard
        title={`${selectedSignal.label} · ${range}`}
        subtitle={`${siteName} · ${selectedRange.label} · ${selectedResolution} samples · ${selectedSignals.map((key) => signalOptions[key].shortLabel).join(' + ')}`}
        badgeText={selectedSignal.unit}
      >
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={visibleSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={selectedSignal.color} stopOpacity={0.28} /><stop offset="95%" stopColor={selectedSignal.color} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#26364b' : '#e2eaf2'} />
            <XAxis dataKey="time" interval={tickInterval} minTickGap={24} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
            <YAxis domain={['auto', 'auto']} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} width={54} />
            <Tooltip
              contentStyle={{ backgroundColor: isDark ? '#0e1a2b' : '#ffffff', borderColor: isDark ? '#26364b' : '#dfe7f1', borderRadius: '0.75rem', fontSize: '11px' }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.timestamp ? new Date(payload[0].payload.timestamp).toLocaleString() : ''}
              formatter={(value, name) => { const option = signalOptions[name] || selectedSignal; return [`${Number(value).toFixed(option.digits)} ${option.unit}`, option.shortLabel]; }}
            />
            {signalOptions[signal].unit === '°C' && selectedSite?.id === 'BESS-JODHUR' && <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="5 4" label={{ value: 'Review threshold', fill: '#ef4444', fontSize: 10 }} />}
            {selectedSignals.map((key) => <Area key={key} type="monotone" dataKey={key} name={key} stroke={signalOptions[key].color} fill="none" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} connectNulls />)}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-xs text-cyan-900 dark:text-cyan-200">
        <span className="flex items-center gap-2"><Activity className="h-4 w-4 shrink-0" />Range and resolution control the sample window and point count; displayed retention target is 3 years.</span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={() => exportSeries('csv')}>Export CSV</Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={() => exportSeries('xls')}>Export Excel-compatible</Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={() => window.print()}>Print / save PDF</Button>
          <Button variant="primary" size="sm" icon={isPlaying ? Pause : Play} onClick={togglePlayback}>{isPlaying ? 'Pause playback' : playbackCount < selectedSeries.length ? 'Resume playback' : 'Play playback'}</Button>
        </div>
      </div>
    </PageFrame>
  );
}
