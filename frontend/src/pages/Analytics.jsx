import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageFrame from '../components/ui/PageFrame';
import ChartCard from '../components/ChartCard';
import { useDemoData } from '../hooks/useDemoData';
import { Activity, Gauge, TrendingDown, Zap } from 'lucide-react';

const trend = [
  { month: 'Apr', availability: 99.1, rte: 93.8, throughput: 1180 },
  { month: 'May', availability: 99.3, rte: 93.6, throughput: 1240 },
  { month: 'Jun', availability: 98.8, rte: 93.2, throughput: 1110 },
  { month: 'Jul', availability: 99.0, rte: 93.4, throughput: 1290 },
  { month: 'Aug', availability: 98.7, rte: 92.9, throughput: 1220 },
  { month: 'Sep', availability: 98.7, rte: 92.7, throughput: 1260 },
];

export default function Analytics() {
  const { accessibleSites } = useDemoData();
  const average = (key) => accessibleSites.length
    ? accessibleSites.reduce((sum, site) => sum + site[key], 0) / accessibleSites.length
    : 0;
  const throughput = accessibleSites.reduce((sum, site) => sum + site.energyTodayMWh, 0);
  const benchmark = [...accessibleSites]
    .sort((a, b) => b.healthIndex - a.healthIndex)
    .map((site) => ({ site: site.id.replace('BESS-', ''), availability: site.availability, soh: site.soh, rte: site.roundTripEfficiency }));
  const metrics = [
    ['Availability', `${average('availability').toFixed(1)}%`, Activity],
    ['Round-trip efficiency', `${average('roundTripEfficiency').toFixed(1)}%`, Gauge],
    ['Energy throughput · today', `${throughput.toFixed(1)} MWh`, Zap],
    ['SOH degradation', `${(average('soh') - 100).toFixed(1)}%`, TrendingDown],
  ];
  return (
    <PageFrame title="Analytics & Asset Performance" description="Site performance, benchmarking, degradation and operational trend analysis.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon]) => <div key={label} className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><Icon className="h-5 w-5 text-cyan-500" /><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p></div>)}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Site performance trend" subtitle="Availability and round-trip efficiency">
          <ResponsiveContainer width="100%" height={280}><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis domain={[90, 100]} /><Tooltip /><Legend /><Line type="monotone" dataKey="availability" stroke="#06b6d4" strokeWidth={2} /><Line type="monotone" dataKey="rte" stroke="#10b981" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Site benchmarking" subtitle="Compare health and operating performance">
          <ResponsiveContainer width="100%" height={280}><BarChart data={benchmark}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="site" /><YAxis domain={[70, 102]} /><Tooltip /><Legend /><Bar dataKey="availability" fill="#06b6d4" radius={[4, 4, 0, 0]} /><Bar dataKey="soh" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Energy throughput" subtitle="Site charged and discharged energy by month">
        <ResponsiveContainer width="100%" height={260}><BarChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="throughput" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
      </ChartCard>
    </PageFrame>
  );
}
