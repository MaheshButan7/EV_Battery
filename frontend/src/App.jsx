import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, ProtectedRoute } from './hooks/useAuth';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Overview from './pages/Overview';
import SiteDashboard from './pages/SiteDashboard';
import Login from './pages/Login';

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Extract current site ID from URL for sidebar active state
  const siteMatch = location.pathname.match(/^\/site\/(.+)/);
  const currentSiteId = siteMatch ? siteMatch[1] : 'BESS-103';

  return (
    <div className="app-canvas flex h-screen text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentSiteId={currentSiteId}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="app-canvas flex-1 overflow-y-auto transition-colors">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/site/:id" element={<SiteDashboard />} />
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
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
