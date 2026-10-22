import React, { useState } from 'react';
import PageFrame from '../components/ui/PageFrame';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';
import { Camera, Check, Cloud, CloudOff, QrCode, RefreshCw, PenLine } from 'lucide-react';

export default function FieldMode() {
  const { selectedSite, workOrders, updateWorkOrderChecklist, updateWorkOrderDetails } = useDemoData();
  const [assetCode, setAssetCode] = useState('');
  const [scanned, setScanned] = useState(false);
  const [workOrderId, setWorkOrderId] = useState(workOrders[0]?.id || '');
  const [checklist, setChecklist] = useState({ isolation: false, inspect: false, verify: false });
  const [photo, setPhoto] = useState('');
  const [signature, setSignature] = useState('');
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(false);
  const [notice, setNotice] = useState('');
  const currentOrder = workOrders.find((item) => item.id === workOrderId);
  const saveInspection = () => {
    if (!assetCode.trim() || !currentOrder) { setNotice('Scan or enter an asset code and select a linked work order.'); return; }
    if (offline) { setQueued(true); setNotice('Inspection saved to the local demo queue. Sync when online.'); return; }
    updateWorkOrderDetails(currentOrder.id, { fieldAssetCode: assetCode, photoEvidence: photo, signature, fieldChecklist: checklist });
    setNotice('Inspection record synced to the demo work order.');
  };
  const syncQueue = () => {
    if (!currentOrder || !queued) return;
    updateWorkOrderDetails(currentOrder.id, { fieldAssetCode: assetCode, photoEvidence: photo, signature, fieldChecklist: checklist, offlineSyncedAt: new Date().toISOString() });
    setQueued(false);
    setNotice('Offline inspection queue synchronized.');
  };

  return <PageFrame title="Field Mode" description="Responsive mobile workflow for asset identification, inspections and work order updates. Camera, offline queue and sync are simulated in this browser demo.">
    <div className="mx-auto max-w-3xl space-y-4">
      <div className={`flex items-center justify-between rounded-xl border p-3 text-xs ${offline ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'}`}><span className="flex items-center gap-2">{offline ? <CloudOff className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}{offline ? `${queued ? '1 item queued' : 'Offline mode'} · changes stay on this page` : 'Online · changes sync to demo state'}</span><label className="flex items-center gap-2 text-[10px] font-semibold"><input type="checkbox" checked={offline} onChange={(event) => setOffline(event.target.checked)} />Simulate offline</label></div>
      <section className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5"><h2 className="flex items-center gap-2 text-sm font-bold"><QrCode className="h-4 w-4 text-cyan-500" />Identify asset</h2><p className="mt-1 text-[10px] text-slate-500">{selectedSite?.name || 'Selected site'} · Enter a demo asset code or simulate a QR scan.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={assetCode} onChange={(event) => { setAssetCode(event.target.value); setScanned(false); }} placeholder="e.g. BESS-JODHUR-BMS-01" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs dark:border-slate-700" /><Button icon={QrCode} onClick={() => { setAssetCode(`${selectedSite?.id || 'BESS'}-CONT-01-RACK-02`); setScanned(true); }}>Simulate scan</Button></div>{scanned && <p className="mt-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Demo code scanned and asset resolved.</p>}</section>
      <section className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5"><h2 className="text-sm font-bold">Work order and inspection</h2><label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Work order<select value={workOrderId} onChange={(event) => setWorkOrderId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900">{workOrders.map((order) => <option key={order.id} value={order.id}>{order.id} · {order.description}</option>)}</select></label><div className="mt-4 space-y-2">{[['isolation', 'Confirm permit and isolation before inspection'], ['inspect', 'Inspect asset and record observed condition'], ['verify', 'Verify operation and close out findings']].map(([key, label]) => <label key={key} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800"><input type="checkbox" checked={checklist[key]} onChange={(event) => setChecklist((current) => ({ ...current, [key]: event.target.checked }))} className="mt-0.5 accent-cyan-600" />{label}</label>)}</div></section>
      <section className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5"><h2 className="text-sm font-bold">Evidence and sign-off</h2><label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-slate-500"><span className="flex items-center gap-1"><Camera className="h-3 w-3" />Attach photo</span><input type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0]?.name || '')} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" />{photo && <span className="mt-1 block normal-case text-emerald-700 dark:text-emerald-300">{photo} · demo attachment</span>}</label><label className="mt-3 block text-[10px] font-bold uppercase tracking-wide text-slate-500"><span className="flex items-center gap-1"><PenLine className="h-3 w-3" />Technician signature</span><input value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="Type full name to sign" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-xs normal-case tracking-normal dark:border-slate-700" /></label></section>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Button size="md" variant="primary" icon={Check} onClick={saveInspection}>Save inspection</Button><Button size="md" variant="secondary" icon={RefreshCw} disabled={!queued || offline} onClick={syncQueue}>Sync offline queue</Button></div>
      {notice && <p role="status" className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-800 dark:text-cyan-200">{notice}</p>}
    </div>
  </PageFrame>;
}
