import React, { useEffect, useMemo, useState } from 'react';
import PageFrame from '../components/ui/PageFrame';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useDemoData } from '../hooks/useDemoData';
import { Activity, ArrowDown, ArrowUp, Battery, Bell, Check, Gauge, LayoutDashboard, Plus, RotateCcw, Save, Zap } from 'lucide-react';

const widgets = [
  { id: 'fleet-health', label: 'Fleet health', icon: Battery, value: (sites) => `${(sites.reduce((sum, site) => sum + site.soh, 0) / Math.max(sites.length, 1)).toFixed(1)}%`, note: 'Mean state of health' },
  { id: 'availability', label: 'Availability', icon: Gauge, value: (sites) => `${(sites.reduce((sum, site) => sum + site.availability, 0) / Math.max(sites.length, 1)).toFixed(1)}%`, note: 'Fleet average' },
  { id: 'active-power', label: 'Active power', icon: Zap, value: (sites) => `${sites.reduce((sum, site) => sum + site.powerMW, 0).toFixed(1)} MW`, note: 'Net fleet output' },
  { id: 'alarms', label: 'Active alarms', icon: Bell, value: (_, alarms) => alarms.filter((alarm) => alarm.state === 'Active').length, note: 'Across accessible sites' },
  { id: 'efficiency', label: 'Round-trip efficiency', icon: Activity, value: (sites) => `${(sites.reduce((sum, site) => sum + site.roundTripEfficiency, 0) / Math.max(sites.length, 1)).toFixed(1)}%`, note: 'Fleet average' },
];
const initialKpis = [];

function loadConfig(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    return { widgetIds: parsed.widgetIds || ['fleet-health', 'availability', 'active-power', 'alarms'], kpis: parsed.kpis || initialKpis };
  } catch {
    return { widgetIds: ['fleet-health', 'availability', 'active-power', 'alarms'], kpis: initialKpis };
  }
}

