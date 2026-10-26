import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const Overview = lazy(() => import('../pages/Overview'));
const SiteDashboard = lazy(() => import('../pages/SiteDashboard'));
const FleetMap = lazy(() => import('../pages/FleetMap'));
const SiteSld = lazy(() => import('../pages/SiteSld'));
const BatteryCells = lazy(() => import('../pages/BatteryCells'));
const PcsDashboard = lazy(() => import('../pages/PcsDashboard'));
const Hazards = lazy(() => import('../pages/Hazards'));
const AlarmManagement = lazy(() => import('../pages/AlarmManagement'));
const AssetHealth = lazy(() => import('../pages/AssetHealth'));
const Maintenance = lazy(() => import('../pages/Maintenance'));
const PermitToWork = lazy(() => import('../pages/PermitToWork'));
const Inventory = lazy(() => import('../pages/Inventory'));
const Analytics = lazy(() => import('../pages/Analytics'));
const AIInsights = lazy(() => import('../pages/AIInsights'));
const HistoricalTrends = lazy(() => import('../pages/HistoricalTrends'));
const Executive = lazy(() => import('../pages/Executive'));
const Reports = lazy(() => import('../pages/Reports'));
const Administration = lazy(() => import('../pages/Administration'));
const AssetRegistry = lazy(() => import('../pages/AssetRegistry'));
const DashboardStudio = lazy(() => import('../pages/DashboardStudio'));
const HelpSupport = lazy(() => import('../pages/HelpSupport'));
const FieldMode = lazy(() => import('../pages/FieldMode'));

function RouteLoading() {
  return (
    <div className="mx-auto min-h-[24rem] w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading dashboard</span>
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-6 w-64 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 rounded-xl border border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900" />)}</div>
      <div className="grid gap-4 lg:grid-cols-2"><div className="h-64 rounded-xl border border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900" /><div className="h-64 rounded-xl border border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-900" /></div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/site/:id" element={<SiteDashboard />} />
        <Route path="/map" element={<FleetMap />} />
        <Route path="/site/:id/sld" element={<SiteSld />} />
        <Route path="/site/:id/battery" element={<BatteryCells />} />
        <Route path="/site/:id/pcs" element={<PcsDashboard />} />
        <Route path="/hazards" element={<Hazards />} />
        <Route path="/alarms" element={<AlarmManagement />} />
        <Route path="/asset-health" element={<AssetHealth />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/maintenance/permits" element={<PermitToWork />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/history" element={<HistoricalTrends />} />
        <Route path="/executive" element={<Executive />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin" element={<Administration />} />
        <Route path="/assets" element={<AssetRegistry />} />
        <Route path="/dashboard-studio" element={<DashboardStudio />} />
        <Route path="/help-support" element={<HelpSupport />} />
        <Route path="/field-mode" element={<FieldMode />} />
      </Routes>
    </Suspense>
  );
}
