/**
 * Seeded pseudo-random generator — ensures values are stable across reloads.
 * LFP chemistry: cell voltage 3.20-3.34 V, temp 24-34 °C, IR 0.20-0.30 mΩ
 */
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function lerp(a, b, t) {
  return +(a + (b - a) * t).toFixed(4);
}

/**
 * Generate 2 containers × 4 racks × 8 modules × 12 cells for any site.
 * Anomalous cells for BESS-103 are overridden after generation.
 */
export function generatePackData(siteId = 'BESS-103') {
  const rng = seededRng(siteId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  const containers = [];

  for (let cont = 1; cont <= 2; cont++) {
    const racks = [];
    for (let rack = 1; rack <= 4; rack++) {
      const modules = [];
      for (let mod = 1; mod <= 8; mod++) {
        const cells = [];
        for (let c = 1; c <= 12; c++) {
          const r = rng();
          cells.push({
            id: `C${cont}-R${rack}-M${mod}-C${String(c).padStart(2, '0')}`,
            containerIndex: cont,
            rackIndex: rack,
            moduleIndex: mod,
            cellInModule: c,
            voltage: lerp(3.20, 3.34, r),
            temperature: lerp(24, 34, rng()),
            internalResistance: lerp(0.20, 0.30, rng()),
            isAnomalous: false,
            anomaly: null,
          });
        }
        modules.push({ id: `M${mod}`, name: `Module ${mod}`, cells });
      }
      racks.push({ id: `R${rack}`, name: `Rack ${rack}`, modules });
    }
    containers.push({ id: `Cont${cont}`, name: `Container ${cont}`, racks });
  }

  // Override 3 anomaly cells for BESS-103
  if (siteId === 'BESS-103') {
    // Anomaly 1: Container 1 / Rack 2 / Module 4 / Cell 07 — voltage deviation
    const cell1 = containers[0].racks[1].modules[3].cells[6];
    cell1.voltage = 3.134;
    cell1.temperature = 30.8;
    cell1.internalResistance = 0.268;
    cell1.isAnomalous = true;
    cell1.anomaly = {
      location: 'Cont 1 / R2 / M4 / Cell 07',
      issue: 'Voltage Deviation Trend',
      daysRemaining: 14,
      priority: 'Major',
      modelConfidence: '93.1%',
      action: 'Inspect cell balancing circuit; schedule module inspection.',
    };

    // Anomaly 2: Container 1 / Rack 3 / Module 2 / Cell 11 — rising IR
    const cell2 = containers[0].racks[2].modules[1].cells[10];
    cell2.voltage = 3.218;
    cell2.temperature = 33.2;
    cell2.internalResistance = 0.312;
    cell2.isAnomalous = true;
    cell2.anomaly = {
      location: 'Cont 1 / R3 / M2 / Cell 11',
      issue: 'Rising Internal Resistance',
      daysRemaining: 38,
      priority: 'Minor',
      modelConfidence: '91.4%',
      action: 'Schedule thermal scan; torque-check bus connectors.',
    };
  }

  return containers;
}

// Anomaly 3 is system-level (HVAC), kept separate from cell data
export const bess103SystemAnomalies = [
  {
    location: 'Cont 1 / R2 / M4 / Cell 07',
    issue: 'Voltage Deviation Trend',
    daysRemaining: 14,
    priority: 'Major',
    modelConfidence: '93.1%',
    action: 'Inspect cell balancing circuit; schedule module inspection.',
  },
  {
    location: 'Cont 1 / R3 / M2 / Cell 11',
    issue: 'Rising Internal Resistance',
    daysRemaining: 38,
    priority: 'Minor',
    modelConfidence: '91.4%',
    action: 'Schedule thermal scan; torque-check bus connectors.',
  },
  {
    location: 'Container 2 / HVAC Unit 2',
    issue: 'Cooling Efficiency Drop → Rack Temp Rise',
    daysRemaining: 61,
    priority: 'Warning',
    modelConfidence: '87.6%',
    action: 'Service HVAC unit 2 filters; check refrigerant charge.',
  },
];

export const bess103RulSeries = [
  { year: '2025 Q1', actual: 96.8, predicted: null, lowerBound: null, upperBound: null },
  { year: '2025 Q2', actual: 95.4, predicted: null, lowerBound: null, upperBound: null },
  { year: '2025 Q3', actual: 94.1, predicted: null, lowerBound: null, upperBound: null },
  { year: '2025 Q4', actual: 92.8, predicted: null, lowerBound: null, upperBound: null },
  { year: '2026 Q1', actual: 91.5, predicted: 91.5, lowerBound: 91.5, upperBound: 91.5 },
  { year: '2026 Q2 (Now)', actual: 90.8, predicted: 90.8, lowerBound: 90.1, upperBound: 91.5 },
  { year: '2027 Q1', actual: null, predicted: 87.4, lowerBound: 85.8, upperBound: 89.0 },
  { year: '2028 Q1', actual: null, predicted: 84.0, lowerBound: 81.8, upperBound: 86.2 },
  { year: '2029 Q1', actual: null, predicted: 80.2, lowerBound: 77.4, upperBound: 83.0 },
  { year: '2030 Q1', actual: null, predicted: 76.0, lowerBound: 72.5, upperBound: 79.5 },
  { year: '2031 Q1', actual: null, predicted: 71.5, lowerBound: 67.2, upperBound: 75.8 },
  { year: '2032 Q1', actual: null, predicted: 66.8, lowerBound: 62.0, upperBound: 71.6 },
  { year: '2033 Q1', actual: null, predicted: 62.0, lowerBound: 56.8, upperBound: 67.2 },
  { year: '2034 Q1', actual: null, predicted: 57.1, lowerBound: 51.5, upperBound: 62.7 },
  { year: '2035 Q4 (EOL)', actual: null, predicted: 51.8, lowerBound: 45.8, upperBound: 57.8 },
];

export const bess103PerformanceSeries = [
  { month: 'Apr 2026', actualRTE: 93.1, predictedRTE: 93.8, actualMWh: 92.4, predictedMWh: 93.2 },
  { month: 'May 2026', actualRTE: 93.5, predictedRTE: 93.6, actualMWh: 95.1, predictedMWh: 94.0 },
  { month: 'Jun 2026', actualRTE: 92.8, predictedRTE: 93.4, actualMWh: 88.6, predictedMWh: 92.8 },
  { month: 'Jul 2026', actualRTE: 93.2, predictedRTE: 93.2, actualMWh: 96.2, predictedMWh: 95.4 },
  { month: 'Aug 2026', actualRTE: 92.6, predictedRTE: 93.0, actualMWh: 90.8, predictedMWh: 93.0 },
  { month: 'Sep 2026', actualRTE: 93.0, predictedRTE: 92.8, actualMWh: 94.1, predictedMWh: 92.6 },
];

// Hour-ending AC power averages. Positive is charging; negative is discharging.
// Totals match the meter: 94.8 MWh charged, 81.3 MWh discharged.
const bess103HourlyPower = [
  7.5, 7.5, -6.7, -6.7, -6.6, 11, 11, -11, -11, 7.7, 7.7, 7.6,
  -10, -10, -9.65, -9.65, 8.1, 8.1, 0, 0, 0, 0, 0, 18.6,
].map((power, index) => ({
  hour: `${String(index).padStart(2, '0')}:00`,
  power,
}));

const bess103Rte = 0.932;
const bess103UsableCapacityMWh = 60 * 0.91;
const bess103ChargeDischargeEfficiency = Math.sqrt(bess103Rte);
const chargedMWh = bess103HourlyPower.reduce((sum, point) => sum + Math.max(0, point.power), 0);
const dischargedMWh = bess103HourlyPower.reduce((sum, point) => sum + Math.max(0, -point.power), 0);
const netStoredEnergyMWh = chargedMWh * bess103ChargeDischargeEfficiency
  - dischargedMWh / bess103ChargeDischargeEfficiency;
let bess103Soc = 72 - (netStoredEnergyMWh / bess103UsableCapacityMWh) * 100;

export const bess103PowerProfile = bess103HourlyPower.map((point) => {
  const storedEnergyChangeMWh = point.power >= 0
    ? point.power * bess103ChargeDischargeEfficiency
    : point.power / bess103ChargeDischargeEfficiency;
  bess103Soc += (storedEnergyChangeMWh / bess103UsableCapacityMWh) * 100;
  return { ...point, soc: +bess103Soc.toFixed(1) };
});

export const bess103Equipment = {
  pcs: {
    label: 'Power Conversion System',
    status: 'Active',
    activePowerMW: 18.6,
    reactivePowerMVAr: 2.4,
    acVoltage: 690,
    dcVoltage: 1251,
    frequency: 50.0,
    efficiency: 98.4,
    mode: 'Grid-Forming',
  },
  transformer: {
    label: 'Main Transformer',
    status: 'Normal',
    oilTemp: 58.4,
    loadPercent: 62.1,
  },
  switchgear: {
    label: 'Switchgear',
    status: 'Closed',
    breakerClosed: true,
  },
  hvac: [
    { id: 1, label: 'HVAC Unit 1', status: 'Running', setpointC: 25.0, actualC: 25.8 },
    { id: 2, label: 'HVAC Unit 2', status: 'Running', setpointC: 25.0, actualC: 27.6 },
  ],
  fireSuppression: {
    label: 'Fire Detection & Suppression',
    status: 'Normal',
    lastTestDate: '2026-09-15',
  },
  ups: {
    label: 'UPS',
    status: 'Normal',
    batteryLevel: 98,
  },
  energyMeter: {
    label: 'Energy Meter',
    status: 'Active',
    todayChargedMWh: 94.8,
    todayDischargedMWh: 81.3,
  },
  environment: {
    label: 'Environment',
    ambientTempC: 33.4,
    humidity: 64,
    doorStatus: 'Closed',
    floodSensor: 'Normal',
  },
};

export const bess103WorkOrders = [
  {
    id: 'WO-2841',
    type: 'Preventive',
    description: 'Quarterly BMS calibration and firmware update',
    priority: 'Minor',
    dueDate: '2026-10-18',
    assignee: 'R. Mehta',
  },
  {
    id: 'WO-2856',
    type: 'Corrective',
    description: 'HVAC Unit 2 service — filter replacement & refrigerant check',
    priority: 'Warning',
    dueDate: '2026-10-22',
    assignee: 'P. Kumar',
  },
  {
    id: 'WO-2872',
    type: 'Inspection',
    description: 'Container 1 Rack 2 bus-bar torque verification',
    priority: 'Major',
    dueDate: '2026-10-14',
    assignee: 'S. Patil',
  },
  {
    id: 'WO-2891',
    type: 'Preventive',
    description: 'Switchgear annual servicing and contact inspection',
    priority: 'Info',
    dueDate: '2026-11-05',
    assignee: 'A. Rao',
  },
];
