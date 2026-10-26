import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarDays, Camera, ClipboardCheck, ClipboardList, History, PackagePlus, Plus, Target, Timer, Users } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import Button from '../components/ui/Button';
import { useDemoData } from '../hooks/useDemoData';

const statuses = ['New', 'Scheduled', 'Assigned', 'In progress', 'Waiting parts', 'Waiting approval', 'Done'];
const technicians = ['Unassigned', 'R. Mehta', 'P. Kumar', 'S. Patil', 'A. Rao', 'N. Iyer', 'V. Shah'];

function addDays(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(workOrder) {
  if (workOrder.status === 'Done' || !workOrder.dueDate) return false;
  const due = new Date(`${workOrder.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function getPreventivePlans(site) {
  if (!site) return [];
  return [
    { id: 'PM-BMS', task: 'BMS health check and calibration', assetId: `${site.id}-BMS-01`, frequency: 'Quarterly', dueDate: addDays(2), owner: 'R. Mehta', checklist: 'Calibration checklist', sop: 'BMS calibration and verification SOP' },
    { id: 'PM-HVAC', task: 'HVAC filter and cooling inspection', assetId: `${site.id}-HVAC-01`, frequency: 'Monthly', dueDate: addDays(6), owner: 'P. Kumar', checklist: 'HVAC inspection checklist', sop: 'HVAC inspection and filter replacement SOP' },
    { id: 'PM-FIRE', task: 'Fire suppression panel test', assetId: `${site.id}-FIRE-01`, frequency: 'Monthly', dueDate: addDays(12), owner: 'S. Patil', checklist: 'Fire safety checklist', sop: 'Fire suppression functional test SOP' },
  ];
}

function statusClass(status, overdue) {
  if (overdue) return 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
  if (status === 'Done') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (status === 'In progress') return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300';
  return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
}

export default function Maintenance() {
  const {
    selectedSite,
    workOrders,
    createManualWorkOrder,
    updateWorkOrderStatus,
    assignWorkOrder,
    updateWorkOrderChecklist,
    updateWorkOrderDetails,
    reservePartForWorkOrder,
    createWorkOrderFromAlarm,
    accessibleAlarms,
    parts,
    events,
    consumeReservedPartForWorkOrder,
  } = useDemoData();
  const [filter, setFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [reserveChoices, setReserveChoices] = useState({});
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('Week');
  const [newOrder, setNewOrder] = useState({ description: '', assetId: '', priority: 'Minor', type: 'Corrective' });
  const plans = useMemo(() => getPreventivePlans(selectedSite), [selectedSite]);
  const overdueCount = workOrders.filter(isOverdue).length;
  const openCount = workOrders.filter((item) => item.status !== 'Done').length;
  const checklistItems = workOrders.flatMap((item) => item.checklist || []);
  const checklistCompletion = checklistItems.length
    ? Math.round((checklistItems.filter((item) => item.done).length / checklistItems.length) * 100)
    : 0;
  const plannedCount = workOrders.filter((item) => ['Preventive', 'Predictive'].includes(item.type)).length;
  const plannedRatio = workOrders.length ? Math.round((plannedCount / workOrders.length) * 100) : 0;
  const laborHoursLogged = workOrders.reduce((sum, item) => sum + (Number(item.laborHours) || 0), 0);
  const visible = workOrders.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Overdue') return isOverdue(item);
    if (filter === 'Open') return item.status !== 'Done';
    return item.status === filter;
  });
  const calendarEnd = new Date();
  calendarEnd.setHours(23, 59, 59, 999);
  calendarEnd.setDate(calendarEnd.getDate() + (calendarView === 'Day' ? 1 : calendarView === 'Week' ? 7 : 30));
  const calendarItems = [
    ...workOrders.map((item) => ({ ...item, calendarType: item.type, calendarStatus: isOverdue(item) ? 'Overdue' : item.status || 'Scheduled' })),
    ...plans.map((item) => ({ ...item, id: item.id, calendarType: 'Preventive plan', calendarStatus: 'Scheduled', description: item.task, assignee: item.owner, status: 'Scheduled' })),
  ].filter((item) => item.dueDate && new Date(`${item.dueDate}T23:59:59`) <= calendarEnd)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const generateAlarmWorkOrders = () => {
    const pending = accessibleAlarms.filter((alarm) => alarm.siteId === selectedSite?.id && alarm.state !== 'Cleared' && !alarm.workOrderId);
    pending.forEach((alarm) => createWorkOrderFromAlarm(alarm.id));
    setNotice(pending.length ? `${pending.length} work order${pending.length === 1 ? '' : 's'} generated from active alarms.` : 'No unlinked active alarms need a work order.');
  };

  const reserveForOrder = (order) => {
    const partId = reserveChoices[order.id];
    if (!partId) return;
    const reserved = reservePartForWorkOrder(order.id, partId);
    if (reserved) {
      setNotice(`${parts.find((part) => part.id === partId)?.name || 'Part'} reserved for ${order.id}.`);
      setReserveChoices((current) => ({ ...current, [order.id]: '' }));
    } else {
      setNotice('That part is no longer available for reservation.');
    }
  };

  const consumeReservedPart = (order, part) => {
    const consumed = consumeReservedPartForWorkOrder(order.id, part.id);
    setNotice(consumed ? `1 ${part.name} issued to ${order.id}.` : `Could not issue ${part.name}. Check its reservation and stock.`);
  };

  const createFromPlan = (plan) => {
    const checklist = [
      { id: 'isolate', label: 'Review permit and verify safe isolation', done: false },
      { id: 'inspect', label: `Complete ${plan.checklist.toLowerCase()}`, done: false },
      { id: 'record', label: 'Record findings and close out inspection', done: false },
    ];
    const created = createManualWorkOrder({ siteId: selectedSite?.id, assetId: plan.assetId, description: plan.task, priority: 'Minor', type: 'Preventive', dueDate: plan.dueDate, assignee: plan.owner, checklist, sop: plan.sop });
    setNotice(`${created.id} scheduled from ${plan.id}.`);
  };

  return (
    <PageFrame title="Maintenance & CMMS" description={`Work order execution, preventive maintenance, inspections and resource planning for ${selectedSite?.name || 'the selected site'}.`}>
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Maintenance KPIs">
        {[
          ['Open work orders', openCount, 'All non-completed work'],
          ['Overdue', overdueCount, 'Past due and still open'],
          ['Preventive plans', plans.length, 'Recurring schedules'],
          ['Checklist completion', `${checklistCompletion}%`, `${checklistItems.filter((item) => item.done).length} of ${checklistItems.length} inspection steps`],
          ['Planned work', `${plannedRatio}%`, `${plannedCount} of ${workOrders.length} orders`],
          ['Labor hours logged', `${laborHoursLogged.toFixed(1)} h`, 'Recorded actual hours'],
        ].map(([label, value, detail], index) => {
          const Icon = [ClipboardList, AlertTriangle, CalendarDays, ClipboardCheck, Target, Timer][index];
          return <div key={label} className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><Icon className={`h-4 w-4 ${index === 1 && overdueCount ? 'text-rose-500' : 'text-cyan-500'}`} /></div><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>;
        })}
      </section>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"><Plus className="h-4 w-4 text-cyan-500" />Create work order</h2><p className="mt-1 text-xs text-slate-500">Create a manual corrective, preventive, predictive or emergency task.</p></div>
          <Button size="sm" variant={createOpen ? 'secondary' : 'primary'} onClick={() => setCreateOpen((current) => !current)}>{createOpen ? 'Close form' : 'New work order'}</Button>
        </div>
        {createOpen && <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => {
          event.preventDefault();
          if (!newOrder.description.trim()) return;
          const created = createManualWorkOrder({ siteId: selectedSite?.id, assetId: newOrder.assetId || `${selectedSite?.id}-BMS-01`, ...newOrder });
          setNotice(`${created.id} created for ${selectedSite?.name || 'selected site'}.`);
          setNewOrder({ description: '', assetId: '', priority: 'Minor', type: 'Corrective' });
          setCreateOpen(false);
        }}>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Description<input required value={newOrder.description} onChange={(event) => setNewOrder((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the maintenance task" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Asset ID<input value={newOrder.assetId} onChange={(event) => setNewOrder((current) => ({ ...current, assetId: event.target.value }))} placeholder="Optional asset ID" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Type<select value={newOrder.type} onChange={(event) => setNewOrder((current) => ({ ...current, type: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700"><option>Preventive</option><option>Predictive</option><option>Corrective</option><option>Emergency</option><option>Condition-based</option></select></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Priority<select value={newOrder.priority} onChange={(event) => setNewOrder((current) => ({ ...current, priority: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700"><option>Critical</option><option>Major</option><option>Minor</option></select></label>
          <Button type="submit" size="sm" variant="primary">Create</Button>
        </form>}
        {notice && <p role="status" className="mt-3 text-xs text-cyan-700 dark:text-cyan-300">{notice}</p>}
      </section>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"><CalendarDays className="h-4 w-4 text-cyan-500" />Maintenance calendar</h2><p className="mt-1 text-xs text-slate-500">Upcoming work orders, preventive plans and assigned owners.</p></div><div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">{['Day', 'Week', 'Month'].map((view) => <button key={view} type="button" onClick={() => setCalendarView(view)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold ${calendarView === view ? 'bg-white text-cyan-700 shadow-sm dark:bg-slate-900 dark:text-cyan-300' : 'text-slate-500'}`}>{view}</button>)}</div></div>
        {calendarItems.length ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{calendarItems.map((item) => {
          const overdue = item.calendarStatus === 'Overdue';
          return <div key={item.id} className={`rounded-xl border p-3 ${overdue ? 'border-rose-500/25 bg-rose-500/[0.04]' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{item.calendarType}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusClass(item.calendarStatus, overdue)}`}>{item.calendarStatus}</span></div>
            <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">{item.description}</p>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span>{formatDate(item.dueDate)}</span><span>{item.assignee || 'Unassigned'}</span></div>
            {item.frequency && <><p className="mt-1 text-[10px] text-cyan-700 dark:text-cyan-300">Template · repeats {item.frequency} · SOP: {item.sop}</p><Button size="sm" variant="subtle" className="mt-2" onClick={() => createFromPlan(item)}>Schedule this plan</Button></>}
          </div>;
        })}</div> : <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500 dark:border-slate-800">No work is due in this {calendarView.toLowerCase()} view.</p>}
      </section>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"><ClipboardList className="h-4 w-4 text-cyan-500" />Work orders</h2><p className="mt-1 text-xs text-slate-500">Assign technicians, track execution and open each order’s inspection checklist.</p></div>
          <Button size="sm" variant="secondary" icon={AlertTriangle} onClick={generateAlarmWorkOrders}>Generate from unlinked alarms</Button>
          <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Show <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200"><option>All</option><option>Open</option><option>Overdue</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        </div>
        <div className="space-y-3">
          {visible.map((order) => {
              const overdue = isOverdue(order);
              const reserved = (order.reservedParts || []).map((partId) => parts.find((part) => part.id === partId)).filter(Boolean);
              const availableParts = parts.filter((part) => (!part.siteId || part.siteId === order.siteId) && part.stock > part.reserved && !(order.reservedParts || []).includes(part.id));
              const selectedPart = reserveChoices[order.id] || availableParts[0]?.id || '';
              return <article key={order.id} className="min-w-0 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{order.id}</span><span className="text-[10px] text-slate-500">{selectedSite?.name || order.siteId}</span><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusClass(order.status, overdue)}`}>{overdue ? 'Overdue' : order.status || 'Scheduled'}</span></div>
                    <Link to={`/assets?query=${encodeURIComponent(order.assetId || '')}`} className="mt-2 block break-words text-xs font-semibold text-cyan-700 hover:underline dark:text-cyan-300">{order.assetId || 'Site equipment'}</Link>
                    <p className="mt-1 break-words text-[10px] text-slate-500">{order.description}</p>
                  </div>
                  <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[min(100%,34rem)]">
                    <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Type / priority</span><span className="mt-1 block break-words text-[10px]">{order.type} · {order.priority}</span></div>
                    <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Due</span><span className={`mt-1 block text-[10px] font-semibold ${overdue ? 'text-rose-600 dark:text-rose-400' : ''}`}>{formatDate(order.dueDate)}</span></div>
                    <label className="min-w-0 text-[9px] font-bold uppercase tracking-wide text-slate-500">Technician<select aria-label={`Assign technician to ${order.id}`} value={order.assignee || 'Unassigned'} onChange={(event) => assignWorkOrder(order.id, event.target.value)} className="mt-1 block w-full min-w-0 rounded-lg border border-slate-200 bg-transparent px-2 py-1.5 text-[10px] font-medium normal-case tracking-normal dark:border-slate-700">{technicians.map((technician) => <option key={technician}>{technician}</option>)}</select></label>
                    <label className="min-w-0 text-[9px] font-bold uppercase tracking-wide text-slate-500">Status<select aria-label={`Update status for ${order.id}`} value={order.status || 'Scheduled'} onChange={(event) => updateWorkOrderStatus(order.id, event.target.value)} className={`mt-1 block w-full min-w-0 rounded-lg border-0 px-2 py-1.5 text-[10px] font-semibold normal-case tracking-normal ${statusClass(order.status, overdue)}`}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                  </div>
                  <Button size="sm" variant="subtle" icon={expandedId === order.id ? ClipboardCheck : Plus} onClick={() => setExpandedId((current) => current === order.id ? null : order.id)}>{expandedId === order.id ? 'Close' : 'Details'}</Button>
                </div>
                {expandedId === order.id && <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
                    <div><h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"><ClipboardCheck className="h-4 w-4 text-cyan-500" />Digital inspection checklist</h3><div className="mt-3 space-y-2">{(order.checklist || []).map((item) => <label key={item.id} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] dark:border-slate-700 dark:bg-slate-900"><input type="checkbox" checked={Boolean(item.done)} onChange={(event) => updateWorkOrderChecklist(order.id, item.id, event.target.checked)} className="mt-0.5 accent-cyan-600" /><span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}>{item.label}</span></label>)}</div></div>
                    <div className="mt-5 rounded-xl border border-slate-200 p-3 dark:border-slate-800"><h3 className="text-xs font-bold">Work execution record</h3><p className="mt-1 text-[10px] text-slate-500">SOP: {order.sop || "BESS safe isolation and inspection"} · Source: {order.alarmId ? `Alarm ${order.alarmId}` : order.type === 'Predictive' ? 'Predictive recommendation' : 'Maintenance plan'}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Due date<input type="date" value={order.dueDate || ''} onChange={(event) => updateWorkOrderDetails(order.id, { dueDate: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-[11px] normal-case tracking-normal dark:border-slate-700" /></label><label className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Labor hours<input type="number" min="0" step="0.5" value={order.laborHours || ''} onChange={(event) => updateWorkOrderDetails(order.id, { laborHours: event.target.value })} placeholder="Record hours" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-[11px] normal-case tracking-normal dark:border-slate-700" /></label><label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Work notes<textarea rows={2} value={order.notes || ''} onChange={(event) => updateWorkOrderDetails(order.id, { notes: event.target.value })} placeholder="Record findings and completion notes" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-[11px] normal-case tracking-normal dark:border-slate-700" /></label><label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2"><span className="flex items-center gap-1"><Camera className="h-3 w-3" />Photographic evidence</span><input type="file" accept="image/*" onChange={(event) => updateWorkOrderDetails(order.id, { photoEvidence: event.target.files?.[0]?.name || '' })} className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-[10px] normal-case tracking-normal dark:border-slate-700" />{order.photoEvidence && <span className="mt-1 block normal-case text-emerald-700 dark:text-emerald-300">Attached: {order.photoEvidence} · demo metadata only</span>}</label><label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">Digital sign-off<input value={order.signature || ''} onChange={(event) => updateWorkOrderDetails(order.id, { signature: event.target.value })} placeholder="Type technician name to sign" className="mt-1 block w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-[11px] normal-case tracking-normal dark:border-slate-700" /></label></div></div>
                    <div><h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"><PackagePlus className="h-4 w-4 text-cyan-500" />Parts and material usage</h3><p className="mt-1 text-[10px] text-slate-500">Reserved items can be issued to this job; issuing reduces stock and records consumption.</p><div className="mt-3 space-y-2">{reserved.length ? reserved.map((part) => <div key={part.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2"><span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">{part.name} · {part.id}</span><Button size="sm" variant="subtle" onClick={() => consumeReservedPart(order, part)}>Issue 1 unit</Button></div>) : <span className="text-[10px] text-slate-500">No parts reserved for this work order.</span>}</div>
                      {(order.consumedMaterials || []).length > 0 && <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Consumed materials</p>{order.consumedMaterials.map((material, index) => <p key={`${material.partId}-${index}`} className="mt-1 text-[10px] text-slate-700 dark:text-slate-200">{material.name} · {material.quantity} issued · {new Date(material.timestamp).toLocaleDateString()}</p>)}</div>}
                      <div className="mt-3 flex flex-wrap items-center gap-2"><select aria-label={`Select spare part for ${order.id}`} value={selectedPart} onChange={(event) => setReserveChoices((current) => ({ ...current, [order.id]: event.target.value }))} disabled={!availableParts.length} className="min-w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] dark:border-slate-700 dark:bg-slate-900"><option value="">{availableParts.length ? 'Choose a part' : 'No available parts'}</option>{availableParts.map((part) => <option key={part.id} value={part.id}>{part.name} · {part.stock - part.reserved} available</option>)}</select><Button size="sm" variant="secondary" icon={PackagePlus} disabled={!selectedPart} onClick={() => reserveForOrder(order)}>Reserve part</Button></div>
                    </div>
                  </div>
                  <section className="mt-5 rounded-xl border border-slate-200 p-3 dark:border-slate-800"><h3 className="flex items-center gap-2 text-xs font-bold"><History className="h-4 w-4 text-cyan-500" />Work order history</h3><div className="mt-2 space-y-2">{events.filter((event) => event.workOrderId === order.id).slice(0, 6).map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] dark:border-slate-800"><span>{event.type}{event.status ? ` · ${event.status}` : ''}{event.partName ? ` · ${event.partName}` : ''}</span><span className="text-slate-500">{new Date(event.timestamp).toLocaleString()}</span></div>)}{!events.some((event) => event.workOrderId === order.id) && <p className="text-[10px] text-slate-500">Changes to this work order will be recorded here.</p>}</div></section>
                </div>}
              </article>;
            })}
          {visible.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No work orders match this filter.</p>}
        </div>
      </section>

      <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-xs text-cyan-900 dark:text-cyan-200"><Users className="h-5 w-5 shrink-0" />Technician assignments, checklists, work-order states and part reservations are managed in this workspace; permit approvals are available in Permit-to-Work.</div>
      {notice && <p role="status" className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-emerald-500/20 bg-white px-4 py-3 text-xs font-medium text-emerald-800 shadow-xl dark:bg-slate-900 dark:text-emerald-200">{notice}</p>}
    </PageFrame>
  );
}
