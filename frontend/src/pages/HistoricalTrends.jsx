import React, { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Download, Pause, Play, Search } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import ChartCard from '../components/ChartCard';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';
import { useTheme } from '../hooks/useTheme';

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
  temperature: { label: 'Cell temperature', shortLabel: 'Temperature', unit: '°C', digits: 1, color: '#f97316' },
  voltage: { label: 'Cell voltage', shortLabel: 'Voltage', unit: 'V', digits: 3, color: '#06b6d4' },
  power: { label: 'Site active power', shortLabel: 'Active power', unit: 'MW', digits: 1, color: '#8b5cf6' },
};

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

function generateSeries({ site, signal, range, resolution }) {
  if (!site) return [];
  const rangeConfig = rangeOptions[range];
  const step = rangeConfig.resolutions.find((item) => item.value === resolution)?.ms || rangeConfig.resolutions[0].ms;
  const count = Math.ceil(rangeConfig.duration / step) + 1;
  const end = Date.now();
  const start = end - rangeConfig.duration;
  const random = makeRandom(createSeed(`${site.id}:${signal}:${range}:${resolution}`));
  const currentPower = site.status === 'Offline' || site.status === 'Fault' ? 0 : site.powerMW;
  const temperatureBase = Math.min(site.temperature || 30, 35);
  const voltageBase = 3.25 + ((site.soh - 80) * 0.0025);

  return Array.from({ length: count }, (_, index) => {
    const timestamp = start + Math.min(index * step, rangeConfig.duration);
    const progress = index / Math.max(1, count - 1);
    const noise = random() - 0.5;
    let value;

    if (signal === 'temperature') {
      const hotspotRise = site.id === 'BESS-JODHUR' && progress > 0.92
        ? ((progress - 0.92) / 0.08) * (51 - temperatureBase)
        : 0;
      value = temperatureBase + Math.sin(progress * Math.PI * 8) * 1.25 + noise * 0.55 + hotspotRise;
    } else if (signal === 'voltage') {
      value = voltageBase + Math.sin(progress * Math.PI * 10) * 0.009 + noise * 0.003;
      if (site.id === 'BESS-JODHUR' && progress > 0.72 && progress < 0.76) value -= 0.1;
    } else {
      const dailyCycle = Math.sin((timestamp / DAY) * Math.PI * 2);
      const variation = Math.min(5, site.capacityMW * 0.3);
      value = currentPower * 0.72 + dailyCycle * variation + noise * 0.8;
    }

    function downloadSeries(series, siteName, signal, extension = 'csv') {
      const header = ['Timestamp', 'Asset', 'Signal', 'Value', 'Unit'];
      const rows = series.map((point) => [new Date(point.timestamp).toISOString(), siteName, signal.label, point.value, signal.unit]);
      const body = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
      const content = extension === 'xls'
        ? `<table><thead><tr>${header.map((value) => `<th>${value}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value) => `<td>${String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        : `\uFEFF${body}\r\n`;
      const blob = new Blob([content], { type: extension === 'xls' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${signal.shortLabel.toLowerCase()}-history.${extension}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    return {
      timestamp,
      time: formatTimestamp(timestamp, range),
      value: Number(value.toFixed(signalOptions[signal].digits)),
    };
  });
}

export default function HistoricalTrends() {
  const { selectedSite } = useDemoData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [range, setRange] = useState('24h');
  const [signal, setSignal] = useState('temperature');
  const [resolution, setResolution] = useState('5m');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackCount, setPlaybackCount] = useState(null);
  const selectedRange = rangeOptions[range];
  const selectedSignal = signalOptions[signal];
  const selectedResolution = selectedRange.resolutions.some((item) => item.value === resolution)
    ? resolution
    : selectedRange.resolutions[0].value;
  const selectedSeries = useMemo(
    () => generateSeries({ site: selectedSite, signal, range, resolution: selectedResolution }),
    [selectedSite, signal, range, selectedResolution],
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
  const assetPath = signal === 'power' ? `${siteName} / PCS` : `${siteName} / C1-R2-M4-C07`;
  const tickInterval = Math.max(0, Math.floor(selectedSeries.length / 7) - 1);

  const changeRange = (nextRange) => {
    setRange(nextRange);
    setResolution(rangeOptions[nextRange].resolutions[0].value);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (playbackCount >= selectedSeries.length) setPlaybackCount(1);
    setIsPlaying(true);
  };

  const exportSeries = (extension) => downloadSeries(visibleSeries, siteName, selectedSignal, extension);

  return (
    <PageFrame title="Historical Trends" description="Explore site telemetry over selectable time windows and sampling resolutions.">
      <div className="surface-card flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900">
        <div className="min-w-[220px] flex-1">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Selected asset</span>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs dark:border-slate-700">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">{assetPath}</span>
          </div>
        </div>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span className="mb-1.5 block">Signal</span>
          <select value={signal} onChange={(event) => setSignal(event.target.value)} className="min-w-40 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200">
            {Object.entries(signalOptions).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span className="mb-1.5 block">Time range</span>
          <select value={range} onChange={(event) => changeRange(event.target.value)} className="min-w-32 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200">
            {Object.keys(rangeOptions).map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span className="mb-1.5 block">Resolution</span>
          <select value={selectedResolution} onChange={(event) => setResolution(event.target.value)} className="min-w-24 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200">
            {selectedRange.resolutions.map((option) => <option key={option.value} value={option.value}>{option.value}</option>)}
          </select>
        </label>
      </div>

      <ChartCard
        title={`${selectedSignal.label} · ${range}`}
        subtitle={`${siteName} · ${selectedRange.label} · ${selectedResolution} samples · ${selectedSeries.length.toLocaleString()} points`}
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
              formatter={(value) => [`${Number(value).toFixed(selectedSignal.digits)} ${selectedSignal.unit}`, selectedSignal.shortLabel]}
            />
            {signal === 'temperature' && selectedSite?.id === 'BESS-JODHUR' && <ReferenceLine y={45} stroke="#ef4444" strokeDasharray="5 4" label={{ value: 'Review threshold', fill: '#ef4444', fontSize: 10 }} />}
            <Area type="monotone" dataKey="value" name={selectedSignal.shortLabel} stroke={selectedSignal.color} fill="url(#trendFill)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-xs text-cyan-900 dark:text-cyan-200">
        <span className="flex items-center gap-2"><Activity className="h-4 w-4 shrink-0" />Range and resolution control the sample window and point count; displayed retention target is 3 years.</span>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={() => exportSeries('csv')}>Export CSV</Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={() => exportSeries('xls')}>Export Excel-compatible</Button>
          <Button variant="primary" size="sm" icon={isPlaying ? Pause : Play} onClick={togglePlayback}>{isPlaying ? 'Pause playback' : playbackCount < selectedSeries.length ? 'Resume playback' : 'Play playback'}</Button>
        </div>
      </div>
    </PageFrame>
  );
}
