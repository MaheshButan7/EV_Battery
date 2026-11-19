import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  ClipboardPlus,
  Clock3,
  History,
  MoreVertical,
  Search,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';
import { getAlarmPriorityStyle } from '../utils/formatters';
import { getDemoNow } from '../config';

const severityFilters = [
  { label: 'Critical', value: 'Critical' },
  { label: 'Major', value: 'Major' },
  { label: 'Warning', value: 'Warning' },
  { label: 'Minor', value: 'Minor' },
  { label: 'Info', value: 'Info' },
];

const timeRanges = [
  { label: 'Past 24 hours', value: '24h', duration: 24 * 60 * 60 * 1000 },
  { label: 'Past 7 days', value: '7d', duration: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Past 30 days', value: '30d', duration: 30 * 24 * 60 * 60 * 1000 },
  { label: 'All time', value: 'all', duration: Infinity },
];

function formatAlarmTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusTone(state) {
  return {
    Active: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    Acknowledged: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    Shelved: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    Suppressed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    Escalated: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    Cleared: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  }[state] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

export default function AlarmManagement() {
  const [searchParams] = useSearchParams();
  const {
    accessibleSites,
    accessibleAlarms,
    events,
    acknowledgeAlarm,
    shelveAlarm,
    suppressAlarm,
    escalateAlarm,
    updateAlarmState,
    createWorkOrderFromAlarm,
  } = useDemoData();
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedAlarmId, setSelectedAlarmId] = useState(null);
  const [notice, setNotice] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState(null);
  const [componentFilter, setComponentFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('7d');
  const alarms = accessibleAlarms;

  const visible = useMemo(() => alarms.filter((alarm) => {
    const range = timeRanges.find((item) => item.value === timeRange) || timeRanges[1];
    const timestamp = new Date(alarm.timestamp).getTime();
    const matchesTime = range.value === 'all'
      || (!Number.isNaN(timestamp) && timestamp >= getDemoNow().getTime() - range.duration && timestamp <= getDemoNow().getTime());
    const matchesStatus = statusFilter === 'All'
      || (statusFilter === 'Open' ? alarm.state !== 'Cleared' : alarm.state === statusFilter);
    const matchesSite = siteFilter === 'All' || alarm.siteId === siteFilter;
    const haystack = `${alarm.title} ${alarm.description} ${alarm.id} ${alarm.equipment || ''}`.toLowerCase();
    const componentName = alarm.equipment || 'Site alarm';
    const matchesComponent = componentFilter === 'All' || componentName === componentFilter;
    return matchesStatus
      && matchesSite
      && (severityFilter === 'All' || alarm.priority === severityFilter)
      && matchesTime
      && matchesComponent
      && haystack.includes(query.toLowerCase());
  }), [alarms, componentFilter, query, severityFilter, siteFilter, statusFilter, timeRange]);

  const selectedAlarm = visible.find((alarm) => alarm.id === selectedAlarmId) || null;
  const alarmSite = selectedAlarm ? accessibleSites.find((site) => site.id === selectedAlarm.siteId) : null;
  const siteEvents = useMemo(
    () => events.filter((event) => siteFilter === 'All' || event.siteId === (alarmSite?.id || siteFilter)),
    [alarmSite, events, siteFilter],
  );
  const scopedAlarms = alarms.filter((alarm) => siteFilter === 'All' || alarm.siteId === siteFilter);
  const componentOptions = useMemo(() => [...new Set(scopedAlarms.map((alarm) => alarm.equipment || 'Site alarm'))], [scopedAlarms]);

  const runAction = (message, action) => {
    action();
    setNotice(message);
  };

  useEffect(() => {
    if (!selectedAlarmId) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedAlarmId(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedAlarmId]);

  useEffect(() => {
    if (!openActionId) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenActionId(null);
        setActionMenuPosition(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [openActionId]);

  return (
    <PageFrame
      title="Alarm & Event Management"
      description="Triage the open alarm queue, record the operator response, and follow the event history."
    >
      <section className="surface-card overflow-visible rounded-2xl border bg-white dark:bg-slate-900" aria-label="Alarm and event queue">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
          <label className="flex min-w-[220px] flex-[1_1_240px] items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="sr-only">Search alarm queue</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alarms, events or components" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" />
          </label>
          <select aria-label="Filter alarms by site" value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)} className="min-w-[125px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
            <option value="All">All sites</option>
            {accessibleSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
          <select aria-label="Filter alarms by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-w-[125px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
            <option value="Open">Open only</option>
            <option value="All">All statuses</option>
            {['Active', 'Acknowledged', 'Shelved', 'Suppressed', 'Escalated', 'Cleared'].map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select aria-label="Filter alarms by severity" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="min-w-[125px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
            <option value="All">All severities</option>
            {severityFilters.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Filter alarms by component" value={componentFilter} onChange={(event) => setComponentFilter(event.target.value)} className="min-w-[145px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
            <option value="All">All components</option>
            {componentOptions.map((component) => <option key={component} value={component}>{component}</option>)}
          </select>
          <select aria-label="Filter alarms by time range" value={timeRange} onChange={(event) => setTimeRange(event.target.value)} className="min-w-[145px] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
            {timeRanges.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Site</th><th className="px-4 py-3">Component</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((alarm) => {
              const style = getAlarmPriorityStyle(alarm.priority);
              const site = accessibleSites.find((item) => item.id === alarm.siteId);
              return (
                <tr key={alarm.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedAlarm?.id === alarm.id ? 'bg-cyan-500/[0.05]' : ''}`} onClick={() => { setSelectedAlarmId(alarm.id); setNotice(''); }}>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-medium">{formatAlarmTime(alarm.timestamp)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold">{site?.name || alarm.siteId}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">{alarm.equipment || 'Site alarm'}</td>
                  <td className="max-w-[360px] px-4 py-4"><p className="truncate text-xs font-bold">{alarm.title}</p><p className="mt-1 truncate text-[10px] text-slate-500">{alarm.id} · {alarm.description}</p></td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${style.badge}`}>{alarm.priority}</span></td>
                  <td className="px-4 py-4 text-xs font-bold text-rose-500">{alarm.priority === 'Critical' ? 'High' : alarm.priority === 'Major' ? 'Medium' : 'Low'}</td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusTone(alarm.state)}`}>{alarm.state}</span></td>
                  <td className="px-4 py-4"><button type="button" aria-label={`Actions for ${alarm.id}`} onClick={(event) => {
                    event.stopPropagation();
                    if (openActionId === alarm.id) {
                      setOpenActionId(null);
                      setActionMenuPosition(null);
                      return;
                    }
                    const rect = event.currentTarget.getBoundingClientRect();
                    const menuWidth = 192;
                    const estimatedMenuHeight = alarm.state === 'Active' ? 124 : 82;
                    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
                    const shouldOpenUp = rect.bottom + estimatedMenuHeight > window.innerHeight - 8;
                    setActionMenuPosition({
                      left,
                      top: shouldOpenUp ? rect.top - estimatedMenuHeight : rect.bottom + 4,
                    });
                    setOpenActionId(alarm.id);
                  }} className="rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700"><MoreVertical className="h-4 w-4" /></button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
          {visible.length === 0 && <div className="px-4 py-10 text-center"><p className="text-sm font-semibold">No alarms match this view</p><p className="mt-1 text-xs text-slate-500">Try resetting the filters or selecting all sites.</p></div>}
        </div>
      </section>

      {openActionId && actionMenuPosition && (() => {
        const actionAlarm = visible.find((alarm) => alarm.id === openActionId);
        if (!actionAlarm) return null;
        return createPortal(
          <div className="fixed inset-0 z-[1200]" onClick={() => { setOpenActionId(null); setActionMenuPosition(null); }}>
            <div
              role="menu"
              className="fixed w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              style={{ left: actionMenuPosition.left, top: actionMenuPosition.top }}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" role="menuitem" onClick={() => { setSelectedAlarmId(actionAlarm.id); setOpenActionId(null); setActionMenuPosition(null); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800">Open event</button>
              {actionAlarm.state === 'Active' && <button type="button" role="menuitem" onClick={() => { runAction('Alarm acknowledged and added to the event history.', () => acknowledgeAlarm(actionAlarm.id)); setOpenActionId(null); setActionMenuPosition(null); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800">Acknowledge</button>}
              {actionAlarm.state !== 'Cleared' && <button type="button" role="menuitem" onClick={() => { runAction('Alarm marked as cleared.', () => updateAlarmState(actionAlarm.id, 'Cleared')); setOpenActionId(null); setActionMenuPosition(null); }} className="w-full rounded-lg px-3 py-2 text-left text-xs text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800">Clear alarm</button>}
            </div>
          </div>,
          document.body,
        );
      })()}

      {selectedAlarm && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="alarm-detail-title">
          <button type="button" aria-label="Close alarm details" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedAlarmId(null)} />
          <aside className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300">{selectedAlarm.id}</p>
                <h2 id="alarm-detail-title" className="mt-1 text-lg font-bold">{selectedAlarm.title}</h2>
                <Link to={`/site/${selectedAlarm.siteId}`} onClick={() => setSelectedAlarmId(null)} className="mt-1 inline-block text-xs font-semibold text-cyan-700 dark:text-cyan-300">{alarmSite?.name || selectedAlarm.siteId}</Link>
              </div>
              <button type="button" aria-label="Close alarm details" onClick={() => setSelectedAlarmId(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
            </header>
            <div className="overflow-y-auto p-5">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone(selectedAlarm.state)}`}>{selectedAlarm.state}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getAlarmPriorityStyle(selectedAlarm.priority).badge}`}>{selectedAlarm.priority}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedAlarm.equipment || 'Site alarm'}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedAlarm.description}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><dt className="text-[9px] uppercase tracking-wide text-slate-400">Raised</dt><dd className="mt-1 text-xs font-mono">{formatAlarmTime(selectedAlarm.timestamp)}</dd></div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><dt className="text-[9px] uppercase tracking-wide text-slate-400">Severity</dt><dd className="mt-1 text-xs font-semibold">{selectedAlarm.priority}</dd></div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><dt className="text-[9px] uppercase tracking-wide text-slate-400">Risk</dt><dd className="mt-1 text-xs font-semibold">{selectedAlarm.priority === 'Critical' ? 'High' : selectedAlarm.priority === 'Major' ? 'Medium' : 'Low'}</dd></div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><dt className="text-[9px] uppercase tracking-wide text-slate-400">Status</dt><dd className="mt-1 text-xs font-semibold">{selectedAlarm.state}</dd></div>
              </dl>

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recommended response</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedAlarm.state === 'Active' && <Button size="sm" variant="success" icon={Check} onClick={() => runAction('Alarm acknowledged and added to the event history.', () => acknowledgeAlarm(selectedAlarm.id))}>Acknowledge</Button>}
                  {!selectedAlarm.workOrderId && selectedAlarm.state !== 'Cleared' && <Button size="sm" variant="primary" icon={ClipboardPlus} onClick={() => runAction('Work order created from this alarm.', () => createWorkOrderFromAlarm(selectedAlarm.id))}>Create work order</Button>}
                  {selectedAlarm.state !== 'Cleared' && <Button size="sm" variant="secondary" icon={Clock3} onClick={() => runAction('Alarm shelved for one hour.', () => shelveAlarm(selectedAlarm.id, 60))}>Shelve 1h</Button>}
                  {selectedAlarm.state !== 'Cleared' && <Button size="sm" variant="secondary" icon={ShieldAlert} onClick={() => runAction('Alarm escalated to the Super User.', () => escalateAlarm(selectedAlarm.id, 'Super User'))}>Escalate</Button>}
                  {selectedAlarm.state !== 'Cleared' && <Button size="sm" variant="subtle" onClick={() => runAction('Alarm suppressed for operator investigation.', () => suppressAlarm(selectedAlarm.id, 'Suppressed for operator investigation'))}>Suppress</Button>}
                  {selectedAlarm.state !== 'Cleared' && <Button size="sm" variant="subtle" onClick={() => runAction('Alarm marked as cleared.', () => updateAlarmState(selectedAlarm.id, 'Cleared'))}>Clear</Button>}
                </div>
                {selectedAlarm.workOrderId && <p className="mt-3 flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-300"><Wrench className="h-3.5 w-3.5" />Linked work order: {selectedAlarm.workOrderId}</p>}
                {notice && <p role="status" className="mt-3 rounded-lg bg-cyan-500/10 px-3 py-2 text-[10px] text-cyan-800 dark:text-cyan-200">{notice}</p>}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <h3 className="flex items-center gap-2 text-xs font-bold"><History className="h-4 w-4 text-cyan-500" />Event history</h3>
                <div className="mt-3 space-y-2">
                  {siteEvents.length === 0 ? <p className="text-xs text-slate-500">No operator actions recorded for this site yet.</p> : siteEvents.slice(0, 8).map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 text-xs dark:border-slate-800"><span>{event.type}{event.alarmId ? ` · ${event.alarmId}` : event.workOrderId ? ` · ${event.workOrderId}` : ''}</span><span className="font-mono text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span></div>)}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </PageFrame>
  );
}
