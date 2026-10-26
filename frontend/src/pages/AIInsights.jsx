import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity, ArrowUpRight, Battery, AlertCircle,
  Gauge, ShieldAlert, Thermometer, TrendingDown, Zap,
} from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { generatePackData } from '../data/siteDetail';

const priorityStyles = {
  Critical: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  Major: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
  Warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Monitor: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
};

const filters = ['All', 'Safety', 'Degradation', 'Reliability', 'Operations'];

function buildFindings(sites, alarms) {
  if (!sites.length) return [];
  const findings = [];
  const siteName = (id) => sites.find((site) => site.id === id)?.name || id;
  const activeAlarms = alarms.filter((alarm) => alarm.state === 'Active');
  const highRisk = sites.filter((site) => site.riskLevel === 'High' || site.healthIndex < 85);
  const lowestHealth = [...sites].sort((a, b) => a.healthIndex - b.healthIndex)[0];

  findings.push({
    id: 'fleet-risk', scope: 'Fleet', category: 'Reliability', priority: highRisk.length ? 'Major' : 'Monitor',
    title: `${highRisk.length} of ${sites.length} sites need an asset-health review`,
    summary: highRisk.length ? `Risk is concentrated at ${highRisk.map((site) => site.name).join(' and ')}.` : 'No accessible site is currently above the configured demo risk threshold.',
    rationale: 'The demo rule ranks sites using the supplied health index and risk label. This helps focus inspection effort; it is not a failure probability.',
    evidence: highRisk.length ? highRisk.map((site) => `${site.name}: health ${site.healthIndex}/100 · SOH ${site.soh}% · RUL estimate ${site.rul} years`) : [`Lowest health: ${lowestHealth.name} at ${lowestHealth.healthIndex}/100`],
    recommendation: 'Review the lowest-ranked sites with operations and maintenance. Confirm the underlying BMS history before changing dispatch or maintenance plans.',
    confidence: 'Rule-based · high data coverage', siteIds: highRisk.map((site) => site.id), Icon: Activity,
  });

  sites.forEach((site) => {
    const siteAlarms = activeAlarms.filter((alarm) => alarm.siteId === site.id);
    if (site.temperature >= 45 || site.status === 'Fault') {
      const pack = generatePackData(site.id);
      const hotCell = pack.flatMap((container) => container.racks.flatMap((rack) => rack.modules.flatMap((module) => module.cells)))
        .filter((cell) => cell.isAnomalous && cell.temperature >= 45)
        .sort((a, b) => b.temperature - a.temperature)[0];
      findings.push({
        id: `thermal-${site.id}`, scope: site.name, category: 'Safety', priority: 'Critical',
        title: hotCell ? `Thermal anomaly detected at ${hotCell.id}` : `Elevated temperature and fault status at ${site.name}`,
        summary: 'A localized temperature signal and site-level operating condition warrant prompt operator review.',
        rationale: 'The demo flags a thermal condition when site temperature is at least 45°C or site status is Fault. Treat this as a screening signal, not a thermal-runaway prediction.',
        evidence: [hotCell && `Cell ${hotCell.id}: ${hotCell.temperature}°C · ${hotCell.voltage.toFixed(3)} V · internal resistance ${hotCell.internalResistance.toFixed(3)} mΩ`, `Site temperature ${site.temperature}°C · status ${site.status}`, `${siteAlarms.length} active alarms at this site`].filter(Boolean),
        recommendation: hotCell?.anomaly?.action || 'Verify sensor validity, inspect cooling and affected equipment, and follow the site emergency response procedure if the condition is confirmed.',
        confidence: hotCell?.anomaly?.modelConfidence ? `Seeded demo signal · ${hotCell.anomaly.modelConfidence}` : 'Threshold rule · unvalidated', siteIds: [site.id], Icon: Thermometer,
      });
    }
    if (site.soh <= 92 || site.rul <= 9) {
      findings.push({
        id: `degradation-${site.id}`, scope: site.name, category: 'Degradation', priority: site.soh <= 88 ? 'Major' : 'Warning',
        title: `${site.name} is in the lower band for health and remaining life`,
        summary: `Current SOH is ${site.soh}% with a demo RUL estimate of ${site.rul} years.`,
        rationale: `SOH, cycle count, and RUL are reviewed together to prioritize a capacity and degradation assessment. The demo does not extrapolate a validated capacity-fade model.`,
        evidence: [`SOH ${site.soh}% · health index ${site.healthIndex}/100`, `${site.cycles.toLocaleString()} recorded cycles · RUL estimate ${site.rul} years`, `Round-trip efficiency ${site.roundTripEfficiency}%`],
        recommendation: 'Compare recent capacity-test results and charge/discharge history with the asset baseline. Confirm calendar and cycle-aging inputs before using an RUL projection.',
        confidence: 'Trend screening · model validation required', siteIds: [site.id], Icon: Battery,
      });
    }
    if (site.availability < 99 || site.commsStatus === 'Offline') {
      findings.push({
        id: `availability-${site.id}`, scope: site.name, category: 'Operations', priority: site.commsStatus === 'Offline' ? 'Major' : 'Warning',
        title: site.commsStatus === 'Offline' ? `Telemetry is unavailable at ${site.name}` : `${site.name} availability is below the 99% review threshold`,
        summary: `Availability ${site.availability}% · communications ${site.commsStatus.toLowerCase()}.`,
        rationale: 'Availability and communications state identify operational exposure, but do not by themselves establish the root cause.',
        evidence: [`Availability ${site.availability}%`, `Site state ${site.status} · telemetry ${site.commsStatus}`, `${siteAlarms.length} active alarms`],
        recommendation: site.commsStatus === 'Offline' ? 'Restore gateway connectivity and validate telemetry freshness before relying on health or forecasting outputs.' : 'Review outage and alarm timelines, then separate planned downtime from equipment-related unavailability.',
        confidence: 'Direct demo status fields', siteIds: [site.id], Icon: Zap,
      });
    }
    if (siteAlarms.length >= 3) {
      const major = siteAlarms.filter((alarm) => ['Critical', 'Major'].includes(alarm.priority));
      const themes = [...new Set(siteAlarms.map((alarm) => /temp|thermal|cool/i.test(alarm.title) ? 'thermal/cooling' : /voltage|imbalance|soc/i.test(alarm.title) ? 'battery electrical' : /gateway|communication/i.test(alarm.title) ? 'communications' : 'other'))];
      findings.push({
        id: `alarms-${site.id}`, scope: site.name, category: 'Reliability', priority: major.length >= 2 ? 'Major' : 'Warning',
        title: `${siteAlarms.length} active alarms are clustered at ${site.name}`,
        summary: `${major.length} are Critical or Major; observed alarm themes include ${themes.join(', ')}.`,
        rationale: 'This finding groups the current active alarm snapshot by priority and broad title keywords. It is not a causal diagnosis and does not use historical recurrence rates.',
        evidence: siteAlarms.slice(0, 4).map((alarm) => `${alarm.priority}: ${alarm.title} · ${alarm.equipment}`),
        recommendation: 'Acknowledge and triage the highest-priority alarms first. Compare timestamps and asset relationships before assigning a root cause.',
        confidence: 'Alarm grouping · snapshot only', siteIds: [site.id], Icon: ShieldAlert,
      });
    }
  });

  const priorityRank = { Critical: 0, Major: 1, Warning: 2, Monitor: 3 };
  return findings.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}

