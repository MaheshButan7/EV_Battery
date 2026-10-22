import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertOctagon, Check, ClipboardPlus, History, Search } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { getAlarmPriorityStyle } from '../utils/formatters';
import Button from '../components/ui/Button';

const severityFilters = [
  { label: 'Critical', value: 'Critical' },
  { label: 'Major', value: 'Major' },
  { label: 'Minor', value: 'Minor' },
  { label: 'Warning', value: 'Warning' },
  { label: 'Information', value: 'Info' },
];

const demoReferenceTime = new Date('2026-10-21T12:00:00.000Z').getTime();
const timeRanges = [
  { label: 'Last 24 hours', value: '24h', duration: 24 * 60 * 60 * 1000 },
  { label: 'Last 7 days', value: '7d', duration: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Last 30 days', value: '30d', duration: 30 * 24 * 60 * 60 * 1000 },
  { label: 'All time', value: 'all', duration: Infinity },
];

function formatAlarmTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AlarmManagement() {
  const [searchParams] = useSearchParams();
  const {
    selectedSite,
    alarms,
    events,
    acknowledgeAlarm,
    shelveAlarm,
    suppressAlarm,
    escalateAlarm,
    correlateAlarm,
    updateAlarmState,
    createWorkOrderFromAlarm,
  } = useDemoData();
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('7d');
  const [query, setQuery] = useState(() => searchParams.get('query') || '');

  const visible = useMemo(() => alarms.filter((alarm) => {
    const matchesPriority = filter === 'All' || alarm.priority === filter;
    const matchesStatus = statusFilter === 'All' || alarm.state === statusFilter;
    const range = timeRanges.find((item) => item.value === timeRange) || timeRanges[1];
    const timestamp = new Date(alarm.timestamp).getTime();
    const matchesTime = range.value === 'all' || (!Number.isNaN(timestamp) && timestamp >= demoReferenceTime - range.duration && timestamp <= demoReferenceTime);
    const haystack = `${alarm.title} ${alarm.description} ${alarm.id} ${alarm.equipment || ''}`.toLowerCase();
    return matchesPriority && matchesStatus && matchesTime && haystack.includes(query.toLowerCase());
  }), [alarms, filter, query, statusFilter, timeRange]);
  const siteEvents = useMemo(
    () => events.filter((event) => event.siteId === selectedSite?.id),
    [events, selectedSite],
  );
  const alarmKpis = useMemo(() => {
    const acknowledgementTimes = alarms.filter((alarm) => alarm.acknowledgedAt).map((alarm) => Math.max(1, Math.round((new Date(alarm.acknowledgedAt) - new Date(alarm.timestamp)) / 60000)));
    const titles = alarms.reduce((counts, alarm) => ({ ...counts, [alarm.title]: (counts[alarm.title] || 0) + 1 }), {});
    return {
      active: alarms.filter((alarm) => alarm.state === 'Active').length,
      meanAck: acknowledgementTimes.length ? Math.round(acknowledgementTimes.reduce((sum, value) => sum + value, 0) / acknowledgementTimes.length) : 4,
      meanClear: 38,
      repeats: Object.values(titles).filter((count) => count > 1).length,
    };
  }, [alarms]);

  return (
    <PageFrame
      title="Alarm & Event Management"
      description={`${selectedSite?.name || 'Selected site'} alarms, operator actions and event history.`}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5" aria-label="Filter alarms by priority">
        {severityFilters.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(filter === value ? 'All' : value)}
            className={`surface-card rounded-2xl border bg-white p-5 text-left transition-colors dark:bg-slate-900 ${filter === value ? 'border-cyan-400 ring-2 ring-cyan-500/15' : 'border-slate-200 dark:border-slate-800'}`}
          >
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label} alerts</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {alarms.filter((alarm) => alarm.priority === value).length}
            </p>
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Alarm performance indicators">
        {[
          ['Active alarms', alarmKpis.active, 'Current selected site'],
          ['Mean acknowledge time', `${alarmKpis.meanAck} min`, 'Illustrative demo KPI'],
          ['Mean clear time', `${alarmKpis.meanClear} min`, 'Illustrative demo KPI'],
          ['Repeated patterns', alarmKpis.repeats, 'Alarm titles seen more than once'],
        ].map(([label, value, detail]) => <div key={label} className="surface-card rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold tabular-nums">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>)}
      </section>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Site alarms">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,190px))]">
          <label className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="sr-only">Search site alarms</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alarms..." className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" />
          </label>
          <select aria-label="Filter alarms by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900">
            <option value="All">All statuses</option>
            {['Active', 'Acknowledged', 'Shelved', 'Suppressed', 'Escalated'].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select aria-label="Filter alarms by severity" value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900">
            <option value="All">All severities</option>
            {severityFilters.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Filter alarms by time range" value={timeRange} onChange={(event) => setTimeRange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900">
            {timeRanges.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {visible.map((alarm) => {
            const style = getAlarmPriorityStyle(alarm.priority);
            return (
              <div key={alarm.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between md:px-5">
                <div className="flex min-w-0 items-start gap-3">
                  <AlertOctagon className={`mt-0.5 h-5 w-5 shrink-0 ${style.text || 'text-rose-500'}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/site/${alarm.siteId}`} className="text-xs font-bold text-cyan-700 dark:text-cyan-300">{selectedSite?.name || alarm.siteId}</Link>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{alarm.title}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}>{alarm.priority}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{alarm.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">{alarm.id} · {alarm.state} · {formatAlarmTime(alarm.timestamp)}{alarm.equipment ? ` · ${alarm.equipment}` : ''}{alarm.updatedBy ? ` · Owner: ${alarm.updatedBy}` : ''}</p>
                    {alarm.shelvedUntil && <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">Shelved until {formatAlarmTime(alarm.shelvedUntil)}</p>}
                    {alarm.suppressionReason && <p className="mt-1 text-[10px] text-slate-500">Suppression reason: {alarm.suppressionReason}</p>}
                    {alarm.escalatedTo && <p className="mt-1 text-[10px] text-rose-600 dark:text-rose-300">Escalated to {alarm.escalatedTo}</p>}
                    {alarm.correlatedTo && <p className="mt-1 text-[10px] text-violet-600 dark:text-violet-300">Correlated with {alarm.correlatedTo}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {alarm.state === 'Active' && <Button size="sm" variant="success" icon={Check} onClick={() => acknowledgeAlarm(alarm.id)}>Acknowledge</Button>}
                  {!['Cleared', 'Shelved'].includes(alarm.state) && <Button size="sm" variant="secondary" onClick={() => shelveAlarm(alarm.id, 60)}>Shelve 1h</Button>}
                  {!['Cleared', 'Suppressed'].includes(alarm.state) && <Button size="sm" variant="secondary" onClick={() => suppressAlarm(alarm.id, 'Suppressed for operator investigation')}>Suppress</Button>}
                  {!['Cleared', 'Escalated'].includes(alarm.state) && <Button size="sm" variant="secondary" onClick={() => escalateAlarm(alarm.id, 'Reliability Manager')}>Escalate</Button>}
                  {alarm.state !== 'Cleared' && <Button size="sm" variant="subtle" onClick={() => updateAlarmState(alarm.id, 'Cleared')}>Clear</Button>}
                  {!alarm.correlatedTo && alarms.length > 1 && <select aria-label={`Correlate ${alarm.id} with another alarm`} defaultValue="" onChange={(event) => { if (event.target.value) correlateAlarm(alarm.id, event.target.value); }} className="max-w-36 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] dark:border-slate-700 dark:bg-slate-900"><option value="">Correlate…</option>{alarms.filter((item) => item.id !== alarm.id && !item.correlatedTo).map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select>}
                  {alarm.workOrderId ? (
                    <Button size="sm" variant="subtle" icon={ClipboardPlus} disabled title={`Work order ${alarm.workOrderId} is already linked`}>Work order added</Button>
                  ) : (
                    <Button size="sm" variant="subtle" icon={ClipboardPlus} onClick={() => createWorkOrderFromAlarm(alarm.id)}>Work order</Button>
                  )}
                </div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No alarms match this view</p>
              <p className="mt-1 text-xs text-slate-500">Try another priority, status or search term.</p>
            </div>
          )}
        </div>
      </section>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Selected site event history">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><History className="h-4 w-4 text-cyan-500" />{selectedSite?.name || 'Site'} event history</h2>
        <div className="mt-3 space-y-2">
          {siteEvents.length === 0 ? (
            <p className="text-xs text-slate-500">No operator actions recorded for this site yet.</p>
          ) : siteEvents.slice(0, 8).map((event) => (
            <div key={event.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 text-xs dark:border-slate-800">
              <span>{event.type}{event.alarmId ? ` · ${event.alarmId}` : event.workOrderId ? ` · ${event.workOrderId}` : ''}</span>
              <span className="font-mono text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
