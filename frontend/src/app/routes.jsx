import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Overview from '../pages/Overview';
import SiteDashboard from '../pages/SiteDashboard';
import FleetMap from '../pages/FleetMap';
import SiteSld from '../pages/SiteSld';
import BatteryCells from '../pages/BatteryCells';
import PcsDashboard from '../pages/PcsDashboard';
import Hazards from '../pages/Hazards';
import AlarmManagement from '../pages/AlarmManagement';
import AssetHealth from '../pages/AssetHealth';
import Maintenance from '../pages/Maintenance';
import PermitToWork from '../pages/PermitToWork';
import Inventory from '../pages/Inventory';
import Analytics from '../pages/Analytics';
import HistoricalTrends from '../pages/HistoricalTrends';
import Executive from '../pages/Executive';
import Reports from '../pages/Reports';
import Administration from '../pages/Administration';
import AssetRegistry from '../pages/AssetRegistry';

export default function AppRoutes() {
  return (
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
    </Routes>
  );
}
