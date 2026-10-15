import React, { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageFrame from '../components/ui/PageFrame';
import ChartCard from '../components/ChartCard';
import { Activity, Play, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';

const series = Array.from({ length: 24 }, (_, index) => ({ hour: `${String(index).padStart(2, '0')}:00`, temperature: +(29 + Math.sin(index / 3) * 2 + (index === 14 ? 8 : 0)).toFixed(1), voltage: +(3.30 + Math.cos(index / 4) * 0.012).toFixed(3), power: +(Math.sin(index / 2.6) * 9).toFixed(1) }));

export default function HistoricalTrends() {
  const { selectedSite } = useDemoData();
  const [range, setRange] = useState('24h');
  const [signal, setSignal] = useState('temperature');
  const selected = useMemo(() => series, []);
  return (
    <PageFrame title="Historical Trends" description="Explore synthetic time-series data across the supported RFP resolutions and time ranges.">
      <div className="surface-card flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-slate-900">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700"><Search className="h-4 w-4 text-slate-400" /> {selectedSite?.id || 'Selected site'} / C1-R2-M4-C07</div>
        <select value={signal} onChange={(event) => setSignal(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs dark:border-slate-700"><option value="temperature">Cell temperature</option><option value="voltage">Cell voltage</option><option value="power">Site power</option></select>
        <select value={range} onChange={(event) => setRange(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs dark:border-slate-700"><option>Live</option><option>1h</option><option>24h</option><option>7d</option><option>30d</option><option>1y</option></select>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Resolution: 1 minute</span>
      </div>
      <ChartCard title={`${signal} trend · ${range}`} subtitle="Synthetic historical playback data">
        <ResponsiveContainer width="100%" height={360}><AreaChart data={selected}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="hour" interval={2} /><YAxis /><Tooltip /><Legend /><Area type="monotone" dataKey={signal} stroke="#06b6d4" fill="url(#trendFill)" strokeWidth={2} /></AreaChart></ResponsiveContainer>
      </ChartCard>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-xs text-cyan-800 dark:text-cyan-200"><span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Minimum retention target: 3 years · available resolutions: 1s, 10s, 1m, 5m, hourly, daily, monthly, yearly.</span><Button variant="primary" size="sm" icon={Play}>Playback</Button></div>
    </PageFrame>
  );
}
