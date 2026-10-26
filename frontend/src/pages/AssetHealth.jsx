import React from 'react';
import { Link } from 'react-router-dom';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { Activity, AlertCircle, ArrowRight, BrainCircuit, CalendarClock, CheckCircle2, ClipboardPlus, Gauge, ShieldAlert, Thermometer } from 'lucide-react';

const demoSignals = {
  'BESS-JODHUR': { issue: 'Elevated cell temperature; thermal risk watch', recommendation: 'Inspect affected rack and verify cooling and fire protection readiness.', confidence: 93.1, priority: 'Critical' },
  'BESS-RAIPUR': { issue: 'Accelerated capacity fade with HVAC fault', recommendation: 'Review HVAC performance and schedule a battery capacity assessment.', confidence: 91.4, priority: 'Major' },
  'BESS-CHENNAI': { issue: 'Gateway communication loss', recommendation: 'Restore gateway telemetry before relying on health projections.', confidence: 87.0, priority: 'Major' },
};

const requirements = [
  { group: 'Life and degradation', items: ['Remaining useful life estimation', 'Battery degradation prediction', 'Capacity fade prediction', 'Calendar aging analysis', 'Cycle aging analysis'] },
  { group: 'Safety and fault detection', items: ['Failure prediction', 'Cell imbalance detection', 'Thermal runaway prediction', 'Early anomaly detection', 'Fault pattern recognition'] },
  { group: 'Diagnosis and action', items: ['Charge/discharge behavior analysis', 'Health index calculation', 'Asset criticality ranking', 'Root cause analysis', 'Maintenance recommendations', 'Predictive maintenance scheduling', 'Prediction confidence score'] },
];

const Panel = ({ children, className = '' }) => <section className={`surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900 ${className}`}>{children}</section>;
const SectionTitle = ({ icon: Icon, title, note }) => <div className="mb-4"><h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"><Icon className="h-4 w-4 text-cyan-500" />{title}</h2>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div>;

