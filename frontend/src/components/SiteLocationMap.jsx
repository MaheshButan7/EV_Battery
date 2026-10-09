import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const REGION = { minLat: 7, maxLat: 29, minLng: 68, maxLng: 80.5, left: 34, top: 28, width: 292, height: 356 };
const STATUS = {
  Charging: { dot: 'bg-emerald-500', halo: 'ring-emerald-500/20' },
  Discharging: { dot: 'bg-cyan-500', halo: 'ring-cyan-500/20' },
  Idle: { dot: 'bg-slate-400', halo: 'ring-slate-400/20' },
  Fault: { dot: 'bg-rose-500', halo: 'ring-rose-500/20' },
};

function getPosition(site) {
  const x = (site.lng - REGION.minLng) / (REGION.maxLng - REGION.minLng);
  const y = (REGION.maxLat - site.lat) / (REGION.maxLat - REGION.minLat);
  return {
    left: `${((REGION.left + x * REGION.width) / 360) * 100}%`,
    top: `${((REGION.top + y * REGION.height) / 420) * 100}%`,
  };
}

export default function SiteLocationMap({ sites = [] }) {
  const navigate = useNavigate();
  const [focusedSite, setFocusedSite] = useState(null);
  const statuses = ['Charging', 'Discharging', 'Idle', 'Fault'];

  return (
    <section className="surface-card flex h-full min-h-[500px] flex-col rounded-2xl border bg-white p-5 dark:bg-slate-900 lg:p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Site locations</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">BESS assets across western and southern India</p>
        </div>
        <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {sites.length} sites
        </span>
      </header>

      <div className="relative mt-4 min-h-[350px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <svg viewBox="0 0 360 420" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <pattern id="site-map-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#dce5ee" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="360" height="420" fill="#f8fafc" />
          <rect width="360" height="420" fill="url(#site-map-grid)" />
          <path d="M35 115 C43 106 45 93 50 82 C59 61 69 48 85 40 C105 30 122 28 143 31 C166 34 181 40 197 47 C215 55 229 58 247 59 L326 59 L326 172 C331 184 338 193 338 205 C337 217 325 225 315 234 C311 250 315 268 313 286 C311 306 305 328 295 345 C285 362 271 377 256 381 C243 383 234 374 225 362 C214 348 207 332 197 317 C182 294 169 274 160 251 C151 226 145 204 132 184 C120 165 104 154 88 145 C68 135 49 129 35 115 Z" fill="#e7eef5" stroke="#cbd8e4" strokeWidth="1.5" />
          {[10, 15, 20, 25].map((lat) => {
            const y = REGION.top + ((REGION.maxLat - lat) / (REGION.maxLat - REGION.minLat)) * REGION.height;
            return <g key={lat}><text x="8" y={y + 3} fill="#718096" fontSize="8">{lat}&#176;N</text><line x1="30" y1={y} x2="340" y2={y} stroke="#94a3b8" strokeOpacity="0.2" strokeDasharray="2 5" /></g>;
          })}
          {[70, 74, 78].map((lng) => {
            const x = REGION.left + ((lng - REGION.minLng) / (REGION.maxLng - REGION.minLng)) * REGION.width;
            return <g key={lng}><line x1={x} y1="24" x2={x} y2="393" stroke="#94a3b8" strokeOpacity="0.16" strokeDasharray="2 5" /><text x={x} y="408" textAnchor="middle" fill="#718096" fontSize="8">{lng}&#176;E</text></g>;
          })}
          <g fill="#64748b" fillOpacity="0.72" fontSize="8" fontWeight="600" letterSpacing="1">
            <text x="100" y="93">RAJASTHAN</text><text x="49" y="172">GUJARAT</text>
            <text x="127" y="218">MAHARASHTRA</text><text x="202" y="314">KARNATAKA</text>
            <text x="262" y="379">TAMIL NADU</text>
          </g>
        </svg>

        {sites.map((site) => {
          const color = STATUS[site.status] || STATUS.Idle;
          const labelOnLeft = site.lng > 77.5;
          return (
            <button
              key={site.id}
              type="button"
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full p-1.5 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
              style={getPosition(site)}
              title={`${site.name} - ${site.status} - SoC ${site.soc}%`}
              aria-label={`Open ${site.name}, ${site.status}, state of charge ${site.soc}%`}
              onMouseEnter={() => setFocusedSite(site)} onMouseLeave={() => setFocusedSite(null)}
              onFocus={() => setFocusedSite(site)} onBlur={() => setFocusedSite(null)}
              onClick={() => navigate(`/site/${site.id}`)}
            >
              <span className={`block h-3.5 w-3.5 rounded-full ring-[5px] transition-transform group-hover:scale-125 ${color.dot} ${color.halo}`} />
              <span className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white bg-white/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-600 shadow-sm ${labelOnLeft ? 'right-full mr-2' : 'left-full ml-2'}`}>
                {site.id}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-b border-slate-100 pb-3 dark:border-slate-800 sm:grid-cols-4">
        {statuses.map((status) => (
          <div key={status} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className={`h-2 w-2 rounded-full ${STATUS[status].dot}`} />
            <span>{status}</span>
            <span className="ml-auto font-semibold tabular-nums text-slate-700 dark:text-slate-200">{sites.filter((site) => site.status === status).length}</span>
          </div>
        ))}
      </div>

      <div className="flex min-h-[52px] items-center gap-3 pt-3" aria-live="polite">
        {focusedSite ? <>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS[focusedSite.status]?.dot || STATUS.Idle.dot}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{focusedSite.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{focusedSite.location} &middot; SoC {focusedSite.soc}% &middot; {focusedSite.capacityMW} MW</p>
          </div>
          <MapPin className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
        </> : <p className="text-[11px] text-slate-500 dark:text-slate-400">Select a site marker to open its dashboard</p>}
      </div>
    </section>
  );
}
