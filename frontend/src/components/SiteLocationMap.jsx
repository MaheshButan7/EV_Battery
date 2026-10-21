import React from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  Charging: '#10b981',
  Discharging: '#06b6d4',
  Fault: '#f59e0b',
  Offline: '#64748b',
  Idle: '#94a3b8',
};

const INDIA_CENTER = [21, 78];
const INDIA_ZOOM = 5;

function siteIcon(site) {
  const color = STATUS_COLORS[site.status] || STATUS_COLORS.Idle;
  return L.divIcon({
    className: 'bess-map-marker',
    html: `<span style="--marker-color:${color}"><span class="bess-map-marker-dot"></span></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

export default function SiteLocationMap({ sites = [], onSelectSite }) {
  return (
    <section className="surface-card flex h-full min-h-[420px] min-w-0 flex-col rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Fleet site map</h2>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Live site locations · OpenStreetMap</p>
      </div>
      <div className="relative min-h-[360px] min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <MapContainer
          center={INDIA_CENTER}
          zoom={INDIA_ZOOM}
          minZoom={INDIA_ZOOM}
          maxZoom={13}
          scrollWheelZoom
          className="h-full w-full"
          aria-label="Interactive map of BESS sites in India"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sites.map((site) => (
            <Marker key={site.id} position={[site.lat, site.lng]} icon={siteIcon(site)}>
              <Popup>
                <div className="min-w-[180px] text-[11px]">
                  <p className="text-xs font-bold text-slate-900">{site.name}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{site.location}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-600">
                    <span>Status</span><strong>{site.status}</strong>
                    <span>State of charge</span><strong>{site.soc}%</strong>
                    <span>Battery health</span><strong>{site.soh}%</strong>
                    <span>Availability</span><strong>{site.availability}%</strong>
                    <span>Active alarms</span><strong>{site.activeAlarms}</strong>
                  </div>
                  <Link
                    to={`/site/${site.id}`}
                    onClick={() => onSelectSite?.(site.id)}
                    className="mt-3 block rounded-md bg-cyan-600 px-2.5 py-2 text-center text-[11px] font-semibold text-white hover:bg-cyan-700"
                  >
                    Open site dashboard
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
