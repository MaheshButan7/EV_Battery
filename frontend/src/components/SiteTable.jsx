import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { StatusBadge, RiskBadge } from './StatusBadge';
import { formatPercent } from '../utils/formatters';

export default function SiteTable({ sites = [] }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortField, setSortField] = useState('riskLevel');
  const [sortDirection, setSortDirection] = useState('asc');

  const riskWeight = { High: 1, Medium: 2, Low: 3 };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filtered = sites
    .filter((s) => {
      const matchSearch =
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchRisk = riskFilter === 'ALL' || s.riskLevel === riskFilter;
      return matchSearch && matchStatus && matchRisk;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'riskLevel') {
        valA = riskWeight[a.riskLevel] || 99;
        valB = riskWeight[b.riskLevel] || 99;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const SortBtn = ({ field, children }) => (
    <div
      className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-white"
      onClick={() => handleSort(field)}
    >
      {children} <ArrowUpDown className="w-3 h-3" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search site ID, name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="Discharging">Discharging</option>
            <option value="Charging">Charging</option>
            <option value="Idle">Idle</option>
            <option value="Fault">Fault</option>
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Site ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Capacity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4"><SortBtn field="soc">SoC</SortBtn></th>
              <th className="py-3 px-4"><SortBtn field="soh">SoH</SortBtn></th>
              <th className="py-3 px-4"><SortBtn field="availability">Availability</SortBtn></th>
              <th className="py-3 px-4"><SortBtn field="rul">RUL</SortBtn></th>
              <th className="py-3 px-4"><SortBtn field="riskLevel">Risk</SortBtn></th>
              <th className="py-3 px-4 text-center">Alarms</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/site/${s.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.id}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{s.name}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{s.location}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                    {s.capacityMW} MW / {s.capacityMWh} MWh
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={s.status} /></td>
                  <td className="py-3 px-4 tabular-nums text-slate-700 dark:text-slate-300">{s.soc}%</td>
                  <td className="py-3 px-4 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.soh < 80 ? 'bg-rose-500' : s.soh < 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${s.soh}%` }}
                        />
                      </div>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white w-9">
                        {formatPercent(s.soh, 0)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-700 dark:text-slate-300">{s.availability}%</td>
                  <td className="py-3 px-4 tabular-nums text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">{s.rul} yrs</td>
                  <td className="py-3 px-4"><RiskBadge risk={s.riskLevel} /></td>
                  <td className="py-3 px-4 text-center">
                    {s.activeAlarms > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3 h-3" />
                        {s.activeAlarms}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-1 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  No sites match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
