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

export default function AlarmManagement() {
  const [searchParams] = useSearchParams();
  const {
    selectedSite,
    alarms,
    events,
    acknowledgeAlarm,
    createWorkOrderFromAlarm,
  } = useDemoData();
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState(() => searchParams.get('query') || '');

  const visible = useMemo(() => alarms.filter((alarm) => {
    const matchesFilter = filter === 'All' || alarm.priority === filter || alarm.state === filter;
    const haystack = `${alarm.title} ${alarm.description} ${alarm.id} ${alarm.equipment || ''}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase());
  }), [alarms, filter, query]);
  const siteEvents = useMemo(
    () => events.filter((event) => event.siteId === selectedSite?.id),
    [events, selectedSite],
  );

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
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {alarms.filter((alarm) => alarm.priority === value).length}
            </p>
          </button>
        ))}
      </div>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Site alarms">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex w-full max-w-[235px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="sr-only">Search site alarms</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alarms..." className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" />
          </label>
          <select aria-label="Filter alarms by status or priority" value={filter} onChange={(event) => setFilter(event.target.value)} className="min-w-[130px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900">
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Acknowledged">Acknowledged</option>
              {severityFilters.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
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
                      <Link to={`/site/${alarm.siteId}`} className="text-xs font-bold text-cyan-700 dark:text-cyan-300">{alarm.siteId}</Link>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{alarm.title}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${style.badge}`}>{alarm.priority}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{alarm.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-400">{alarm.id} · {alarm.state}{alarm.equipment ? ` · ${alarm.equipment}` : ''}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {alarm.state === 'Active' && <Button size="sm" variant="success" icon={Check} onClick={() => acknowledgeAlarm(alarm.id)}>Acknowledge</Button>}
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