export default function DashboardStudio() {
  const { user } = useAuth();
  const { accessibleSites, accessibleAlarms, workOrders } = useDemoData();
  const role = user?.role || 'Control Room Operator';
  const storageKey = `bess-dashboard-config:${role}`;
  const [config, setConfig] = useState(() => loadConfig(storageKey));
  const [saved, setSaved] = useState(false);
  const [kpiForm, setKpiForm] = useState({ name: '', metric: 'soh', operator: '<', threshold: '90' });
  const metricValues = useMemo(() => ({
    soh: accessibleSites.length ? accessibleSites.reduce((sum, site) => sum + site.soh, 0) / accessibleSites.length : 0,
    availability: accessibleSites.length ? accessibleSites.reduce((sum, site) => sum + site.availability, 0) / accessibleSites.length : 0,
    temperature: accessibleSites.length ? Math.max(...accessibleSites.map((site) => site.temperature)) : 0,
    alarms: accessibleAlarms.filter((alarm) => alarm.state === 'Active').length,
    soc: accessibleSites.length ? accessibleSites.reduce((sum, site) => sum + site.soc, 0) / accessibleSites.length : 0,
    efficiency: accessibleSites.length ? accessibleSites.reduce((sum, site) => sum + site.roundTripEfficiency, 0) / accessibleSites.length : 0,
    throughput: accessibleSites.reduce((sum, site) => sum + site.energyTodayMWh, 0),
    openWorkOrders: workOrders.filter((item) => item.status !== 'Done').length,
    overdueWorkOrders: workOrders.filter((item) => item.status !== 'Done' && item.dueDate && new Date(`${item.dueDate}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0))).length,
  }), [accessibleSites, accessibleAlarms, workOrders]);

  useEffect(() => { setConfig(loadConfig(storageKey)); setSaved(false); }, [storageKey]);
  const moveWidget = (index, direction) => setConfig((current) => {
    const next = [...current.widgetIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, widgetIds: next };
  });
  const toggleWidget = (id) => setConfig((current) => ({ ...current, widgetIds: current.widgetIds.includes(id) ? current.widgetIds.filter((item) => item !== id) : [...current.widgetIds, id] }));
  const save = () => { localStorage.setItem(storageKey, JSON.stringify(config)); setSaved(true); };
  const addKpi = (event) => {
    event.preventDefault();
    if (!kpiForm.name.trim()) return;
    setConfig((current) => ({ ...current, kpis: [...current.kpis, { ...kpiForm, id: `kpi-${Date.now()}`, threshold: Number(kpiForm.threshold) }] }));
    setKpiForm((current) => ({ ...current, name: '' }));
  };
  const reset = () => { const next = loadConfig(''); setConfig(next); localStorage.removeItem(storageKey); setSaved(true); };
  const kpiLabels = { soh: 'Fleet SOH (%)', availability: 'Fleet availability (%)', temperature: 'Maximum site temperature (°C)', alarms: 'Fleet active alarm count', soc: 'Fleet average SOC (%)', efficiency: 'Fleet round-trip efficiency (%)', throughput: 'Fleet energy delivered today (MWh)', openWorkOrders: 'Selected site open work orders', overdueWorkOrders: 'Selected site overdue work orders' };
  const formatKpiValue = (value, metric) => {
    const count = ['alarms', 'openWorkOrders', 'overdueWorkOrders'].includes(metric);
    const unit = { soh: '%', availability: '%', temperature: '°C', soc: '%', efficiency: '%', throughput: 'MWh' }[metric];
    return `${Number(value).toFixed(count ? 0 : 1)}${unit ? ` ${unit}` : ''}`;
  };

  return <PageFrame title="Dashboard Studio" description="Choose and arrange dashboard widgets, then save a role-specific view. Changes are stored in this browser for the demo.">
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
      <section className="surface-card min-w-0 rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-bold"><LayoutDashboard className="h-4 w-4 text-cyan-500" />{role} dashboard preview</h2><p className="mt-1 text-xs text-slate-500">Drag-free ordering controls keep the demo usable on small screens.</p></div><span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">Role view</span></div>
        <div className="grid gap-3 sm:grid-cols-2">{config.widgetIds.map((id, index) => { const widget = widgets.find((item) => item.id === id); if (!widget) return null; const Icon = widget.icon; return <article key={id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2 text-xs font-semibold"><Icon className="h-4 w-4 text-cyan-500" />{widget.label}</div><div className="flex gap-1"><button type="button" aria-label={`Move ${widget.label} up`} onClick={() => moveWidget(index, -1)} disabled={index === 0} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" aria-label={`Move ${widget.label} down`} onClick={() => moveWidget(index, 1)} disabled={index === config.widgetIds.length - 1} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"><ArrowDown className="h-3.5 w-3.5" /></button></div></div><p className="mt-4 text-2xl font-bold tabular-nums">{widget.value(accessibleSites, accessibleAlarms)}</p><p className="mt-1 text-[10px] text-slate-500">{widget.note}</p></article>; })}
          {config.kpis.map((kpi) => { const value = metricValues[kpi.metric] ?? 0; const met = kpi.operator === '<' ? value < kpi.threshold : kpi.operator === '>' ? value > kpi.threshold : value === kpi.threshold; return <article key={kpi.id} className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{kpi.name}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${met ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>{met ? 'Threshold met' : 'Within range'}</span></div><p className="mt-4 text-2xl font-bold">{formatKpiValue(value, kpi.metric)}</p><p className="mt-1 text-[10px] text-slate-500">{kpiLabels[kpi.metric]} {kpi.operator} {kpi.threshold}</p><button type="button" onClick={() => setConfig((current) => ({ ...current, kpis: current.kpis.filter((item) => item.id !== kpi.id) }))} className="mt-2 text-[10px] font-semibold text-rose-600">Remove KPI</button></article>; })}
        </div>
        <div className="mt-5 flex flex-wrap gap-2"><Button variant="primary" icon={Save} onClick={save}>Save role dashboard</Button><Button variant="secondary" icon={RotateCcw} onClick={reset}>Reset</Button>{saved && <p role="status" className="self-center text-xs text-emerald-700 dark:text-emerald-300"><Check className="mr-1 inline h-3.5 w-3.5" />Saved for {role}</p>}</div>
      </section>
      <div className="space-y-6">
        <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="text-sm font-bold">Available widgets</h2><p className="mt-1 text-xs text-slate-500">Select the operational indicators shown in this role’s preview.</p><div className="mt-4 space-y-2">{widgets.map((widget) => <label key={widget.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-xs dark:border-slate-800"><input type="checkbox" checked={config.widgetIds.includes(widget.id)} onChange={() => toggleWidget(widget.id)} className="accent-cyan-600" />{widget.label}</label>)}</div></section>
        <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-cyan-500" />Custom KPI</h2><p className="mt-1 text-xs text-slate-500">Create a fleet metric with an operator and threshold.</p><form onSubmit={addKpi} className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">KPI name<input required value={kpiForm.name} onChange={(event) => setKpiForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. SOH review trigger" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Metric<select value={kpiForm.metric} onChange={(event) => setKpiForm((current) => ({ ...current, metric: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700">{Object.entries(kpiLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Condition<select value={kpiForm.operator} onChange={(event) => setKpiForm((current) => ({ ...current, operator: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700"><option value="&lt;">Less than</option><option value="&gt;">Greater than</option><option value="=">Equal to</option></select></label><label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Threshold<input required type="number" step="any" value={kpiForm.threshold} onChange={(event) => setKpiForm((current) => ({ ...current, threshold: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label><Button className="sm:col-span-2" type="submit" variant="secondary">Add KPI to preview</Button></form></section>
      </div>
    </div>
    <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[10px] leading-5 text-slate-600 dark:text-slate-300">Demo configuration is saved locally in this browser. It does not change production dashboards or enforce role permissions.</p>
  </PageFrame>;
}
