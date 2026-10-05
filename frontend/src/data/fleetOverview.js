export const mockFleetOverview = {
  kpis: {
    totalVehicles: { value: 24, label: 'Total Fleet Size', delta: '+2 this month', deltaType: 'neutral' },
    avgFleetSoh: { value: 89.8, label: 'Average Fleet SoH', delta: '-0.4% MoM', deltaType: 'negative' },
    activeAlerts: { value: 19, label: 'Active Alerts', delta: '+3 since yesterday', deltaType: 'negative' },
    vehiclesCharging: { value: 8, label: 'Vehicles Charging', delta: '33% active grid load', deltaType: 'positive' },
    projectedReplacements: { value: 3, label: 'Projected Replacements (12m)', delta: '2 high priority', deltaType: 'warning' },
  },

  sohTrend: [
    { month: 'Oct 25', avgSoh: 94.2, target: 93.0 },
    { month: 'Nov 25', avgSoh: 93.8, target: 92.6 },
    { month: 'Dec 25', avgSoh: 93.4, target: 92.2 },
    { month: 'Jan 26', avgSoh: 92.9, target: 91.8 },
    { month: 'Feb 26', avgSoh: 92.5, target: 91.4 },
    { month: 'Mar 26', avgSoh: 92.0, target: 91.0 },
    { month: 'Apr 26', avgSoh: 91.5, target: 90.5 },
    { month: 'May 26', avgSoh: 91.1, target: 90.1 },
    { month: 'Jun 26', avgSoh: 90.7, target: 89.7 },
    { month: 'Jul 26', avgSoh: 90.3, target: 89.3 },
    { month: 'Aug 26', avgSoh: 89.9, target: 88.9 },
    { month: 'Sep 26', avgSoh: 89.8, target: 88.5 },
  ],

  sohDistribution: [
    { range: '>95% (Optimal)', count: 6, percentage: 25.0, fill: '#10b981' },
    { range: '90-95% (Good)', count: 9, percentage: 37.5, fill: '#3b82f6' },
    { range: '80-89% (Moderate)', count: 6, percentage: 25.0, fill: '#f59e0b' },
    { range: '<80% (Attention)', count: 3, percentage: 12.5, fill: '#ef4444' },
  ],

  fleetStatusCounts: [
    { name: 'Driving', value: 10, fill: '#06b6d4' },
    { name: 'Charging', value: 8, fill: '#10b981' },
    { name: 'Idle', value: 4, fill: '#64748b' },
    { name: 'Fault', value: 2, fill: '#ef4444' },
  ],

  recentAlerts: [
    {
      id: 'ALT-1092',
      vehicleId: 'EV-4503',
      severity: 'Critical',
      title: 'High Temperature Spike',
      description: 'Module 4 Cell 18 exceeded thermal threshold (46.1°C)',
      timestamp: '12 mins ago',
    },
    {
      id: 'ALT-1091',
      vehicleId: 'EV-4515',
      severity: 'Critical',
      title: 'Cell Imbalance Warning',
      description: 'Cell 67 voltage mismatch delta > 180mV',
      timestamp: '28 mins ago',
    },
    {
      id: 'ALT-1090',
      vehicleId: 'EV-4587',
      severity: 'Warning',
      title: 'Predicted Cell Drift',
      description: 'Cell 12 voltage deviation expected in 18 days',
      timestamp: '1 hour ago',
    },
    {
      id: 'ALT-1089',
      vehicleId: 'EV-4521',
      severity: 'Warning',
      title: 'Accelerated Degradation',
      description: 'SoH reduced by 2.1% over last 30 cycles',
      timestamp: '3 hours ago',
    },
    {
      id: 'ALT-1088',
      vehicleId: 'EV-4506',
      severity: 'Warning',
      title: 'High Internal Resistance',
      description: 'Module 6 average IR elevated above 3.1 mΩ',
      timestamp: '5 hours ago',
    },
    {
      id: 'ALT-1087',
      vehicleId: 'EV-4502',
      severity: 'Info',
      title: 'Scheduled Fast Charge Completed',
      description: 'SoC reached 88% target in 42 mins',
      timestamp: '8 hours ago',
    },
  ],
};
