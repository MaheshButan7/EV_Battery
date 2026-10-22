import React, { useMemo, useState } from 'react';
import PageFrame from '../components/ui/PageFrame';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';
import { CheckCircle2, Clock3, FileText, LockKeyhole, ShieldAlert, Upload, XCircle } from 'lucide-react';

const steps = ['Requested', 'Safety review', 'Approved', 'In progress', 'Closed', 'Rejected'];
const isolationSteps = [
  ['dc', 'DC bus isolated and verified'],
  ['lockout', 'Lockout/tagout applied and recorded'],
  ['zeroEnergy', 'Zero energy state confirmed'],
];

export default function PermitToWork() {
  const { workOrders, events, permit, updatePermit, selectedSite, accessibleSites, selectSite } = useDemoData();
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ assetId: permit.assetId || '', workOrderId: permit.workOrderId || workOrders[0]?.id || '', hazards: permit.hazard || 'Electrical isolation; confirm site-specific hazards.', requester: permit.requester || 'Demo Operator', approver: permit.approver || 'Site Supervisor', authorizationLevel: permit.authorizationLevel || 'Site Supervisor', expiresAt: permit.expiresAt || '18:00', isolation: permit.isolation || { dc: Boolean(permit.isolationVerified), lockout: false, zeroEnergy: false }, document: permit.document || '', signature: permit.signature || '' });
  const activeIndex = steps.indexOf(permit.state);
  const selectedOrder = useMemo(() => workOrders.find((item) => item.id === form.workOrderId), [workOrders, form.workOrderId]);
  const allIsolated = isolationSteps.every(([key]) => form.isolation[key]);
  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const saveRequest = (event) => {
    event.preventDefault();
    if (!form.assetId.trim() || !form.workOrderId) { setNotice('Select an asset and link a work order before submitting the permit.'); return; }
    updatePermit({ state: 'Requested', siteId: selectedSite?.id, assetId: form.assetId, workOrderId: form.workOrderId, hazard: form.hazards, requester: form.requester, approver: form.approver, authorizationLevel: form.authorizationLevel, expiresAt: form.expiresAt, isolation: form.isolation, isolationVerified: allIsolated, document: form.document, signature: form.signature });
    setNotice('Permit request submitted for safety review.');
  };
  const transition = (nextState) => {
    if (nextState === 'Approved' && (!allIsolated || !form.signature.trim())) { setNotice('Complete all isolation checks and add the approver name/signature before approval.'); return; }
    if (nextState === 'In progress' && permit.state !== 'Approved') { setNotice('Only an approved permit can move to work in progress.'); return; }
    if (nextState === 'Closed' && permit.state !== 'In progress') { setNotice('Complete the work before closing the permit.'); return; }
    updatePermit({ state: nextState, siteId: selectedSite?.id, assetId: form.assetId, workOrderId: form.workOrderId, hazards: form.hazards, requester: form.requester, approver: form.approver, authorizationLevel: form.authorizationLevel, expiresAt: form.expiresAt, isolation: form.isolation, isolationVerified: allIsolated, document: form.document, signature: form.signature });
    setNotice(`Permit moved to ${nextState}.`);
  };

  return <PageFrame title="Permit-to-Work" description="Request, review and record safe work authorization. Workflow actions and uploaded evidence are simulated in this frontend demo.">
    <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">{permit.id}</p><h2 className="mt-1 text-base font-bold">Permit request</h2><p className="mt-1 text-xs text-slate-500">{selectedSite?.name || 'Select a site'} · Linked work order {selectedOrder?.id || 'not selected'}</p></div><span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">{permit.state}</span></div>
      <div className="mt-6 grid gap-2 sm:grid-cols-5">{steps.map((step, index) => <div key={step} className={`rounded-lg px-3 py-2 text-center text-[10px] font-semibold ${index < activeIndex ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : index === activeIndex ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{index + 1}. {step}</div>)}</div>
    </section>
    <form onSubmit={saveRequest} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-sm font-bold"><FileText className="h-4 w-4 text-cyan-500" />Work scope and hazards</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Site<select value={selectedSite?.id || ''} onChange={(event) => selectSite(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900">{accessibleSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Linked work order<select required value={form.workOrderId} onChange={(event) => updateForm('workOrderId', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900"><option value="">Select work order</option>{workOrders.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.description}</option>)}</select></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Asset ID<input required value={form.assetId} onChange={(event) => updateForm('assetId', event.target.value)} placeholder="Select or enter asset ID" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Hazards and precautions<textarea rows={3} value={form.hazards} onChange={(event) => updateForm('hazards', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Requester<input value={form.requester} onChange={(event) => updateForm('requester', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Approver<input value={form.approver} onChange={(event) => updateForm('approver', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Authorization level<select value={form.authorizationLevel} onChange={(event) => updateForm('authorizationLevel', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900"><option>Site Supervisor</option><option>Electrical Authorized Person</option><option>Operations Manager</option></select></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Permit expires<input type="time" value={form.expiresAt} onChange={(event) => updateForm('expiresAt', event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Safety document<input type="file" accept=".pdf,.jpg,.png" onChange={(event) => updateForm('document', event.target.files?.[0]?.name || '')} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" />{form.document && <span className="mt-1 block normal-case text-emerald-700 dark:text-emerald-300">Attached: {form.document} (demo only)</span>}</label>
        </div>
      </section>
      <div className="space-y-6">
        <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-sm font-bold"><LockKeyhole className="h-4 w-4 text-cyan-500" />Isolation checklist</h2><div className="mt-4 space-y-3">{isolationSteps.map(([key, label]) => <label key={key} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800"><input type="checkbox" checked={Boolean(form.isolation[key])} onChange={(event) => setForm((current) => ({ ...current, isolation: { ...current.isolation, [key]: event.target.checked } }))} className="mt-0.5 accent-cyan-600" /><span>{label}</span></label>)}</div><p className={`mt-3 text-[10px] font-semibold ${allIsolated ? 'text-emerald-600' : 'text-amber-600'}`}>{allIsolated ? 'All isolation steps verified' : 'Complete all checks before approval'}</p></section>
        <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-sm font-bold"><ShieldAlert className="h-4 w-4 text-amber-500" />Approval and execution</h2><label className="mt-4 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Approver signature / name<input value={form.signature} onChange={(event) => updateForm('signature', event.target.value)} placeholder="Type approver name to sign" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label><div className="mt-4 flex flex-wrap gap-2"><Button type="submit" variant="secondary" icon={Upload}>Submit request</Button><Button type="button" disabled={permit.state !== 'Requested'} onClick={() => transition('Safety review')}>Start review</Button><Button type="button" variant="success" disabled={permit.state !== 'Safety review' || !allIsolated || !form.signature.trim()} onClick={() => transition('Approved')}>Approve</Button><Button type="button" disabled={permit.state !== 'Approved'} onClick={() => transition('In progress')}>Start work</Button><Button type="button" variant="secondary" disabled={permit.state !== 'In progress'} onClick={() => transition('Closed')}>Close permit</Button><Button type="button" variant="danger" disabled={['Closed', 'Rejected'].includes(permit.state)} icon={XCircle} onClick={() => transition('Rejected')}>Reject</Button></div><p className="mt-3 flex items-center gap-2 text-[10px] text-slate-500"><Clock3 className="h-3.5 w-3.5" />Requester {permit.requester || form.requester} · Approver {permit.approver || form.approver} · Level {permit.authorizationLevel || form.authorizationLevel} · Expiry {permit.expiresAt || form.expiresAt}</p></section>
      </div>
    </form>
    {notice && <p role="status" className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-800 dark:text-cyan-200">{notice}</p>}
    <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-cyan-500" />Permit audit history</h2><div className="mt-3 space-y-2">{events.filter((event) => event.permitId === permit.id || event.type?.includes('Permit')).slice(0, 8).map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 text-[10px] dark:border-slate-800"><span>{event.type} · {event.actor || 'Demo Operator'}</span><span className="font-mono text-slate-400">{new Date(event.timestamp).toLocaleString()}</span></div>)}</div></section>
  </PageFrame>;
}
