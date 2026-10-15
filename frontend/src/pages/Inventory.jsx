import React from 'react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import Button from '../components/ui/Button';
import { Package, Plus, ShoppingCart } from 'lucide-react';

export default function Inventory() {
  const { parts, reservePart, selectedSite } = useDemoData();
  return (
    <PageFrame title="Inventory" description={`Spare parts, stock levels and work-order reservations for ${selectedSite?.name || 'the selected site'}.`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><Package className="h-5 w-5 text-cyan-500" /><p className="mt-3 text-xs uppercase text-slate-500">Part types</p><p className="mt-1 text-3xl font-bold">{parts.length}</p></div><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><ShoppingCart className="h-5 w-5 text-amber-500" /><p className="mt-3 text-xs uppercase text-slate-500">Low stock</p><p className="mt-1 text-3xl font-bold">{parts.filter((part) => part.stock - part.reserved < part.minimum).length}</p></div><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><Plus className="h-5 w-5 text-emerald-500" /><p className="mt-3 text-xs uppercase text-slate-500">Reserved</p><p className="mt-1 text-3xl font-bold">{parts.reduce((sum, part) => sum + part.reserved, 0)}</p></div></div>
      <div className="surface-card overflow-x-auto rounded-2xl border bg-white p-5 dark:bg-slate-900"><table className="w-full min-w-[720px] text-xs"><thead><tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800"><th className="pb-3">Part</th><th className="pb-3">Location</th><th className="pb-3">On hand</th><th className="pb-3">Reserved</th><th className="pb-3">Minimum</th><th className="pb-3">State</th><th className="pb-3">Action</th></tr></thead><tbody>{parts.map((part) => { const low = part.stock - part.reserved < part.minimum; return <tr key={part.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3"><strong>{part.name}</strong><br /><span className="font-mono text-slate-400">{part.id}</span></td><td className="py-3">{part.location}</td><td className="py-3">{part.stock}</td><td className="py-3">{part.reserved}</td><td className="py-3">{part.minimum}</td><td className={`py-3 font-semibold ${low ? 'text-amber-600' : 'text-emerald-600'}`}>{low ? 'Reorder' : 'Healthy'}</td><td className="py-3"><Button size="sm" variant="subtle" disabled={part.stock <= part.reserved} onClick={() => reservePart(part.id)}>Reserve</Button></td></tr>; })}</tbody></table></div>
    </PageFrame>
  );
}
