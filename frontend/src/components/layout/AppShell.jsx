import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AppRoutes from '../../app/routes';
import { useDemoData } from '../../hooks/useDemoData';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSiteId, accessibleSiteIds } = useDemoData();
  const siteMatch = location.pathname.match(/^\/site\/([^/]+)/);
  const currentSiteId = siteMatch ? siteMatch[1] : selectedSiteId;

  useEffect(() => {
    if (siteMatch && !accessibleSiteIds.includes(siteMatch[1])) {
      navigate(`/site/${selectedSiteId}`, { replace: true });
    }
  }, [accessibleSiteIds, navigate, selectedSiteId, siteMatch]);

  return (
    <div className="app-canvas flex h-[100dvh] min-h-0 overflow-hidden font-sans antialiased text-slate-900 dark:text-slate-100">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentSiteId={currentSiteId}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((current) => !current)}
        />
        <main className="app-main min-h-0 flex-1 overflow-x-hidden overflow-y-auto transition-colors">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
}
