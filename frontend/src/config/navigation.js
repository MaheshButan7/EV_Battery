import {
  LayoutDashboard,
  Map,
  Zap,
  Battery,
  Cpu,
  ShieldAlert,
  BellRing,
  Database,
  Activity,
  Wrench,
  Package,
  BarChart3,
  FileBarChart,
  Briefcase,
  Settings,
} from 'lucide-react';

export const navigationGroups = [
  {
    label: 'Operations',
    items: [
      { id: 'fleet', name: 'Fleet Overview', path: '/', icon: LayoutDashboard },
      { id: 'map', name: 'GIS/ Site Map', path: '/map', icon: Map },
      { id: 'site', name: 'Site Operations', path: '/site/:siteId', icon: Zap },
      { id: 'sld', name: 'Single Line Diagram', path: '/site/:siteId/sld', icon: Activity },
      { id: 'battery', name: 'Battery & Cells', path: '/site/:siteId/battery', icon: Battery },
      { id: 'pcs', name: 'PCS & Power Conversion', path: '/site/:siteId/pcs', icon: Cpu },
      { id: 'hazards', name: 'Safety & Hazards', path: '/hazards', icon: ShieldAlert },
    ],
  },
  {
    label: 'Alarms',
    items: [
      { id: 'alarms', name: 'Alarm & Event Management', path: '/alarms', icon: BellRing },
    ],
  },
  {
    label: 'Assets',
    items: [
      { id: 'assets', name: 'Asset Registry', path: '/assets', icon: Database },
      { id: 'health', name: 'Asset Health', path: '/asset-health', icon: Activity },
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { id: 'maintenance', name: 'Maintenance & CMMS', path: '/maintenance', icon: Wrench },
      { id: 'permits', name: 'Permit-to-Work', path: '/maintenance/permits', icon: ShieldAlert },
      { id: 'inventory', name: 'Inventory', path: '/inventory', icon: Package },
    ],
  },
  {
    label: 'Insights',
    items: [
      { id: 'analytics', name: 'Performance Analytics', path: '/analytics', icon: BarChart3 },
      { id: 'history', name: 'Historical Trends', path: '/history', icon: Activity },
      { id: 'reports', name: 'Reports', path: '/reports', icon: FileBarChart },
      { id: 'executive', name: 'Executive Reporting', path: '/executive', icon: Briefcase },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'admin', name: 'Administration', path: '/admin', icon: Settings },
    ],
  },
];

export function getNavigationItems() {
  return navigationGroups.flatMap((group) => group.items);
}
