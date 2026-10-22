import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Barcode, CalendarDays, ChevronRight, Clock3, History, Search, ShieldCheck, Wrench } from 'lucide-react';
import PageFrame from '../components/ui/PageFrame';
import { useDemoData } from '../hooks/useDemoData';

const assetTypes = ['All', 'Site', 'Container', 'Rack', 'Module', 'Cell', 'BMS', 'PCS', 'Transformer', 'Switchgear', 'Protection Relay', 'Energy Meter', 'HVAC', 'Fire System', 'UPS', 'Gateway', 'Network Equipment', 'Sensor', 'Auxiliary Power'];

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value || value === '—') return value || '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function addYears(date, years) {
  const value = new Date(`${date}T00:00:00`);
  value.setFullYear(value.getFullYear() + years);
  return value.toISOString().slice(0, 10);
}

function makeAsset(site, suffix, name, type, parentId, options = {}) {
  const parent = options.parent || null;
  const id = suffix ? `${site.id}-${suffix}` : site.id;
  const commissionedDate = options.commissionedDate || site.commissionDate;
  return {
    id,
    name,
    type,
    siteId: site.id,
    parentId,
    parentName: parent?.name || 'Fleet',
    hierarchy: [...(parent?.hierarchy || []), name],
    commissionedDate,
    warrantyExpiry: options.warrantyYears ? addYears(commissionedDate, options.warrantyYears) : '—',
    lastServiceDate: addDays(new Date().toISOString().slice(0, 10), -(options.lastServiceDays ?? 45)),
    nextServiceDate: addDays(new Date().toISOString().slice(0, 10), options.nextServiceDays ?? 30),
    health: options.health ?? site.healthIndex,
    status: options.status || 'Healthy',
    manufacturer: options.manufacturer || site.oem,
    serialNumber: `${id.replaceAll('-', '')}-SN-${String((options.serial || 1) * 1847).padStart(6, '0')}`,
    modelNumber: options.model || `${type.toUpperCase().replaceAll(' ', '-')}-LFP-${String((options.serial || 1) + 100).padStart(3, '0')}`,
    firmware: options.firmware || `v${1 + ((options.serial || 1) % 3)}.${(options.serial || 1) % 10}.4`,
    manufactureDate: addDays(commissionedDate, -180),
    designLifeYears: options.designLife || (type === 'Cell' || type === 'Module' || type === 'Rack' ? 15 : 20),
    criticality: options.criticality || (['BMS', 'PCS', 'Fire System', 'Protection Relay'].includes(type) ? 'High' : 'Medium'),
    rul: options.rul ?? Math.max(1, site.rul - ((options.serial || 1) % 4) * 0.4),
    inspections: [{ date: addDays(new Date().toISOString().slice(0, 10), -30), result: options.status === 'Attention' ? 'Action required' : 'Passed', type: 'Routine inspection' }],
    failures: options.status === 'Attention' ? [{ date: addDays(new Date().toISOString().slice(0, 10), -8), event: 'Condition alert opened', state: 'Under review' }] : [],
    calibration: type === 'BMS' || type === 'Energy Meter' ? { last: addDays(new Date().toISOString().slice(0, 10), -90), next: addDays(new Date().toISOString().slice(0, 10), 275), status: 'Current' } : null,
    documents: [`${type} operation manual`, 'Commissioning certificate'],
    photo: `${name} · demo equipment photo`,
  };
}

