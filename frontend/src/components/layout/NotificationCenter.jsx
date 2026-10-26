import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Bell, BrainCircuit, Clock3, ExternalLink, X } from 'lucide-react';
import { useDemoData } from '../../hooks/useDemoData';
import { getAlarmPriorityStyle } from '../../utils/formatters';

const priorityRank = { Critical: 0, Major: 1, Warning: 2, Minor: 3, Info: 4 };

const aiInsights = {
  'BESS-JODHUR': {
    priority: 'Critical',
    title: 'Thermal risk watch',
    detail: 'Cell temperature reached 51 °C. Inspect the affected rack and verify cooling and fire protection readiness.',
    confidence: '93.1%',
  },
  'BESS-RAIPUR': {
    priority: 'Major',
    title: 'Capacity fade needs review',
    detail: 'The demo model flags accelerated capacity fade alongside an HVAC fault. Schedule a capacity assessment.',
    confidence: '91.4%',
  },
  'BESS-CHENNAI': {
    priority: 'Major',
    title: 'Telemetry gap limits confidence',
    detail: 'Gateway communication is offline. Restore telemetry before relying on the site health projection.',
    confidence: '87.0%',
  },
};

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Time unavailable';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function PriorityBadge({ priority }) {
  const { badge } = getAlarmPriorityStyle(priority);
  return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${badge}`}>{priority}</span>;
}

function NotificationItem({ alarm, siteName, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-slate-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/30">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{alarm.title}</span>
          <span className="mt-1 block truncate text-[10px] text-slate-500">{siteName} · {alarm.id}</span>
        </div>
        <PriorityBadge priority={alarm.priority} />
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-600 dark:text-slate-300">{alarm.description}</p>
      <span className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><Clock3 className="h-3 w-3" />{formatNotificationTime(alarm.timestamp)}</span>
    </button>
  );
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { accessibleAlarms, accessibleSites, selectSite } = useDemoData();
  const [open, setOpen] = useState(false);
  const activeAlarms = useMemo(() => accessibleAlarms
    .filter((alarm) => alarm.state === 'Active')
    .sort((a, b) => (priorityRank[a.priority] ?? 5) - (priorityRank[b.priority] ?? 5)
      || new Date(b.timestamp) - new Date(a.timestamp)), [accessibleAlarms]);
  const fleetAlerts = activeAlarms.filter((alarm) => ['Critical', 'Major', 'Warning'].includes(alarm.priority)).slice(0, 4);
  const siteAlerts = useMemo(() => accessibleSites.map((site) => ({
    site,
    total: activeAlarms.filter((alarm) => alarm.siteId === site.id).length,
    alerts: activeAlarms.filter((alarm) => alarm.siteId === site.id).slice(0, 3),
  })), [accessibleSites, activeAlarms]);
  const siteNames = useMemo(() => Object.fromEntries(accessibleSites.map((site) => [site.id, site.name])), [accessibleSites]);
  const insights = accessibleSites
    .map((site) => ({ site, ...aiInsights[site.id] }))
    .filter((item) => item.title)
    .sort((a, b) => (priorityRank[a.priority] ?? 5) - (priorityRank[b.priority] ?? 5));

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const openAlarm = (alarm) => {
    selectSite(alarm.siteId);
    setOpen(false);
    navigate(`/alarms?query=${encodeURIComponent(alarm.id)}`);
  };

  const openSite = (siteId) => {
    selectSite(siteId);
    setOpen(false);
    navigate(`/site/${siteId}`);
  };

  const openSiteAlarms = (siteId) => {
    selectSite(siteId);
    setOpen(false);
    navigate('/alarms');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open notifications, ${activeAlarms.length} active alerts`}
        aria-expanded={open}
        aria-controls="notification-center"
        className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-blue-500/10 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-300 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
      >
        <Bell className="h-5 w-5" />
        {activeAlarms.length > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white">{activeAlarms.length > 99 ? '99+' : activeAlarms.length}</span>}
      </button>

      {open && createPortal(<div className="fixed inset-0 z-[1400]">
        <button type="button" className="absolute inset-0 h-full w-full bg-slate-950/35" onClick={() => setOpen(false)} aria-label="Close notification center" />
        <aside id="notification-center" role="dialog" aria-modal="true" aria-labelledby="notification-center-title" className="absolute inset-y-0 right-0 z-10 flex w-full max-w-[min(28rem,100vw)] flex-col border-l border-slate-200 bg-[var(--app-panel)] shadow-2xl dark:border-slate-700">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 id="notification-center-title" className="text-base font-bold text-slate-900 dark:text-white">Notifications</h2>
              <p className="mt-1 text-[11px] text-slate-500">{activeAlarms.length} active fleet alerts · sample data</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"><X className="h-4 w-4" /></button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section aria-labelledby="fleet-notifications-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id="fleet-notifications-title" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"><Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />Fleet priorities</h3>
                <span className="text-[10px] text-slate-400">All sites</span>
              </div>
              <div className="space-y-2">
                {fleetAlerts.length ? fleetAlerts.map((alarm) => <NotificationItem key={alarm.id} alarm={alarm} siteName={siteNames[alarm.siteId] || alarm.siteId} onOpen={() => openAlarm(alarm)} />) : <p className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700">No active fleet priority alerts.</p>}
              </div>
            </section>

            <section aria-labelledby="site-notifications-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id="site-notifications-title" className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" /><span className="truncate">Site priorities</span></h3>
                <span className="shrink-0 text-[10px] text-slate-400">All sites</span>
              </div>
              <div className="space-y-4">
                {siteAlerts.map(({ site, total, alerts }) => <div key={site.id}>
                  <div className="mb-2 flex items-center justify-between gap-2"><span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">{site.name}</span><span className="shrink-0 text-[10px] text-slate-400">{total} active</span></div>
                  <div className="space-y-2">
                    {alerts.length ? alerts.map((alarm) => <NotificationItem key={alarm.id} alarm={alarm} siteName={site.name} onOpen={() => openAlarm(alarm)} />) : <p className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[10px] text-slate-500 dark:border-slate-700">No active site alerts.</p>}
                  </div>
                  {total > alerts.length && <button type="button" onClick={() => openSiteAlarms(site.id)} className="mt-2 text-[10px] font-semibold text-blue-700 hover:underline dark:text-blue-300">View all {total} site alerts</button>}
                </div>)}
              </div>
            </section>

            <section aria-labelledby="ai-insights-title">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 id="ai-insights-title" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300"><BrainCircuit className="h-4 w-4 text-blue-600 dark:text-blue-400" />Priority AI insights</h3>
                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[9px] font-semibold text-blue-700 dark:text-blue-300">Simulated</span>
              </div>
              <div className="space-y-2">
                {insights.map(({ site, priority, title, detail, confidence }) => {
                  const { badge } = getAlarmPriorityStyle(priority);
                  return <article key={site.id} className="rounded-lg border border-blue-200/80 bg-blue-50/60 p-3 dark:border-blue-900/70 dark:bg-blue-950/20">
                    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><span className="block truncate text-[10px] font-semibold text-blue-700 dark:text-blue-300">{site.name}</span><h4 className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{title}</h4></div><span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${badge}`}>{priority}</span></div>
                    <p className="mt-2 text-[11px] leading-4 text-slate-600 dark:text-slate-300">{detail}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400"><span>Model confidence {confidence}</span><span>Data {site.lastUpdated}</span></div>
                    <button type="button" onClick={() => openSite(site.id)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 hover:underline dark:text-blue-300">Review site <ExternalLink className="h-3 w-3" /></button>
                  </article>;
                })}
              </div>
              <p className="mt-3 text-[10px] leading-4 text-slate-400">AI insights are illustrative demo outputs, not validated predictions.</p>
            </section>
          </div>

          <footer className="border-t border-slate-200 p-4 dark:border-slate-800">
            <button type="button" onClick={() => { setOpen(false); navigate('/alarms'); }} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700">Open alarm management <ExternalLink className="h-3.5 w-3.5" /></button>
          </footer>
        </aside>
      </div>, document.body)}
    </>
  );
}
