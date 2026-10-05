import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowUpDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { StatusBadge, RiskBadge } from './StatusBadge';
import { formatPercent } from '../utils/formatters';

export default function VehicleTable({ vehicles = [] }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortField, setSortField] = useState('riskLevel'); // 'riskLevel' | 'soh' | 'rul' | 'soc'
  const [sortDirection, setSortDirection] = useState('asc');

  // Priority weight for risk sorting
  const riskWeight = { High: 1, Medium: 2, Low: 3 };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredVehicles = vehicles
    .filter((v) => {
      const matchesSearch =
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      const matchesRisk = riskFilter === 'ALL' || v.riskLevel === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
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

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="Driving">Driving</option>
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

      {/* Table Component */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Vehicle ID</th>
              <th className="py-3 px-4">Model</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('soc')}>
                <div className="flex items-center gap-1">
                  SoC <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('soh')}>
                <div className="flex items-center gap-1">
                  SoH Progress <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('rul')}>
                <div className="flex items-center gap-1">
                  RUL <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('riskLevel')}>
                <div className="flex items-center gap-1">
                  Risk Level <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Alerts</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => navigate(`/vehicle/${v.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {v.id}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {v.model}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-700 dark:text-slate-300">
                    {v.soc}%
                  </td>
                  <td className="py-3 px-4 w-44">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            v.soh < 80 ? 'bg-rose-500' : v.soh < 90 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${v.soh}%` }}
                        />
                      </div>
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white w-9">
                        {formatPercent(v.soh, 0)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 tabular-nums text-slate-700 dark:text-slate-300 font-semibold">
                    {v.rul} yrs
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge risk={v.riskLevel} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {v.activeAlerts > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3 h-3" />
                        {v.activeAlerts}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="View Digital Twin"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  No vehicles match the selected search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