function buildSiteAssets(site) {
  if (!site) return [];
  const root = makeAsset(site, '', site.name, 'Site', null, { health: site.healthIndex, status: site.status, nextServiceDays: 30 });
  const container = makeAsset(site, 'CONT-01', 'Battery Container 01', 'Container', root.id, { parent: root, commissionedDate: addDays(site.commissionDate, 60), health: site.healthIndex - 2, warrantyYears: 10, serial: 2, nextServiceDays: 24 });
  const rack = makeAsset(site, 'CONT-01-RACK-02', 'Rack 02', 'Rack', container.id, { parent: container, commissionedDate: addDays(site.commissionDate, 90), health: site.id === 'BESS-JODHUR' ? 74 : site.healthIndex - 4, warrantyYears: 8, serial: 3, status: site.id === 'BESS-JODHUR' ? 'Attention' : 'Healthy', lastServiceDays: 76, nextServiceDays: 4 });
  const secondContainer = makeAsset(site, 'CONT-02', 'Battery Container 02', 'Container', root.id, { parent: root, commissionedDate: addDays(site.commissionDate, 120), health: site.healthIndex - 1, warrantyYears: 10, serial: 4, nextServiceDays: 40 });
  const module = makeAsset(site, 'CONT-01-RACK-02-MOD-04', 'Module 04', 'Module', rack.id, { parent: rack, health: site.healthIndex - 6, serial: 13 });
  const cell = makeAsset(site, 'CONT-01-RACK-02-MOD-04-CELL-07', 'Cell 07', 'Cell', module.id, { parent: module, health: site.id === 'BESS-JODHUR' ? 62 : site.healthIndex - 8, status: site.id === 'BESS-JODHUR' ? 'Attention' : 'Healthy', serial: 14, criticality: 'High' });
  return [
    root,
    container,
    rack,
    module,
    cell,
    secondContainer,
    makeAsset(site, 'BMS-01', 'Battery Management System', 'BMS', container.id, { parent: container, health: site.healthIndex - 3, warrantyYears: 6, serial: 5, nextServiceDays: 14, lastServiceDays: 33 }),
    makeAsset(site, 'PCS-01', 'Power Conversion System 1', 'PCS', root.id, { parent: root, health: site.healthIndex + 1, warrantyYears: 5, serial: 6, nextServiceDays: 45, lastServiceDays: 82 }),
    makeAsset(site, 'TRF-01', 'Main Transformer', 'Transformer', root.id, { parent: root, health: site.healthIndex, warrantyYears: 10, serial: 7, nextServiceDays: 90, lastServiceDays: 110 }),
    makeAsset(site, 'SWG-01', 'Main Switchgear', 'Switchgear', root.id, { parent: root, health: site.healthIndex + 2, warrantyYears: 8, serial: 8, nextServiceDays: 60, lastServiceDays: 170 }),
    makeAsset(site, 'PR-01', 'Protection Relay', 'Protection Relay', root.id, { parent: root, serial: 15, warrantyYears: 6 }),
    makeAsset(site, 'MTR-01', 'Revenue Energy Meter', 'Energy Meter', root.id, { parent: root, serial: 16, warrantyYears: 8 }),
    makeAsset(site, 'HVAC-01', 'HVAC Unit 1', 'HVAC', secondContainer.id, { parent: secondContainer, health: site.healthIndex - 2, warrantyYears: 5, serial: 9, nextServiceDays: 7, lastServiceDays: 27 }),
    makeAsset(site, 'HVAC-02', 'HVAC Unit 2', 'HVAC', secondContainer.id, { parent: secondContainer, health: site.id === 'BESS-JODHUR' ? 68 : site.healthIndex - 1, warrantyYears: 5, serial: 10, nextServiceDays: 2, lastServiceDays: 55, status: site.id === 'BESS-JODHUR' ? 'Attention' : 'Healthy' }),
    makeAsset(site, 'FIRE-01', 'Fire Detection & Suppression', 'Fire System', root.id, { parent: root, health: site.id === 'BESS-JODHUR' ? 72 : 96, warrantyYears: 5, serial: 11, nextServiceDays: 1, lastServiceDays: 31, status: site.id === 'BESS-JODHUR' ? 'Attention' : 'Healthy' }),
    makeAsset(site, 'GW-01', 'Edge Gateway', 'Gateway', root.id, { parent: root, health: site.commsStatus === 'Offline' ? 0 : 98, warrantyYears: 4, serial: 12, nextServiceDays: 80, lastServiceDays: 15, status: site.commsStatus === 'Offline' ? 'Offline' : 'Healthy' }),
    makeAsset(site, 'UPS-01', 'Control UPS', 'UPS', root.id, { parent: root, serial: 17, warrantyYears: 5 }),
    makeAsset(site, 'NET-01', 'Industrial Network Switch', 'Network Equipment', root.id, { parent: root, serial: 18, warrantyYears: 4 }),
    makeAsset(site, 'SENS-01', 'Environmental Sensor Array', 'Sensor', root.id, { parent: root, serial: 19, warrantyYears: 3 }),
    makeAsset(site, 'AUX-01', 'Auxiliary Power Panel', 'Auxiliary Power', root.id, { parent: root, serial: 20, warrantyYears: 6 }),
  ];
}

function getDetailRoute(asset) {
  if (['BMS', 'Container', 'Rack'].includes(asset.type)) return `/site/${asset.siteId}/battery`;
  if (asset.type === 'PCS') return `/site/${asset.siteId}/pcs`;
  return `/site/${asset.siteId}`;
}

