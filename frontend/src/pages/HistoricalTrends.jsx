import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Download, Pause, Play, Plus } from 'lucide-react';
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

const assetLevels = {
  Site: { example: 'BESS-JODHUR', format: 'Uses the site selected in the navbar.' },
  Container: { example: 'C1', format: 'Container: C1 or C2' },
  Rack: { example: 'C1-R2', format: 'Rack: C1-R2' },
  Module: { example: 'C1-R2-M4', format: 'Module: C1-R2-M4' },
  Cell: { example: 'C1-R2-M4-C07', format: 'Cell: C1-R2-M4-C07 (cell number is 01–50)' },
  Equipment: { example: 'PCS-01', format: 'Equipment ID, e.g. PCS-01, HVAC-01, Transformer, Site meter' },
};

function isValidAssetId(level, value, siteId) {
  if (level === 'Site') return value === siteId;
  if (level === 'Container') return /^C[1-2]$/.test(value);
  if (level === 'Rack') return /^C[1-2]-R[1-5]$/.test(value);
  if (level === 'Module') return /^C[1-2]-R[1-5]-M(?:[1-9]|10)$/.test(value);
  if (level === 'Cell') return /^C[1-2]-R[1-5]-M(?:[1-9]|10)-C(?:0[1-9]|[1-4]\d|50)$/.test(value);
  return /^[A-Za-z0-9][A-Za-z0-9 ._-]{1,49}$/.test(value);
}

