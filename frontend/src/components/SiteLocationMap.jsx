import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, LocateFixed, Search } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS = {
  Charging: { color: '#10b981', label: 'Charging' },
  Discharging: { color: '#06b6d4', label: 'Discharging' },
  Idle: { color: '#94a3b8', label: 'Idle' },
  Fault: { color: '#f43f5e', label: 'Fault' },
  Offline: { color: '#64748b', label: 'Offline' },
};

const INDIA_BOUNDS = [[7, 68], [29, 83]];

function MapViewport({ sites }) {
  const map = useMap();

  useEffect(() => {
    if (sites.length === 1) {
      map.setView([sites[0].lat, sites[0].lng], 8);
    } else if (sites.length > 1) {
      map.fitBounds(sites.map((site) => [site.lat, site.lng]), { padding: [36, 36], maxZoom: 7 });
    } else {
      map.fitBounds(INDIA_BOUNDS);
    }
  }, [map, sites]);

  return null;
}

function FitToFleetButton({ sites }) {
  const map = useMap();
  const bounds = sites.length ? sites.map((site) => [site.lat, site.lng]) : INDIA_BOUNDS;

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button type="button" className="flex bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-slate-50" onClick={() => map.fitBounds(bounds, { padding: [36, 36], maxZoom: 7 })} title="Fit to visible sites">
          <LocateFixed className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function siteIcon(site) {
  const color = STATUS[site.status]?.color || STATUS.Idle.color;
  return L.divIcon({
    className: 'bess-map-marker',
    html: `<span style="--marker-color:${color}"><span class="bess-map-marker-dot"></span></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

export default function SiteLocationMap({ sites = [], onSelectSite }) {
  const navigate = useNavigate();
  const [focusedSite, setFocusedSite] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [layers, setLayers] = useState({ health: true, availability: true, alarms: true });
  const statuses = ['Charging', 'Discharging', 'Offline', 'Fault'];
  const visibleSites = sites.filter((site) => {
    const matchesQuery = `${site.name} ${site.id} ${site.location}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'All' || site.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const markerIcons = useMemo(
    () => new Map(sites.map((site) => [site.id, siteIcon(site)])),
    [sites],
  );

  const openSite = (site) => {
    onSelectSite?.(site.id);
    navigate(`/site/${site.id}`);
  };

  return (
    <section className="surface-card flex h-full min-h-[500px] flex-col rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Site locations</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Live geographic view of BESS assets across India</p>
        </div>
        <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {sites.length} sites
        </span>
      </header>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search site or location" className="min-w-0 flex-1 bg-transparent outline-none" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-xs dark:border-slate-700">
          <option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        {Object.entries({ health: 'Health', availability: 'Availability', alarms: 'Alarms' }).map(([key, label]) => (
          <label key={key} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <input type="checkbox" checked={layers[key]} onChange={(event) => setLayers((current) => ({ ...current, [key]: event.target.checked }))} />
            {label}
          </label>
        ))}
      </div>

      <div className="relative mt-4 min-h-[350px] flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <MapContainer
          bounds={INDIA_BOUNDS}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={0.8}
          minZoom={4}
          maxZoom={13}
          scrollWheelZoom
          className="h-full min-h-[350px] w-full"
          aria-label="Interactive map of BESS sites in India"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport sites={visibleSites} />
          <FitToFleetButton sites={visibleSites} />
          {visibleSites.map((site) => (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={markerIcons.get(site.id)}
              eventHandlers={{
                click: () => setFocusedSite(site),
                mouseover: () => setFocusedSite(site),
              }}
            >
              <Popup>
                <div className="min-w-[190px] text-xs">
                  <p className="font-bold text-slate-900">{site.name}</p>
                  <p className="mt-1 text-slate-500">{site.location}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                    <span>Status</span><strong>{site.status}</strong>
                    <span>State of charge</span><strong>{site.soc}%</strong>
                    <span>Capacity</span><strong>{site.capacityMW} MW</strong>
                    <span>Communications</span><strong>{site.commsStatus}</strong>
                    {layers.health && <><span>Battery health</span><strong>{site.soh}% SoH</strong></>}
                    {layers.availability && <><span>Availability</span><strong>{site.availability}%</strong></>}
                    {layers.alarms && <><span>Active alarms</span><strong>{site.activeAlarms}</strong></>}
                    <span>Weather</span><strong>{site.temperature}°C · Clear</strong>
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-md bg-cyan-600 px-2.5 py-2 text-[11px] font-semibold text-white hover:bg-cyan-700"
                    onClick={() => openSite(site)}
                  >
                    Open site dashboard
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-b border-slate-100 pb-3 dark:border-slate-800 sm:grid-cols-4">
        {statuses.map((status) => (
          <div key={status} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS[status].color }} />
            <span>{status}</span>
            <span className="ml-auto font-semibold tabular-nums text-slate-700 dark:text-slate-200">{sites.filter((site) => site.status === status).length}</span>
          </div>
        ))}
      </div>

      <div className="flex min-h-[52px] items-center gap-3 pt-3" aria-live="polite">
        {focusedSite ? <>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS[focusedSite.status]?.color || STATUS.Idle.color }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{focusedSite.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{focusedSite.location} &middot; SoC {focusedSite.soc}% &middot; {focusedSite.capacityMW} MW</p>
          </div>
          <MapPin className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
        </> : <p className="text-[11px] text-slate-500 dark:text-slate-400">Select a marker to inspect a site and open its dashboard</p>}
      </div>
    </section>
  );
}
