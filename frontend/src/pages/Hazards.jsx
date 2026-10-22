import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageFrame from '../components/ui/PageFrame';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';
import { AlertTriangle, Check, Flame, Radio, ShieldAlert, Thermometer, Zap } from 'lucide-react';

function buildHazards(sites, alarms) {
  const base = sites.flatMap((site) => {
    let item;
    if (site.id === 'BESS-JODHUR') item = { category: 'Thermal', severity: 'Critical', asset: 'C1-R2-M4-C07', detail: 'Cell temperature reached 51 °C; investigate thermal propagation controls.', owner: 'Control Room Operator', action: 'Inspect affected rack and verify cooling and fire readiness.' };
    else if (site.id === 'BESS-RAIPUR') item = { category: 'Environmental', severity: 'Major', asset: 'HVAC-01', detail: 'Cooling unit unavailable while battery temperature is elevated.', owner: 'Site / Field Engineer', action: 'Restore HVAC and confirm rack temperature is stable.' };
    else if (site.commsStatus === 'Offline') item = { category: 'Communications', severity: 'Major', asset: 'GW-01', detail: 'Gateway offline; data is shown as last known state while local buffering is simulated.', owner: 'Control Room Operator', action: 'Restore gateway communications and verify buffered data sync.' };
    else return [];
    const alarm = alarms.find((entry) => entry.siteId === site.id && entry.state === 'Active');
    return [{ ...item, site, alarm }];
  });
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const supplemental = alarms.flatMap((alarm) => {
    const title = `${alarm.title} ${alarm.description}`.toLowerCase();
    const category = /fire|smoke|gas/.test(title) ? 'Fire & smoke'
      : /door|security|access/.test(title) ? 'Access & security'
        : /flood|water|humidity/.test(title) ? 'Environmental'
          : /voltage|insulation|breaker|electrical/.test(title) ? 'Electrical'
            : null;
    const site = siteById.get(alarm.siteId);
    if (!category || !site || base.some((item) => item.site.id === site.id && item.category === category)) return [];
    return [{ site, alarm, asset: alarm.equipment || 'Site safety system', category, severity: alarm.priority === 'Critical' ? 'Critical' : 'Major', detail: alarm.description, owner: 'Control Room Operator', action: 'Review the source alarm, verify the safety system and follow site procedure.' }];
  });
  return [...base, ...supplemental];
}

const severityClass = { Critical: 'bg-rose-500/10 text-rose-700 dark:text-rose-300', Major: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', Warning: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300' };

export default function Hazards() {
  const navigate = useNavigate();
  const { accessibleSites, accessibleAlarms, acknowledgeAlarm, updatePermit, selectSite } = useDemoData();
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('All');
  const hazards = useMemo(() => buildHazards(accessibleSites, accessibleAlarms), [accessibleSites, accessibleAlarms]);
  const visible = hazards.filter((item) => (category === 'All' || item.category === category) && (severity === 'All' || item.severity === severity));
  const categories = ['All', ...new Set(hazards.map((item) => item.category))];
  const startPermit = (item) => {
    selectSite(item.site.id);
    updatePermit({ state: 'Requested', siteId: item.site.id, assetId: item.asset, hazard: item.detail, requester: 'Demo Operator', authorizationLevel: 'Site Supervisor' });
    navigate('/maintenance/permits');
  };

  return <PageFrame title="Safety & Hazards" description="Fleet-level view of safety signals, ownership and next actions. All sensor conditions are simulated for this demo.">
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Fleet hazard summary">
      {[
        ['Open hazards', hazards.length, 'Across accessible sites'],
        ['Critical', hazards.filter((item) => item.severity === 'Critical').length, 'Immediate operator review'],
        ['Sites affected', new Set(hazards.map((item) => item.site.id)).size, 'Thermal, environment or communications'],
        ['Safety systems', `${accessibleSites.length - hazards.filter((item) => item.category === 'Thermal').length}/${accessibleSites.length}`, 'Reporting in demo data'],
      ].map(([label, value, note]) => <div key={label} className="surface-card rounded-xl border bg-white p-4 dark:bg-slate-900"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value}</p><p className="mt-1 text-[10px] text-slate-500">{note}</p></div>)}
    </section>
    <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-sm font-bold">Hazard queue</h2><p className="mt-1 text-xs text-slate-500">Review source asset, risk owner and the next safe action.</p></div><div className="flex flex-wrap gap-2"><label className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Type<select value={category} onChange={(event) => setCategory(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900">{['All', 'Critical', 'Major', 'Warning'].map((item) => <option key={item}>{item}</option>)}</select></label></div></div>
      <div className="mt-4 space-y-3">{visible.map((item) => { const Icon = item.category === 'Thermal' ? Flame : item.category === 'Environmental' ? Thermometer : item.category === 'Electrical' ? Zap : item.category === 'Communications' ? Radio : ShieldAlert; return <article key={`${item.site.id}-${item.asset}`} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex flex-col gap-4 lg:flex-row lg:items-start"><div className={`rounded-xl p-3 ${item.severity === 'Critical' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}`}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link to={`/site/${item.site.id}`} onClick={() => selectSite(item.site.id)} className="text-xs font-bold text-cyan-700 dark:text-cyan-300">{item.site.name}</Link><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${severityClass[item.severity]}`}>{item.severity}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold dark:bg-slate-800">{item.category}</span></div><p className="mt-2 text-xs font-semibold">{item.detail}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500"><span>Source: {item.asset}</span><span>Risk owner: {item.owner}</span><span>Isolation: {item.severity === 'Critical' ? 'Required before field work' : 'Verify before work'}</span></div><p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">Next action: {item.action}</p></div><div className="flex shrink-0 flex-wrap gap-2">{item.alarm && <Button size="sm" variant="success" icon={Check} onClick={() => acknowledgeAlarm(item.alarm.id)}>Acknowledge alarm</Button>}<Button size="sm" variant="primary" onClick={() => startPermit(item)}>Start PTW</Button></div></div></article>; })}{visible.length === 0 && <p className="rounded-xl bg-emerald-500/[0.06] p-5 text-xs text-emerald-700 dark:text-emerald-300">No hazards match these filters in the simulated fleet data.</p>}</div>
    </section>
    <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-[10px] leading-5 text-slate-600 dark:text-slate-300"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />Hazard acknowledgement and PTW creation are demo interactions. Follow the site emergency procedure and approved isolation process for real work.</div>
  </PageFrame>;
}