const signalOptions = {
  cellTemperature: { label: 'Cell temperature', shortLabel: 'Cell temp', unit: '°C', digits: 1, color: '#f97316' },
  moduleTemperature: { label: 'Module temperature', shortLabel: 'Module temp', unit: '°C', digits: 1, color: '#fb923c' },
  rackTemperature: { label: 'Rack temperature', shortLabel: 'Rack temp', unit: '°C', digits: 1, color: '#ea580c' },
  ambientTemperature: { label: 'Ambient temperature', shortLabel: 'Ambient temp', unit: '°C', digits: 1, color: '#f43f5e' },
  cellVoltage: { label: 'Cell voltage', shortLabel: 'Cell voltage', unit: 'V', digits: 3, color: 'var(--app-accent)' },
  moduleVoltage: { label: 'Module voltage', shortLabel: 'Module voltage', unit: 'V', digits: 1, color: '#3b82f6' },
  rackVoltage: { label: 'Rack voltage', shortLabel: 'Rack voltage', unit: 'V', digits: 1, color: '#1d4ed8' },
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
  const [, containerId, rackId, moduleId] = asset.match(/^C(\d+)(?:-R(\d+)(?:-M(\d+))?(?:-C\d+)?)?$/) || [];
  const containers = (site?.pack?.containers || []).filter((item) => !containerId || item.id === `Cont${containerId}`);
  const racks = containers.flatMap((item) => item.racks || []).filter((item) => !rackId || item.id === `R${rackId}`);
  const modules = racks.flatMap((item) => item.modules || []).filter((item) => !moduleId || item.id === `M${moduleId}`);
  const scopedCells = modules.flatMap((item) => item.cells || []);
  const selectedModule = moduleId ? modules[0] : null;
  const cell = /-C\d+$/.test(asset) ? selectedModule?.cells?.find((item) => item.id === asset) : null;
  const mean = (field) => scopedCells.length ? scopedCells.reduce((sum, item) => sum + (Number(item[field]) || 0), 0) / scopedCells.length : null;
  const averageTemperature = mean('temperature');
  const averageVoltage = mean('voltage');
  const averageResistance = mean('internalResistance');
  const rackSummary = (site?.pack?.rackSummary || []).filter((item) => (!containerId || item.id.startsWith(`Cont${containerId}-`)) && (!rackId || item.id === `Cont${containerId}-R${rackId}`));
  const rack = rackSummary[0];
  const pcs = site?.equipment?.pcs;
  const values = {
    cellTemperature: cell?.temperature ?? averageTemperature ?? site?.temperature ?? 30,
    moduleTemperature: averageTemperature ?? site?.temperature ?? 30,
    rackTemperature: averageTemperature ?? rack?.averageTemperature ?? site?.temperature ?? 30,
    ambientTemperature: site?.equipment?.environment?.ambientTempC ?? site?.temperature ?? 30,
    cellVoltage: cell?.voltage ?? averageVoltage ?? rack?.averageCellVoltage ?? 3.28,
    moduleVoltage: (averageVoltage * 50) || (rack?.rackVoltage / rack?.moduleCount) || 164,
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
    internalResistance: cell?.internalResistance ?? averageResistance ?? 0.25,
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

function formatTimestamp(timestamp, range, resolution) {
  const date = new Date(timestamp);
  const resolutionMs = range === 'custom'
    ? (resolution === '1d' ? DAY : HOUR)
    : rangeOptions[range]?.resolutions.find((item) => item.value === resolution)?.ms;
  if (['Live', '1h', '24h'].includes(range)) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', ...(resolutionMs < MINUTE ? { second: '2-digit' } : {}) });
  }
  if (['7d', '30d'].includes(range)) {
    const day = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return resolutionMs < DAY ? `${day} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : day;
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
  const random = makeRandom(createSeed(`${site.id}:${asset}:${signal}:${range}:${resolution}:${customStart}:${customEnd}`));
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
      time: formatTimestamp(timestamp, range, resolution),
      value: Number(value.toFixed(signalOptions[signal].digits)),
    };
  });
}

function downloadSeries(series, siteName, signals, comparisonAssets, extension = 'csv') {
  const unit = signalOptions[signals[0]].unit;
  const header = ['Timestamp', ...signals.map((key) => `${signalOptions[key].label} (${signalOptions[key].unit})`), ...comparisonAssets.map((id) => `${id} · ${signalOptions[signals[0]].label} (${unit})`)];
  const rows = series.map((point) => [new Date(point.timestamp).toISOString(), ...signals.map((key) => point[key]), ...comparisonAssets.map((id) => point[`asset:${id}`])]);
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
  const { selectedSite } = useDemoData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [trendSite, setTrendSite] = useState(null);
  const [range, setRange] = useState('24h');
  const [signal, setSignal] = useState('cellTemperature');
  const [assetLevel, setAssetLevel] = useState('Cell');
  const [assetId, setAssetId] = useState('C1-R2-M4-C07');
  const [comparisonAssetId, setComparisonAssetId] = useState('');
  const [comparisonAssets, setComparisonAssets] = useState([]);
  const [comparisonNotice, setComparisonNotice] = useState('');
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
    setTrendSite(null);
    if (selectedSite?.id) getSite(selectedSite.id).then((site) => { if (active) setTrendSite(site); }).catch(() => { if (active) setTrendSite(null); });
    return () => { active = false; };
  }, [selectedSite?.id]);
  useEffect(() => {
    if (assetLevel === 'Site') setAssetId(selectedSite?.id || '');
  }, [selectedSite?.id, assetLevel]);
  const selectedRange = rangeOptions[range] || { duration: 7 * DAY, label: 'Custom range', resolutions: [{ value: '1h', ms: HOUR }, { value: '1d', ms: DAY }] };
  const selectedSignal = signalOptions[signal];
  const selectedResolution = selectedRange.resolutions.some((item) => item.value === resolution)
    ? resolution
    : selectedRange.resolutions[0].value;
  const selectedSeries = useMemo(
    () => {
      if (!isValidAssetId(assetLevel, assetId, selectedSite?.id)) return [];
      const source = Object.fromEntries(selectedSignals.map((key) => [key, generateSeries({ site: trendSite || selectedSite, asset: assetId, signal: key, range, resolution: selectedResolution, customStart, customEnd })]));
      const anchor = source[selectedSignals[0]] || [];
      const assetSources = Object.fromEntries(comparisonAssets.map((id) => [`asset:${id}`, generateSeries({ site: trendSite || selectedSite, asset: id, signal, range, resolution: selectedResolution, customStart, customEnd })]));
      return anchor.map((point, index) => ({ ...point, ...Object.fromEntries(selectedSignals.map((key) => [key, source[key]?.[index]?.value ?? null])), ...Object.fromEntries(comparisonAssets.map((id) => [`asset:${id}`, assetSources[`asset:${id}`]?.[index]?.value ?? null])) }));
    },
    [selectedSite, trendSite, assetLevel, assetId, comparisonAssets, signal, selectedSignals, range, selectedResolution, customStart, customEnd],
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
  const assetPath = assetLevel === 'Site' ? `${siteName} · ${selectedSite?.id || ''}` : `${siteName} / ${assetLevel} / ${assetId}`;
  const tickInterval = Math.max(0, Math.floor(selectedSeries.length / 7) - 1);

  const changeRange = (nextRange) => {
    setRange(nextRange);
    setResolution((rangeOptions[nextRange] || { resolutions: [{ value: '1h' }] }).resolutions[0].value);
  };

  const toggleSignal = (key) => {
    if (selectedSignals.includes(key)) {
      if (selectedSignals.length === 1) return;
      const remaining = selectedSignals.filter((item) => item !== key);
      if (signal === key) setSignal(remaining[0]);
      setSelectedSignals(remaining);
      return;
    }
    if (signalGroup(key) === signalGroup(selectedSignals[0])) setSelectedSignals((current) => [...current, key]);
    else setSelectedSignals([key]);
  };

  const addComparableAsset = () => {
    const candidate = comparisonAssetId.trim().toUpperCase();
    if (!isValidAssetId(assetLevel, candidate, selectedSite?.id)) {
      setComparisonNotice(`Enter a valid ${assetLevel.toLowerCase()} ID. ${assetLevels[assetLevel].format}`);
      return;
    }
    if (candidate === assetId || comparisonAssets.includes(candidate)) {
      setComparisonNotice('That asset is already in the comparison.');
      return;
    }
    if (comparisonAssets.length >= 4) {
      setComparisonNotice('Compare up to four additional assets at a time.');
      return;
    }
    setComparisonAssets((current) => [...current, candidate]);
    setComparisonAssetId('');
    setComparisonNotice('');
  };

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (playbackCount >= selectedSeries.length) setPlaybackCount(1);
    setIsPlaying(true);
  };

  const exportSeries = (extension) => downloadSeries(visibleSeries, siteName, selectedSignals, comparisonAssets, extension);

  return (
    <PageFrame title="Historical Trends" description="Explore site telemetry over selectable time windows and sampling resolutions.">
      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Historical trend controls">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Trend explorer</h2><p className="mt-1 text-[11px] text-slate-500">Choose an asset, signal, and sampling window.</p></div>
          <span className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">{siteName}</span>
        </div>
        <div className="grid grid-cols-1 items-start gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-12">
          <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 xl:col-span-2"><span className="mb-1.5 block">Asset level</span><select value={assetLevel} onChange={(event) => { const nextLevel = event.target.value; setAssetLevel(nextLevel); setAssetId(nextLevel === 'Site' ? selectedSite?.id || '' : assetLevels[nextLevel].example); setComparisonAssets([]); setComparisonNotice(''); }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{Object.keys(assetLevels).map((level) => <option key={level}>{level}</option>)}</select></label>
          {assetLevel === 'Site' ? <div className="min-w-0 xl:col-span-4"><span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Selected site</span><div className="flex min-h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">{selectedSite?.name || 'No site selected'}</div><span className="mt-1 block truncate text-[9px] text-slate-400">{selectedSite?.id}</span></div> : <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 xl:col-span-4"><span className="mb-1.5 block">Asset ID</span><input aria-label="Type asset ID" value={assetId} onChange={(event) => setAssetId(event.target.value.toUpperCase())} placeholder={assetLevels[assetLevel].example} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /><span className="mt-1 block text-[9px] font-medium normal-case tracking-normal text-slate-400">Expected format: {assetLevels[assetLevel].format}</span></label>}
          <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 xl:col-span-2"><span className="mb-1.5 block">Signal</span><select value={signal} onChange={(event) => { setSignal(event.target.value); setSelectedSignals([event.target.value]); }} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{Object.entries(signalOptions).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}</select></label>
          <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 xl:col-span-2"><span className="mb-1.5 block">Time range</span><select value={range} onChange={(event) => changeRange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{Object.keys(rangeOptions).map((value) => <option key={value} value={value}>{value}</option>)}<option value="custom">Custom range</option></select></label>
          {range === 'custom' && <><label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 xl:col-span-2"><span className="mb-1.5 block">From</span><input type="date" max={customEnd} value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label><label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 xl:col-span-2"><span className="mb-1.5 block">To</span><input type="date" min={customStart} max={today} value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label></>}
          <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 xl:col-span-2"><span className="mb-1.5 block">Resolution</span><select value={selectedResolution} onChange={(event) => setResolution(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">{selectedRange.resolutions.map((option) => <option key={option.value} value={option.value}>{option.value}</option>)}</select></label>
        </div>
        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-center">
          <div><h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Comparable signals</h3><p className="mt-1 text-[10px] text-slate-400">Overlay matching units</p></div>
          <div className="flex flex-wrap gap-2">{Object.entries(signalOptions).filter(([key]) => signalGroup(key) === signalGroup(signal)).map(([value, option]) => <label key={value} className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-medium transition-colors ${selectedSignals.includes(value) ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}><input type="checkbox" checked={selectedSignals.includes(value)} onChange={() => toggleSignal(value)} className="accent-cyan-600" /><span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} />{option.shortLabel}</label>)}</div>
        </div>
        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 lg:grid-cols-[11rem_minmax(0,1fr)] lg:items-start">
          <div><h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Compare assets</h3><p className="mt-1 text-[10px] text-slate-400">Same level, same signal · Up to four</p></div>
          {assetLevel === 'Site' ? <p className="text-[11px] text-slate-500">Select a container, rack, module, cell, or equipment level to compare individual assets.</p> : <div className="min-w-0">
            <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); addComparableAsset(); }}>
              <label className="min-w-52 flex-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">Add {assetLevel.toLowerCase()} ID<input value={comparisonAssetId} onChange={(event) => setComparisonAssetId(event.target.value.toUpperCase())} placeholder={`Another ${assetLevel.toLowerCase()} ID, e.g. ${assetLevels[assetLevel].example}`} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" /></label>
              <Button type="submit" size="sm" variant="secondary" icon={Plus} disabled={comparisonAssets.length >= 4}>Add to chart</Button>
              {comparisonNotice && <p role="status" className="w-full text-[10px] text-amber-700 dark:text-amber-300">{comparisonNotice}</p>}
            </form>
            {comparisonAssets.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{comparisonAssets.map((id, index) => <span key={id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] dark:border-slate-700"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: ['#2563eb', '#0891b2', '#0e7490', '#38bdf8'][index] }} />{id}<button type="button" aria-label={`Remove ${id} comparison`} onClick={() => setComparisonAssets((current) => current.filter((asset) => asset !== id))} className="font-bold text-slate-500 hover:text-rose-600">×</button></span>)}</div>}
          </div>}
        </div>
      </section>

      <ChartCard
        title={`${selectedSignal.label} · ${range}`}
        subtitle={`${siteName} · ${assetLevel} ${assetLevel === 'Site' ? '' : assetId} · ${selectedRange.label} · ${selectedResolution} samples`}
        badgeText={selectedSignal.unit}
      >
        {!isValidAssetId(assetLevel, assetId, selectedSite?.id) ? <div role="alert" className="m-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-200">Enter an ID in this format: {assetLevels[assetLevel].format}</div> : <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={visibleSeries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={selectedSignal.color} stopOpacity={0.28} /><stop offset="95%" stopColor={selectedSignal.color} stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-chart-grid)" />
            <XAxis dataKey="time" interval={tickInterval} minTickGap={24} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
            <YAxis domain={['auto', 'auto']} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} width={54} />
            <Legend formatter={(value) => { const label = String(value ?? ''); return label.startsWith('asset:') ? label.slice(6) : signalOptions[label]?.shortLabel || label; }} wrapperStyle={{ fontSize: '10px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--app-tooltip-bg)', borderColor: 'var(--app-tooltip-border)', borderRadius: '0.75rem', fontSize: '11px' }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.timestamp ? new Date(payload[0].payload.timestamp).toLocaleString() : ''}
              formatter={(value, name) => { const key = String(name ?? ''); const option = signalOptions[key] || selectedSignal; return [`${Number(value).toFixed(option.digits)} ${option.unit}`, key.startsWith('asset:') ? key.slice(6) : option.shortLabel]; }}
            />
            {signal !== 'ambientTemperature' && signalOptions[signal].unit === '°C' && selectedSite?.id === 'BESS-JODHUR' && <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="5 4" label={{ value: 'Review threshold · 45°C', fill: '#ef4444', fontSize: 10 }} />}
            {selectedSignals.map((key) => <Area key={key} type="monotone" dataKey={key} name={key} stroke={signalOptions[key].color} fill="none" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} connectNulls />)}
            {comparisonAssets.map((id, index) => <Area key={id} type="monotone" dataKey={`asset:${id}`} name={`asset:${id}`} stroke={['#2563eb', '#0891b2', '#0e7490', '#38bdf8'][index]} fill="none" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} connectNulls />)}
          </AreaChart>
        </ResponsiveContainer>}
      </ChartCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-xs text-cyan-900 dark:text-cyan-200">
        <span className="flex items-center gap-2"><Activity className="h-4 w-4 shrink-0" />Illustrative demo telemetry. Select a range and resolution to change the generated sample window; this is not live historian data.</span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Download} disabled={!selectedSeries.length} onClick={() => exportSeries('csv')}>Export CSV</Button>
          <Button variant="secondary" size="sm" icon={Download} disabled={!selectedSeries.length} onClick={() => exportSeries('xls')}>Export Excel-compatible</Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={() => window.print()}>Print / save PDF</Button>
          <Button variant="primary" size="sm" icon={isPlaying ? Pause : Play} disabled={!selectedSeries.length} onClick={togglePlayback}>{isPlaying ? 'Pause playback' : playbackCount < selectedSeries.length ? 'Resume playback' : 'Play playback'}</Button>
        </div>
      </div>
    </PageFrame>
  );
}
