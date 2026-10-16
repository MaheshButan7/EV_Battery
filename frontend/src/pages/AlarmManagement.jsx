import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { AlertOctagon, Check, ClipboardPlus, History, Search, ShieldAlert, Timer, TrendingUp } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { getAlarmPriorityStyle } from '../utils/formatters';
import Button from '../components/ui/Button';

export default function AlarmManagement() {
  const [searchParams] = useSearchParams();
  const {
    alarms,
    accessibleAlarms,
    events,
    acknowledgeAlarm,
    createWorkOrderFromAlarm,
    shelveAlarm,
    suppressAlarm,
    escalateAlarm,
    correlateAlarm,
  } = useDemoData();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const visible = useMemo(() => accessibleAlarms.filter((alarm) => {
    const matchesFilter = filter === 'All' || alarm.priority === filter || alarm.state === filter;
    const haystack = `${alarm.siteId} ${alarm.title} ${alarm.description}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [accessibleAlarms, filter, query]);

  const activeCount = accessibleAlarms.filter((alarm) => alarm.state === 'Active').length;
  const acknowledgedCount = accessibleAlarms.filter((alarm) => alarm.state === 'Acknowledged').length;
  const criticalCount = accessibleAlarms.filter((alarm) => alarm.priority === 'Critical').length;
  const correlationParent = alarms.find((item) => item.id !== visible[0]?.id && item.siteId === visible[0]?.siteId);
  const sourceCounts = accessibleAlarms.reduce((counts, alarm) => {
    const source = alarm.equipment?.split('-')[0] || 'Unknown';
    counts[source] = (counts[source] || 0) + 1;
    return counts;
  }, {});

  return (
    <PageFrame title="Alarm & Event Management" description="Prioritize, acknowledge and route operational alarms across all BESS sites.">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {['Critical', 'Major', 'Minor', 'Warning', 'Information'].map((severity) => (
          <button key={severity} type="button" aria-pressed={filter === (severity === 'Information' ? 'Info' : severity)} onClick={() => setFilter(severity === 'Information' ? 'Info' : severity)} className={`surface-card rounded-2xl border bg-white p-4 text-left transition-all dark:bg-slate-900 ${filter === (severity === 'Information' ? 'Info' : severity) ? 'border-cyan-400 ring-2 ring-cyan-500/15' : ''}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{severity}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{alarms.filter((alarm) => alarm.priority === (severity === 'Information' ? 'Info' : severity)).length}</p>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Active alarms', activeCount, ShieldAlert],
          ['Acknowledged', acknowledgedCount, Check],
          ['Critical exposure', criticalCount, TrendingUp],
        ].map(([label, value, Icon]) => <div key={label} className="surface-card flex items-center gap-3 rounded-xl border bg-white p-4 dark:bg-slate-900"><Icon className="h-5 w-5 text-cyan-500" /><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p></div></div>)}
      </div>
      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Alarm analytics</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-[10px] uppercase text-slate-500">Acknowledgement rate</p><p className="mt-1 text-lg font-bold">{accessibleAlarms.length ? Math.round((acknowledgedCount / accessibleAlarms.length) * 100) : 0}%</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-[10px] uppercase text-slate-500">Active exposure</p><p className="mt-1 text-lg font-bold">{activeCount} alarms</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-[10px] uppercase text-slate-500">Top source</p><p className="mt-1 text-lg font-bold">{Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}</p></div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-[10px] uppercase text-slate-500">Correlated</p><p className="mt-1 text-lg font-bold">{accessibleAlarms.filter((alarm) => alarm.correlatedTo).length}</p></div>
        </div>
      </section>
      <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alarms…" className="bg-transparent text-xs outline-none placeholder:text-slate-400" />
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs dark:border-slate-700">
            <option>All</option><option>Active</option><option>Acknowledged</option><option>Critical</option><option>Major</option><option>Warning</option>
          </select>
        </div>
        <div className="space-y-3">
          {visible.map((alarm) => {
            const style = getAlarmPriorityStyle(alarm.priority);
            return (
              <div key={alarm.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <AlertOctagon className={`mt-0.5 h-5 w-5 shrink-0 ${style.text || 'text-rose-500'}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/site/${alarm.siteId}`} className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{alarm.siteId}</Link>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{alarm.title}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}>{alarm.priority}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{alarm.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">{alarm.id} · {alarm.state}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {alarm.state === 'Active' && <Button size="sm" variant="success" icon={Check} onClick={() => acknowledgeAlarm(alarm.id)}>Acknowledge</Button>}
                  {alarm.state === 'Active' && <Button size="sm" variant="secondary" icon={Timer} onClick={() => shelveAlarm(alarm.id)}>Shelve 1h</Button>}
                  {alarm.state === 'Active' && <Button size="sm" variant="secondary" icon={ShieldAlert} onClick={() => suppressAlarm(alarm.id)}>Suppress</Button>}
                  {alarm.state !== 'Escalated' && <Button size="sm" variant="secondary" onClick={() => escalateAlarm(alarm.id)}>Escalate</Button>}
                  {correlationParent && <Button size="sm" variant="ghost" onClick={() => correlateAlarm(alarm.id, correlationParent.id)}>Correlate</Button>}
                  <Button size="sm" variant="subtle" icon={ClipboardPlus} onClick={() => createWorkOrderFromAlarm(alarm.id)}>{alarm.workOrderId || 'Work order'}</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><History className="h-4 w-4 text-cyan-500" /> Session event history</h2>
        <div className="mt-3 space-y-2">
          {events.length === 0 ? <p className="text-xs text-slate-500">No operator actions recorded yet.</p> : events.slice(0, 8).map((event) => <div key={event.id} className="flex justify-between border-b border-slate-100 py-2 text-xs dark:border-slate-800"><span>{event.type} · {event.alarmId || event.workOrderId}</span><span className="font-mono text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span></div>)}
        </div>
      </div>
    </PageFrame>
  );
}
