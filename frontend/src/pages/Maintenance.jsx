import React, { useState } from 'react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { ClipboardList, Plus, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';

export default function Maintenance() {
  const { workOrders, createWorkOrderFromAlarm, updateWorkOrderStatus, alarms } = useDemoData();
  const [status, setStatus] = useState('All');
  const visible = status === 'All' ? workOrders : workOrders.filter((item) => item.status === status);
  return (
    <PageFrame title="Maintenance & CMMS" description="Work-order execution, maintenance planning and safety-linked corrective actions.">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">{['Open', 'Emergency', 'Preventive', 'Waiting parts', 'Done'].map((label) => <div key={label} className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{label === 'Open' ? workOrders.filter((item) => item.status !== 'Done').length : label === 'Emergency' ? workOrders.filter((item) => item.type === 'Emergency').length : workOrders.filter((item) => item.type === label || item.status === label).length}</p></div>)}</div>
      <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"><ClipboardList className="h-4 w-4 text-cyan-500" /> Work orders</h2><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs dark:border-slate-700"><option>All</option><option>New</option><option>Done</option></select></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-xs"><thead><tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800"><th className="pb-3">ID</th><th className="pb-3">Site</th><th className="pb-3">Type</th><th className="pb-3">Description</th><th className="pb-3">Priority</th><th className="pb-3">Status</th><th className="pb-3">Action</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3 font-mono font-bold">{item.id}</td><td className="py-3">{item.siteId || 'BESS-JODHUR'}</td><td className="py-3">{item.type}</td><td className="py-3">{item.description}</td><td className="py-3">{item.priority}</td><td className="py-3">{item.status || 'Scheduled'}</td>                <td className="py-3">{item.alarmId ? <select aria-label={`Update status for ${item.id}`} value={item.status || 'New'} onChange={(event) => updateWorkOrderStatus(item.id, event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-[10px] dark:border-slate-700"><option>New</option><option>Assigned</option><option>In progress</option><option>Waiting parts</option><option>Done</option></select> : <Button size="sm" variant="subtle" icon={Plus} onClick={() => { const alarm = alarms.find((alarmItem) => alarmItem.siteId === (item.siteId || 'BESS-JODHUR')); if (alarm) createWorkOrderFromAlarm(alarm.id); }}>Link alarm</Button>}</td></tr>)}</tbody></table></div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-200"><ShieldCheck className="h-5 w-5" /> PTW, checklist, digital signature and spare reservation are represented in the demo workflow.</div>
    </PageFrame>
  );
}
