import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';
import { Barcode, Search, Wrench } from 'lucide-react';

const assetTypes = ['Site', 'Container', 'Rack', 'Module', 'Cell', 'PCS', 'Transformer', 'HVAC', 'Fire System', 'Gateway'];

export default function AssetRegistry() {
  const { selectedSite } = useDemoData();
  const accessibleSites = selectedSite ? [selectedSite] : [];
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const assets = useMemo(() => accessibleSites.flatMap((site) => [
    { id: site.id, name: site.name, type: 'Site', parent: 'All Sites', health: site.healthIndex, warranty: 'Active', site: site.id },
    { id: `${site.id}-PCS-01`, name: 'Power Conversion System 1', type: 'PCS', parent: site.id, health: site.healthIndex + 1, warranty: 'Active', site: site.id },
    { id: `${site.id}-HVAC-01`, name: 'HVAC Unit 1', type: 'HVAC', parent: site.id, health: site.healthIndex - 2, warranty: 'Active', site: site.id },
    { id: `${site.id}-GW-01`, name: 'Edge Gateway', type: 'Gateway', parent: site.id, health: site.commsStatus === 'Offline' ? 0 : 98, warranty: 'Active', site: site.id },
  ]).filter((asset) => `${asset.id} ${asset.name} ${asset.type} ${asset.site}`.toLowerCase().includes(query.toLowerCase())), [query, accessibleSites]);
  return <PageFrame title="Asset Registry" description="Searchable asset hierarchy and lifecycle records across sites and equipment classes."><div className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets…" className="bg-transparent text-xs outline-none" /></div><div className="flex flex-wrap gap-1">{assetTypes.slice(0, 5).map((type) => <span key={type} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] dark:bg-slate-800">{type}</span>)}</div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-xs"><thead><tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800"><th className="pb-3">Asset</th><th className="pb-3">Type</th><th className="pb-3">Parent</th><th className="pb-3">Health</th><th className="pb-3">Warranty</th><th className="pb-3">Actions</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id} className="border-b border-slate-100 dark:border-slate-800"><td className="py-3"><strong>{asset.name}</strong><br /><span className="font-mono text-[10px] text-slate-400">{asset.id}</span></td><td className="py-3">{asset.type}</td><td className="py-3">{asset.parent}</td><td className="py-3 font-bold">{asset.health || '—'}{asset.health ? '/100' : ''}</td><td className="py-3 text-emerald-600">{asset.warranty}</td><td className="py-3"><button type="button" className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300"><Wrench className="h-3 w-3" /> Details</button><Barcode className="ml-2 inline h-4 w-4 text-slate-400" /></td></tr>)}</tbody></table></div></div></PageFrame>;
}