function FindingCard({ finding }) {
  const Icon = finding.Icon;
  return (
    <article className="surface-card min-w-0 rounded-xl border bg-white p-4 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="rounded-lg border border-slate-200 p-2 text-cyan-700 dark:border-slate-700 dark:text-cyan-300"><Icon className="h-4 w-4" /></span>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{finding.category} <span className="px-1">·</span> {finding.scope}</p><h3 className="mt-1 text-sm font-bold leading-5 text-slate-900 dark:text-white">{finding.title}</h3></div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${priorityStyles[finding.priority]}`}>{finding.priority}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{finding.summary}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div><h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evidence</h4><ul className="mt-2 space-y-1.5">{finding.evidence.map((item) => <li key={item} className="flex gap-2 text-[11px] leading-4 text-slate-700 dark:text-slate-300"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-500" />{item}</li>)}</ul></div>
        <div className="space-y-3"><div><h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Why this was raised</h4><p className="mt-1.5 text-[11px] leading-4 text-slate-600 dark:text-slate-400">{finding.rationale}</p></div><div><h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Suggested next step</h4><p className="mt-1.5 text-[11px] leading-4 text-slate-700 dark:text-slate-300">{finding.recommendation}</p></div></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-800"><span className="text-[10px] text-slate-500">Signal basis: {finding.confidence}</span><div className="flex flex-wrap gap-3">{finding.siteIds.slice(0, 2).map((siteId) => <Link key={siteId} to={`/site/${siteId}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 hover:underline dark:text-cyan-300">Open {siteId.replace('BESS-', '')}<ArrowUpRight className="h-3 w-3" /></Link>)}{finding.siteIds.length > 2 && <span className="text-[10px] text-slate-500">+{finding.siteIds.length - 2} sites</span>}</div></div>
    </article>
  );
}

