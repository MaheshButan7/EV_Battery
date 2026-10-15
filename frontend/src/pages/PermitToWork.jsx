import React from 'react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { CheckCircle2, LockKeyhole, ShieldAlert } from 'lucide-react';
import Button from '../components/ui/Button';

export default function PermitToWork() {
  const { workOrders, events, permit, updatePermit, selectedSite } = useDemoData();
  const steps = ['Requested', 'Safety review', 'Approved', 'In progress', 'Closed'];
  const current = steps.indexOf(permit.state);
  return (
    <PageFrame title="Permit-to-Work" description="Demonstration of authorization, isolation and safety record keeping for field work.">
      <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold text-cyan-600">{permit.id}</p><h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{selectedSite?.name || 'Selected site'} inspection</h2><p className="mt-1 text-xs text-slate-500">Linked work order: {workOrders[0]?.id || 'Pending'}</p></div><span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">{permit.state}</span></div><div className="mt-8 flex flex-wrap gap-2">{steps.map((step, index) => <Button key={step} size="sm" variant={index <= current ? 'primary' : 'secondary'} aria-pressed={permit.state === step} onClick={() => updatePermit({ state: step })}>{index + 1}. {step}</Button>)}</div></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-sm font-bold"><LockKeyhole className="h-4 w-4 text-cyan-500" /> Isolation checklist</h2><label className="mt-5 flex items-start gap-3 text-xs"><input type="checkbox" checked={permit.isolationVerified} onChange={(event) => updatePermit({ isolationVerified: event.target.checked })} className="mt-0.5" /><span><strong>DC bus isolated and verified</strong><br /><span className="text-slate-500">Confirm lockout/tagout before work begins.</span></span></label><div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200"><ShieldAlert className="mb-1 h-4 w-4" /> Thermal hazard: use insulated tools and follow site emergency procedure.</div></div><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="text-sm font-bold">Approval actions</h2><div className="mt-4 space-y-2"><Button variant="success" className="w-full" disabled={!permit.isolationVerified} onClick={() => updatePermit({ state: 'Approved' })}>Approve permit</Button><Button variant="primary" className="w-full" onClick={() => updatePermit({ state: 'In progress' })}>Start work</Button><Button variant="secondary" className="w-full" onClick={() => updatePermit({ state: 'Closed' })}>Close permit</Button></div><p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {events.length} session events recorded</p></div></div>
    </PageFrame>
  );
}