export default function AssetHealth() {
  const { createManualWorkOrder, accessibleAlarms, accessibleSites, selectSite } = useDemoData();
  const risks = accessibleSites.map((site) => {
    const signal = demoSignals[site.id] || { issue: 'No high-priority degradation signal', recommendation: 'Continue condition monitoring and review on the next maintenance cycle.', confidence: 84.6, priority: 'Minor' };
    return { ...site, ...signal, rulRange: `${Math.max(1, Math.round(site.rul - 1.5))}–${Math.round(site.rul + 1.5)} years` };
  }).sort((a, b) => a.healthIndex - b.healthIndex);
  const averageHealth = accessibleSites.length ? accessibleSites.reduce((sum, site) => sum + site.healthIndex, 0) / accessibleSites.length : 0;
  const atRiskCount = accessibleSites.filter((site) => site.riskLevel !== 'Low' || site.healthIndex < 85).length;
  const predictionCount = accessibleSites.filter((site) => site.riskLevel !== 'Low').length;

  const createRecommendationOrder = (site) => createManualWorkOrder({
    siteId: site.id,
    assetId: `${site.id}-BMS-01`,
    description: site.recommendation,
    priority: site.priority,
    type: 'Predictive',
  });

  return (
    <PageFrame title="Asset Health & Predictive Maintenance" description="Prioritize fleet risks, understand model signals, and turn predictive recommendations into planned maintenance.">
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] p-3 text-xs text-slate-700 dark:text-slate-300">
        <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700 dark:text-cyan-300" />
        <p><strong>AI/ML demo view.</strong> Predictions and confidence values use synthetic demo data. They are illustrative and have not been produced by a trained or validated production model.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Predictive maintenance summary">
        {[
          ['Average site health', averageHealth.toFixed(1), Activity, 'out of 100'],
          ['Sites requiring review', atRiskCount, Thermometer, 'health or risk threshold'],
          ['Sites with prediction signals', predictionCount, BrainCircuit, 'simulated model outputs'],
          ['Open fleet alarms', accessibleAlarms.filter((alarm) => alarm.state === 'Active').length, ShieldAlert, 'active across accessible sites'],
        ].map(([label, value, Icon, note]) => <div key={label} className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900"><Icon className="h-4 w-4 text-cyan-500" /><p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-[10px] text-slate-500">{note}</p></div>)}
      </section>

      <Panel>
        <SectionTitle icon={AlertCircle} title="Predictions and recommended actions" note="Review the signal, confidence and suggested next step. Create a predictive work order to carry the recommendation into maintenance planning." />
        <div className="space-y-3">
          {risks.map((site) => {
            const alarm = accessibleAlarms.find((item) => item.siteId === site.id && item.state === 'Active');
            const severity = site.priority === 'Critical' ? 'border-rose-500/25 bg-rose-500/5 text-rose-700 dark:text-rose-300' : site.priority === 'Major' ? 'border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-300' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300';
            return <article key={site.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/site/${site.id}`} onClick={() => selectSite(site.id)} className="text-sm font-bold text-cyan-700 hover:underline dark:text-cyan-300">{site.name}</Link>
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${severity}`}>{site.priority} review</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Health {site.healthIndex}/100</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{site.issue}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">Recommended: {site.recommendation}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-slate-500"><span>Estimated RUL: <strong className="text-slate-700 dark:text-slate-300">{site.rulRange}</strong></span><span>Prediction confidence: <strong className="text-slate-700 dark:text-slate-300">{site.confidence}%</strong></span>{alarm && <Link to="/alarms" className="font-semibold text-cyan-700 dark:text-cyan-300">Related active alarm: {alarm.id}</Link>}</div>
                  <div className="mt-3 h-1.5 max-w-lg rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-1.5 rounded-full ${site.healthIndex < 85 ? 'bg-rose-500' : site.healthIndex < 92 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${site.healthIndex}%` }} /></div>
                </div>
                <button type="button" onClick={() => createRecommendationOrder(site)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-cyan-700"><ClipboardPlus className="h-3.5 w-3.5" />Create predictive work order</button>
              </div>
            </article>;
          })}
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={BrainCircuit} title="RFP AI/ML capability coverage" note="The RFP asks the solution to support the following predictive maintenance capabilities. Demo coverage is represented with simulated signals." />
        <div className="grid gap-4 md:grid-cols-3">
          {requirements.map((group) => <div key={group.group} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><h3 className="mb-3 text-xs font-bold text-slate-900 dark:text-white">{group.group}</h3><ul className="space-y-2">{group.items.map((item) => <li key={item} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{item}</li>)}</ul></div>)}
        </div>
      </Panel>

      <Panel>
        <SectionTitle icon={Gauge} title="Model transparency and data needs" note="Proposal response information requested by the RFP. Production model details must be supplied and validated by the vendor." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Model approach', 'Vendor to describe model types and intended use for each prediction.'],
            ['Training method', 'Vendor to explain training data, labeling, retraining cadence and governance.'],
            ['Validation', 'Vendor to provide validation design, test coverage and performance measures.'],
            ['Data and accuracy', 'Vendor to state required data, history, quality thresholds and expected accuracy.'],
          ].map(([title, detail]) => <div key={title} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</p><p className="mt-2 text-[11px] leading-5 text-slate-700 dark:text-slate-300">{detail}</p></div>)}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.05] p-3 text-[10px] leading-5 text-slate-600 dark:text-slate-300"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />Predictive recommendations can be scheduled as maintenance work orders. Confirm the asset condition and site safety procedure before execution.</div>
      </Panel>

      <div className="flex items-center gap-2 text-[10px] text-slate-500"><ArrowRight className="h-3.5 w-3.5" />Select a site to drill into site operations. Related alarms link to Alarm Management; created work orders are available in Maintenance.</div>
    </PageFrame>
  );
}