export default function AssetRegistry() {
  const { selectedSite, workOrders, selectSite } = useDemoData();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedAssetId, setSelectedAssetId] = useState(selectedSite?.id || '');
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const assets = useMemo(() => buildSiteAssets(selectedSite), [selectedSite]);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) || assets[0];
  useEffect(() => setSelectedAssetId(selectedSite?.id || ''), [selectedSite?.id]);
  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const matchesQuery = `${asset.id} ${asset.name} ${asset.type} ${asset.parentName} ${asset.hierarchy.join(' ')}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (typeFilter === 'All' || asset.type === typeFilter);
  }), [assets, query, typeFilter]);
  const attentionCount = assets.filter((asset) => asset.status === 'Attention' || asset.status === 'Offline' || asset.health < 80).length;
  const expiringWarrantyCount = assets.filter((asset) => {
    if (asset.warrantyExpiry === '—') return false;
    const remaining = new Date(`${asset.warrantyExpiry}T00:00:00`) - new Date();
    return remaining >= 0 && remaining <= 365 * 24 * 60 * 60 * 1000;
  }).length;
  const historyOrders = selectedAsset
    ? workOrders.filter((order) => order.siteId === selectedSite?.id && assets.some((asset) => asset.id === order.assetId && asset.hierarchy.includes(selectedAsset.name)))
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
    : [];
  const hierarchyAssets = selectedAsset ? selectedAsset.hierarchy.map((name) => assets.find((asset) => asset.name === name)).filter(Boolean) : [];

  return (
    <PageFrame title="Asset Registry" description={`Central asset hierarchy, lifecycle records and service history for ${selectedSite?.name || 'the selected site'}.`}>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Asset lifecycle summary">
        {[
          ['Registered assets', assets.length, 'In selected site'],
          ['Needs attention', attentionCount, 'Health or status review'],
          ['Warranty expiring', expiringWarrantyCount, 'Within the next 12 months'],
        ].map(([label, value, detail]) => <div key={label} className="surface-card rounded-2xl border bg-white p-4 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>)}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <section className="surface-card min-w-0 rounded-2xl border bg-white p-5 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assets or hierarchy…" className="min-w-40 bg-transparent text-xs outline-none" /></div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Type <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-xs font-medium normal-case tracking-normal text-slate-700 dark:border-slate-700 dark:text-slate-200">{assetTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800"><th className="pb-3">Asset / hierarchy</th><th className="pb-3">Type</th><th className="pb-3">Health / criticality</th><th className="pb-3">Status</th><th className="pb-3">Commissioned</th><th className="pb-3">Warranty expiry</th><th className="pb-3">Details</th></tr></thead>
              <tbody>{filteredAssets.map((asset) => <tr key={asset.id} className={`border-b border-slate-100 dark:border-slate-800 ${selectedAsset?.id === asset.id ? 'bg-cyan-500/[0.04]' : ''}`}>
                <td className="py-3"><button type="button" onClick={() => setSelectedAssetId(asset.id)} className="text-left"><span className="font-semibold text-slate-900 dark:text-white">{asset.name}</span><span className="mt-0.5 block font-mono text-[10px] text-slate-400">{asset.id}</span><span className="mt-1 block text-[10px] text-slate-400">{asset.hierarchy.slice(0, -1).join(' / ') || 'Fleet'}</span></button></td>
                <td className="py-3 text-[10px]">{asset.type}</td>
                <td className="py-3"><strong className="tabular-nums">{asset.health}/100</strong><span className="mt-1 block text-[9px] text-slate-500">{asset.criticality} criticality</span></td>
                <td className="py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${['Attention', 'Offline', 'Fault'].includes(asset.status) ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>{asset.status}</span></td>
                <td className="py-3 whitespace-nowrap">{formatDate(asset.commissionedDate)}</td>
                <td className="py-3 whitespace-nowrap">{formatDate(asset.warrantyExpiry)}</td>
                <td className="py-3"><button type="button" onClick={() => setSelectedAssetId(asset.id)} className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 px-2 py-1.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300"><Wrench className="h-3 w-3" /> Details</button><Barcode className="ml-2 inline h-4 w-4 text-slate-400" /></td>
              </tr>)}</tbody>
            </table>
            {filteredAssets.length === 0 && <p className="py-10 text-center text-xs text-slate-500">No assets match this search.</p>}
          </div>
        </section>

        {selectedAsset && <aside className="surface-card rounded-2xl border bg-white p-5 dark:bg-slate-900" aria-label="Selected asset details">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">Asset details</p><h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selectedAsset.name}</h2><p className="mt-1 font-mono text-[10px] text-slate-400">{selectedAsset.id}</p></div>
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedAsset.type}</span>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Hierarchy path</p>
            <div className="flex flex-wrap items-center gap-1 text-[10px]">{hierarchyAssets.map((asset, index) => <React.Fragment key={asset.id}>{index > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}<button type="button" onClick={() => setSelectedAssetId(asset.id)} className={asset.id === selectedAsset.id ? 'font-bold text-cyan-700 dark:text-cyan-300' : 'text-slate-500 hover:text-cyan-600'}>{asset.name}</button></React.Fragment>)}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['Health', `${selectedAsset.health}/100`, ShieldCheck],
              ['Warranty', formatDate(selectedAsset.warrantyExpiry), CalendarDays],
              ['Commissioned', formatDate(selectedAsset.commissionedDate), CalendarDays],
              ['Next service', formatDate(selectedAsset.nextServiceDate), Clock3],
              ['Last service', formatDate(selectedAsset.lastServiceDate), History],
              ['Manufacturer', selectedAsset.manufacturer, Barcode],
            ].map(([label, value, Icon]) => <div key={label} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60"><p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-500"><Icon className="h-3 w-3" />{label}</p><p className="mt-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{value}</p></div>)}
          </div>
          <p className="mt-3 text-[10px] text-slate-500">Serial number <span className="ml-1 font-mono text-slate-700 dark:text-slate-300">{selectedAsset.serialNumber}</span></p>
          <button type="button" onClick={() => setBarcodeOpen((open) => !open)} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300"><Barcode className="h-3.5 w-3.5" />{barcodeOpen ? 'Hide asset code' : 'Show QR / barcode'}</button>
          {barcodeOpen && <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div aria-label={`Demo barcode for ${selectedAsset.id}`} className="flex h-12 items-stretch gap-[2px] bg-white px-2 py-1">{Array.from({ length: 32 }, (_, index) => <span key={index} className={`${(selectedAsset.id.charCodeAt(index % selectedAsset.id.length) + index) % 3 ? 'w-[2px]' : 'w-[4px]'} bg-slate-900`} />)}</div><div><p className="font-mono text-[10px] font-bold">{selectedAsset.id}</p><p className="mt-1 text-[9px] text-slate-500">Illustrative scannable-asset placeholder</p></div></div>}
          <div className="mt-4 grid grid-cols-2 gap-3 text-[10px]">
            {[['Model', selectedAsset.modelNumber], ['Firmware', selectedAsset.firmware], ['Manufactured', formatDate(selectedAsset.manufactureDate)], ['Design life', `${selectedAsset.designLifeYears} years`], ['Estimated RUL', `${selectedAsset.rul.toFixed(1)} years`], ['GPS', `${selectedSite?.lat}°, ${selectedSite?.lng}°`]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60"><p className="uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">{value}</p></div>)}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Inspection / failure history</h3>{selectedAsset.inspections.map((record) => <p key={record.date} className="mt-2 text-[10px] text-slate-700 dark:text-slate-300">{formatDate(record.date)} · {record.type}: {record.result}</p>)}{selectedAsset.failures.map((record) => <p key={record.date} className="mt-2 text-[10px] text-amber-700 dark:text-amber-300">{formatDate(record.date)} · {record.event} ({record.state})</p>)}{selectedAsset.calibration && <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-300">Calibration: {formatDate(selectedAsset.calibration.last)} · next {formatDate(selectedAsset.calibration.next)}</p>}</div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Documents and photo</h3>{selectedAsset.documents.map((document) => <p key={document} className="mt-2 text-[10px] text-cyan-700 dark:text-cyan-300">▤ {document}</p>)}<p className="mt-2 text-[10px] text-slate-500">▧ {selectedAsset.photo}</p></div>
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"><History className="h-4 w-4 text-cyan-500" />Maintenance history</h3><span className="text-[10px] text-slate-400">{historyOrders.length} records</span></div>
            {historyOrders.length ? <div className="space-y-2">{historyOrders.slice(0, 4).map((order) => <div key={order.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"><div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300">{order.id}</span><span className="text-[10px] text-slate-400">{formatDate(order.dueDate)}</span></div><p className="mt-1 text-[11px] font-semibold text-slate-800 dark:text-slate-200">{order.description}</p><p className="mt-1 text-[10px] text-slate-500">{order.type} · {order.status || 'Scheduled'} · {order.assignee || 'Unassigned'}</p></div>)}</div> : <p className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 dark:bg-slate-800/60">No maintenance records are linked to this asset yet.</p>}
          </div>
          <Link to={getDetailRoute(selectedAsset)} onClick={() => selectSite(selectedAsset.siteId)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-cyan-700">Open asset operating view<ChevronRight className="h-4 w-4" /></Link>
        </aside>}
      </div>
    </PageFrame>
  );
}
