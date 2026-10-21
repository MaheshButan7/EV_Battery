import React, { useEffect, useMemo, useRef, useState } from 'react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import Button from '../components/ui/Button';
import { AlertTriangle, ArrowDownToLine, ClipboardList, Package, Plus, ShoppingCart } from 'lucide-react';

const availableQuantity = (part) => Math.max(0, part.stock - part.reserved);

export default function Inventory() {
  const { parts, events, reservePart, updatePartStock, selectedSite } = useDemoData();
  const transactionForm = useRef(null);
  const siteParts = useMemo(() => parts.filter((part) => (
    part.siteId === selectedSite?.id || part.siteId === null
  )), [parts, selectedSite?.id]);
  const [transaction, setTransaction] = useState({ partId: siteParts[0]?.id || '', type: 'Receive', quantity: '1' });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!siteParts.some((part) => part.id === transaction.partId)) {
      setTransaction((current) => ({ ...current, partId: siteParts[0]?.id || '' }));
    }
  }, [siteParts, transaction.partId]);

  const selectedPart = siteParts.find((part) => part.id === transaction.partId);
  const lowStockParts = useMemo(() => siteParts
    .map((part) => ({ ...part, available: availableQuantity(part), reorderQuantity: Math.max(0, part.minimum - availableQuantity(part)) }))
    .filter((part) => part.reorderQuantity > 0)
    .sort((a, b) => b.reorderQuantity - a.reorderQuantity), [siteParts]);
  const reservedUnits = siteParts.reduce((sum, part) => sum + part.reserved, 0);
  const inventoryEvents = useMemo(() => events
    .filter((event) => event.siteId === selectedSite?.id && event.partId)
    .slice(0, 5), [events, selectedSite?.id]);

  const prepareRestock = (part) => {
    setTransaction({ partId: part.id, type: 'Receive', quantity: String(part.reorderQuantity) });
    setNotice(`Receive ${part.reorderQuantity} units of ${part.name} to reach its minimum level.`);
    transactionForm.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submitTransaction = (event) => {
    event.preventDefault();
    const quantity = Number(transaction.quantity);
    const minimumInput = transaction.type === 'Adjust' ? 0 : 1;
    if (!selectedPart) {
      setNotice('Select a part available at this site or the central store.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < minimumInput) {
      setNotice(transaction.type === 'Adjust'
        ? 'Enter a whole-number on-hand quantity of zero or more.'
        : 'Enter a whole-number quantity greater than zero.');
      return;
    }

    const delta = transaction.type === 'Receive'
      ? quantity
      : transaction.type === 'Issue'
        ? -quantity
        : quantity - selectedPart.stock;
    if (delta === 0) {
      setNotice(`${selectedPart.id} already has ${quantity} units on hand.`);
      return;
    }

    const ok = updatePartStock(selectedPart.id, delta, `Inventory ${transaction.type.toLowerCase()}`);
    setNotice(ok
      ? transaction.type === 'Adjust'
        ? `On-hand quantity for ${selectedPart.id} set to ${quantity}.`
        : `${transaction.type} transaction recorded for ${selectedPart.id}.`
      : 'Transaction would reduce stock below the reserved quantity.');
  };

  if (!selectedSite) {
    return <PageFrame title="Inventory" description="Select a site to view its spare parts and stock levels." />;
  }

  return (
    <PageFrame
      title="Inventory"
      description={`${selectedSite.name} spare parts, with shared central-store stock included in this site view.`}
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Site inventory summary">
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
          <Package className="h-5 w-5 text-cyan-500" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Parts in view</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{siteParts.length}</p>
          <p className="mt-1 text-[10px] text-slate-500">Site store and shared stock</p>
        </div>
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
          <ShoppingCart className="h-5 w-5 text-amber-500" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Below minimum</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{lowStockParts.length}</p>
          <p className="mt-1 text-[10px] text-slate-500">Based on unreserved available stock</p>
        </div>
        <div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900">
          <Plus className="h-5 w-5 text-emerald-500" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Reserved units</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{reservedUnits}</p>
          <p className="mt-1 text-[10px] text-slate-500">Across the parts shown below</p>
        </div>
      </section>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Replenishment recommendations">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Replenishment needs</h2>
            <p className="mt-1 text-xs text-slate-500">Available stock is on hand minus reserved. Quantities below bring each part back to its minimum.</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${lowStockParts.length ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
            {lowStockParts.length ? `${lowStockParts.length} to review` : 'Stock levels healthy'}
          </span>
        </div>
        {lowStockParts.length ? (
          <div>
            <div className="mb-2 hidden grid-cols-[minmax(260px,1fr)_100px_100px_130px_170px] gap-4 px-4 text-[9px] font-bold uppercase tracking-wide text-slate-500 xl:grid">
              <span>Part / store</span><span className="text-right">Available</span><span className="text-right">Minimum</span><span className="text-right">Shortfall</span><span className="text-right">Action</span>
            </div>
            <div className="space-y-2">
              {lowStockParts.map((part) => (
                <div key={part.id} className="grid grid-cols-2 items-center gap-x-4 gap-y-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.035] p-3 sm:grid-cols-4 sm:p-4 xl:grid-cols-[minmax(260px,1fr)_100px_100px_130px_170px] xl:gap-4">
                  <div className="col-span-2 flex min-w-0 items-start gap-3 sm:col-span-4 xl:col-span-1">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{part.name}</p>
                      <p className="mt-1 text-[10px] text-slate-500"><span className="font-mono">{part.id}</span> · {part.location}{part.siteId === null ? ' · Shared store' : ''}</p>
                    </div>
                  </div>
                  <div className="xl:text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Available</p>
                    <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">{part.available}</p>
                  </div>
                  <div className="xl:text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Minimum</p>
                    <p className="mt-0.5 text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">{part.minimum}</p>
                  </div>
                  <div className="xl:text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">Shortfall</p>
                    <p className="mt-0.5 text-xs font-semibold tabular-nums text-amber-700 dark:text-amber-300">{part.reorderQuantity} units</p>
                  </div>
                  <div className="col-span-2 flex justify-end sm:col-span-1 xl:col-span-1">
                    <Button size="sm" variant="subtle" icon={ArrowDownToLine} className="w-full sm:w-auto" onClick={() => prepareRestock(part)}>Prepare restock</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="rounded-xl bg-emerald-500/[0.06] p-4 text-xs text-emerald-700 dark:text-emerald-300">All parts at this site and in the central store meet their minimum stock levels.</p>
        )}
      </section>

      <form ref={transactionForm} onSubmit={submitTransaction} className="surface-card flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <div className="w-full sm:mr-auto sm:w-auto">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Stock transaction</h2>
          <p className="mt-1 text-[10px] text-slate-500">Record a receipt, issue or stock count adjustment.</p>
        </div>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Part
          <select value={transaction.partId} onChange={(event) => setTransaction((current) => ({ ...current, partId: event.target.value }))} className="mt-1 block min-w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs normal-case tracking-normal text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {siteParts.map((part) => <option key={part.id} value={part.id}>{part.id} · {part.name}{part.siteId === null ? ' (Central)' : ''}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Transaction
          <select value={transaction.type} onChange={(event) => setTransaction((current) => ({ ...current, type: event.target.value }))} className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs normal-case tracking-normal text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option>Receive</option><option>Issue</option><option>Adjust</option>
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {transaction.type === 'Adjust' ? 'New on hand' : 'Quantity'}
          <input min={transaction.type === 'Adjust' ? '0' : '1'} step="1" type="number" value={transaction.quantity} onChange={(event) => setTransaction((current) => ({ ...current, quantity: event.target.value }))} className="mt-1 block w-28 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal text-slate-800 dark:border-slate-700 dark:text-slate-200" />
        </label>
        <Button type="submit" size="sm" variant="primary">Record transaction</Button>
        {notice && <p role="status" className="w-full text-xs text-cyan-700 dark:text-cyan-300">{notice}</p>}
      </form>

      <section className="surface-card overflow-x-auto rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Parts stock table">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Parts at {selectedSite.name}</h2>
            <p className="mt-1 text-xs text-slate-500">Central store entries are shared across site views.</p>
          </div>
          <span className="text-[10px] font-medium text-slate-400">{siteParts.length} part types</span>
        </div>
        <table className="w-full min-w-[850px] text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <th className="pb-3">Part</th><th className="pb-3">Category</th><th className="pb-3">Location</th><th className="pb-3">On hand</th><th className="pb-3">Reserved</th><th className="pb-3">Available</th><th className="pb-3">Minimum</th><th className="pb-3">Status</th><th className="pb-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {siteParts.map((part) => {
              const available = availableQuantity(part);
              const low = available < part.minimum;
              const outOfStock = available === 0;
              return (
                <tr key={part.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="py-3"><strong className="text-slate-800 dark:text-slate-200">{part.name}</strong><br /><span className="font-mono text-[10px] text-slate-400">{part.id}</span></td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{part.category}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{part.location}{part.siteId === null && <span className="mt-0.5 block text-[9px] text-cyan-700 dark:text-cyan-300">Shared store</span>}</td>
                  <td className="py-3 tabular-nums">{part.stock}</td>
                  <td className="py-3 tabular-nums">{part.reserved}</td>
                  <td className={`py-3 font-semibold tabular-nums ${low ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>{available}</td>
                  <td className="py-3 tabular-nums">{part.minimum}</td>
                  <td className={`py-3 font-semibold ${outOfStock ? 'text-rose-600 dark:text-rose-400' : low ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{outOfStock ? 'Out of stock' : low ? 'Reorder' : 'Healthy'}</td>
                  <td className="py-3"><Button size="sm" variant="subtle" disabled={part.stock <= part.reserved} onClick={() => reservePart(part.id)}>Reserve</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Recent site stock activity">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><ClipboardList className="h-4 w-4 text-cyan-500" />Recent stock activity</h2>
        <div className="mt-3 space-y-2">
          {inventoryEvents.length === 0 ? (
            <p className="text-xs text-slate-500">Receipts, issues, adjustments and reservations for this site will appear here.</p>
          ) : inventoryEvents.map((event) => (
            <div key={event.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 text-xs dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-200">{event.type} · {event.partName || event.partId}{event.quantity ? ` · ${event.quantity} units` : ''}</span>
              <span className="font-mono text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
