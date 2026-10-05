import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { ThemeProvider } from './hooks/useTheme';
import Overview from './pages/Overview';
import VehicleDashboard from './pages/VehicleDashboard';

function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation Shell */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/vehicle/:id" element={<VehicleDashboard />} />
            <Route path="/vehicle" element={<VehicleDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}
