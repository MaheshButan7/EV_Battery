import React from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { LocateFixed } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  Charging: '#10b981',
  Discharging: 'var(--app-accent)',
  Fault: '#f43f5e',
  Offline: '#64748b',
  Idle: '#94a3b8',
};

const INDIA_CENTER = [21, 78];
const INDIA_ZOOM = 5;

function FitFleet({ sites, fitKey }) {
  const map = useMap();
  React.useEffect(() => {
    if (fitKey === 0 || sites.length === 0) return;
    if (sites.length > 1) map.fitBounds(sites.map((site) => [site.lat, site.lng]), { padding: [32, 32], maxZoom: 6 });
    else if (sites.length === 1) map.setView([sites[0].lat, sites[0].lng], 7);
  }, [fitKey, map]);
  return null;
}

function formatCoordinates(latitude, longitude) {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lngDirection = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(4)}° ${latDirection}, ${Math.abs(longitude).toFixed(4)}° ${lngDirection}`;
}

function statusClass(status) {
  if (['Fault', 'Offline'].includes(status)) return 'bg-rose-100 text-rose-800';
  if (['Attention', 'Warning'].includes(status)) return 'bg-amber-100 text-amber-800';
  if (['Charging', 'Discharging', 'Idle'].includes(status)) return 'bg-emerald-100 text-emerald-800';
  return 'bg-slate-100 text-slate-700';
}

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

export default function SiteLocationMap({ sites = [], onSelectSite, layers = {}, fitKey = 0, onFitFleet }) {
  return (
    <section className="surface-card flex h-full min-h-[420px] min-w-0 flex-col rounded-2xl border bg-white p-4 dark:bg-slate-900 sm:p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Fleet site map</h2>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Live site locations · OpenStreetMap</p>
      </div>
      <div className="relative min-h-[360px] min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <button type="button" onClick={(event) => { event.stopPropagation(); onFitFleet?.(); }} onPointerDown={(event) => event.stopPropagation()} className="absolute bottom-3 left-3 z-[1000] inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-800 dark:hover:text-cyan-300" aria-label="Fit map to visible fleet sites" title="Fit map to visible fleet sites">
          <LocateFixed className="h-5 w-5" />
        </button>
        <MapContainer
          center={INDIA_CENTER}
          zoom={INDIA_ZOOM}
          minZoom={INDIA_ZOOM}
          maxZoom={13}
          scrollWheelZoom
          className="h-full w-full"
          aria-label="Interactive map of BESS sites in India"
        >
          <FitFleet sites={sites} fitKey={fitKey} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {sites.map((site) => (
            <Marker key={site.id} position={[site.lat, site.lng]} icon={siteIcon(site)}>
              <Popup>
                <div className="min-w-[200px] text-[11px] text-slate-700">
                  <p className="text-xs font-bold text-slate-900">{site.name}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{site.location}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-600">
                    <span>Coordinates</span><strong className="text-right">{formatCoordinates(site.lat, site.lng)}</strong>
                    <span>Status</span><strong className="justify-self-end rounded px-1.5 py-0.5 text-[9px] font-bold"> <span className={statusClass(site.status)}>{site.status}</span></strong>
                    <span>Capacity</span><strong>{site.capacityMW} MW</strong>
                    <span>Last data</span><strong>{site.lastUpdated}</strong>
                    {layers.health !== false && <><span>Battery health</span><strong>{site.soh}%</strong></>}
                    {layers.availability !== false && <><span>Availability</span><strong>{site.availability}%</strong></>}
                    {layers.alarms !== false && <><span>Active alarms</span><strong>{site.activeAlarms}</strong></>}
                    {layers.communications !== false && <><span>Communications</span><strong>{site.commsStatus}</strong></>}
                    {layers.weather !== false && <><span>Weather</span><strong>{site.weather || '32 °C · Clear'}</strong></>}
                  </div>
                  <Link
                    to={`/site/${site.id}`}
                    onClick={() => onSelectSite?.(site.id)}
                    className="!mt-3 !block !rounded-md !bg-cyan-700 !px-2.5 !py-2 !text-center !text-[11px] !font-semibold !text-white hover:!bg-cyan-800 hover:!text-white"
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
