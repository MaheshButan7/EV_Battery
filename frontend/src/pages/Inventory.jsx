import React, { useState } from 'react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import Button from '../components/ui/Button';
import { Package, Plus, ShoppingCart } from 'lucide-react';

export default function Inventory() {
  const { parts, reservePart, updatePartStock, selectedSite } = useDemoData();
  const [transaction, setTransaction] = useState({ partId: parts[0]?.id || '', type: 'Receive', quantity: 1 });
  const [notice, setNotice] = useState('');
  const submitTransaction = (event) => {
    event.preventDefault();
    const quantity = Number(transaction.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      setNotice('Enter a whole-number quantity greater than zero.');
      return;
    }
    const delta = transaction.type === 'Receive' ? quantity : -quantity;
    const ok = updatePartStock(transaction.partId, delta, `Inventory ${transaction.type.toLowerCase()}`);
    setNotice(ok ? `${transaction.type} transaction recorded for ${transaction.partId}.` : 'Transaction would reduce stock below reserved quantity.');
  };
  return (
    <PageFrame title="Inventory" description={`Spare parts, stock levels and work-order reservations for ${selectedSite?.name || 'the selected site'}.`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><Package className="h-5 w-5 text-cyan-500" /><p className="mt-3 text-xs uppercase text-slate-500">Part types</p><p className="mt-1 text-3xl font-bold">{parts.length}</p></div><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><ShoppingCart className="h-5 w-5 text-amber-500" /><p className="mt-3 text-xs uppercase text-slate-500">Low stock</p><p className="mt-1 text-3xl font-bold">{parts.filter((part) => part.stock - part.reserved < part.minimum).length}</p></div><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><Plus className="h-5 w-5 text-emerald-500" /><p className="mt-3 text-xs uppercase text-slate-500">Reserved</p><p className="mt-1 text-3xl font-bold">{parts.reduce((sum, part) => sum + part.reserved, 0)}</p></div></div>
      <form onSubmit={submitTransaction} className="surface-card mb-5 flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-5 dark:bg-slate-900">
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Part<select value={transaction.partId} onChange={(event) => setTransaction((current) => ({ ...current, partId: event.target.value }))} className="mt-1 block min-w-48 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700">{parts.map((part) => <option key={part.id} value={part.id}>{part.id} · {part.name}</option>)}</select></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Transaction<select value={transaction.type} onChange={(event) => setTransaction((current) => ({ ...current, type: event.target.value }))} className="mt-1 block rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700"><option>Receive</option><option>Issue</option><option>Adjust</option></select></label>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Quantity<input min="1" step="1" type="number" value={transaction.quantity} onChange={(event) => setTransaction((current) => ({ ...current, quantity: event.target.value }))} className="mt-1 block w-24 rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs normal-case tracking-normal dark:border-slate-700" /></label>
        <Button type="submit" size="sm" variant="primary">Record transaction</Button>
        {notice && <p role="status" className="w-full text-xs text-cyan-700 dark:text-cyan-300">{notice}</p>}
      </form>
      <div className="surface-card overflow-x-auto rounded-2xl border bg-white p-5 dark:bg-slate-900"><table className="w-full min-w-[720px] text-xs"><thead><tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800"><th className="pb-3">Part</th><th className="pb-3">Location</th><th className="pb-3">On hand</th><th className="pb-3">Reserved</th><th className="pb-3">Minimum</th><th className="pb-3">State</th><th className="pb-3">Action</th></tr></thead><tbody>{parts.map((part) => { const low = part.stock - part.reserved < part.minimum; return <tr key={part.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3"><strong>{part.name}</strong><br /><span className="font-mono text-slate-400">{part.id}</span></td><td className="py-3">{part.location}</td><td className="py-3">{part.stock}</td><td className="py-3">{part.reserved}</td><td className="py-3">{part.minimum}</td><td className={`py-3 font-semibold ${low ? 'text-amber-600' : 'text-emerald-600'}`}>{low ? 'Reorder' : 'Healthy'}</td><td className="py-3"><Button size="sm" variant="subtle" disabled={part.stock <= part.reserved} onClick={() => reservePart(part.id)}>Reserve</Button></td></tr>; })}</tbody></table></div>
    </PageFrame>
  );
}