export default function AIInsights() {
  const { selectedSite, accessibleSites, accessibleAlarms } = useDemoData();
  const [filter, setFilter] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();
  const scope = searchParams.get('scope') === 'site' ? 'Selected site' : 'Fleet';
  const setScope = (nextScope) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextScope === 'Selected site') nextParams.set('scope', 'site');
    else nextParams.delete('scope');
    setSearchParams(nextParams, { replace: true });
  };
  const findings = useMemo(() => buildFindings(accessibleSites, accessibleAlarms), [accessibleSites, accessibleAlarms]);
  const scoped = findings.filter((finding) => scope === 'Fleet' || finding.siteIds.includes(selectedSite?.id));
  const visible = scoped.filter((finding) => filter === 'All' || finding.category === filter || (filter === 'Degradation' && finding.category === 'Degradation'));
  const activeCount = accessibleAlarms.filter((alarm) => alarm.state === 'Active').length;
  const priorityCount = scoped.filter((finding) => ['Critical', 'Major'].includes(finding.priority)).length;
  const currentTime = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <PageFrame
      description="Prioritized fleet and site findings with supporting signals, reasoning, and operational follow-up."
      actions={<div className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700" aria-label="Insight scope">{['Fleet', 'Selected site'].map((item) => <button key={item} type="button" onClick={() => setScope(item)} aria-pressed={scope === item} className={`rounded-md px-3 py-2 text-[11px] font-semibold ${scope === item ? 'bg-cyan-700 text-white dark:bg-blue-600' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{item}</button>)}</div>}
    >

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Insight summary">
        {[[scope === 'Fleet' ? 'Sites in scope' : 'Selected site', scope === 'Fleet' ? accessibleSites.length : (selectedSite?.name || '—'), Activity], ['Priority findings', priorityCount, AlertCircle], ['Active alarms', scope === 'Fleet' ? activeCount : (accessibleAlarms.filter((alarm) => alarm.siteId === selectedSite?.id && alarm.state === 'Active').length), ShieldAlert], ['Findings surfaced', scoped.length, Gauge]].map(([label, value, Icon]) => <div key={label} className="surface-card rounded-xl border bg-white p-4 dark:bg-slate-900"><Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /><p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">{value}</p></div>)}
      </section>

      <section className="surface-card rounded-xl border bg-white p-4 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Prioritized findings</h2><p className="mt-1 text-[10px] text-slate-500">Sorted by operational priority · demo snapshot updated {currentTime}</p></div><span className="text-[10px] text-slate-500">{visible.length} shown</span></div>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter insights">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${filter === item ? 'border-cyan-700 bg-cyan-700 text-white dark:border-blue-500 dark:bg-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{item}</button>)}</div>
      </section>

      {visible.length ? <section className="space-y-3" aria-label="Insight evidence">{visible.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</section> : <div className="surface-card rounded-xl border bg-white p-10 text-center dark:bg-slate-900"><TrendingDown className="mx-auto h-6 w-6 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No findings match this view</p><p className="mt-1 text-xs text-slate-500">Try another category or select Fleet scope.</p></div>}

    </PageFrame>
  );
}
