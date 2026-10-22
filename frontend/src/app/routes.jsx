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
    <div className="flex min-h-[24rem] items-center justify-center p-8" role="status" aria-live="polite">
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-3 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
        Loading dashboard…
      </div>
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
