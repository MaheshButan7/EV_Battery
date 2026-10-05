// Generate 96 cells for EV-4587 (8 modules x 12 cells)
export function generatePackData(vehicleId = 'EV-4587') {
  const modules = [];
  let totalCellCount = 0;

  for (let m = 1; m <= 8; m++) {
    const cells = [];
    for (let c = 1; c <= 12; c++) {
      totalCellCount++;
      const cellNum = totalCellCount;

      let cellData = {
        id: `C${cellNum}`,
        cellNumber: cellNum,
        moduleId: `M${m}`,
        moduleIndex: m,
        cellInModule: c,
        voltage: +(3.74 + (Math.sin(cellNum * 1.5) * 0.05)).toFixed(3),
        temperature: +(29.5 + (Math.cos(cellNum * 0.8) * 2.2)).toFixed(1),
        internalResistance: +(1.85 + (Math.sin(cellNum * 2.1) * 0.25)).toFixed(2),
        isAnomalous: false,
        anomaly: null,
      };

      // Specific anomaly overrides for EV-4587 per specification
      if (vehicleId === 'EV-4587' || true) {
        if (cellNum === 12) {
          cellData.voltage = 3.540;
          cellData.temperature = 35.8;
          cellData.internalResistance = 2.65;
          cellData.isAnomalous = true;
          cellData.anomaly = {
            cell: 'Cell 12 (M1-C12)',
            issue: 'Voltage Deviation Trend',
            daysRemaining: 18,
            severity: 'warning',
            description: 'Cell voltage drift detected under high discharge load. Predicted capacity drop.',
          };
        } else if (cellNum === 45) {
          cellData.voltage = 3.710;
          cellData.temperature = 37.2;
          cellData.internalResistance = 3.48;
          cellData.isAnomalous = true;
          cellData.anomaly = {
            cell: 'Cell 45 (M4-C9)',
            issue: 'Rising Internal Resistance',
            daysRemaining: 42,
            severity: 'warning',
            description: 'Internal resistance increased by +1.4mΩ over last 100 cycles. Elevated thermal risk.',
          };
        } else if (cellNum === 67) {
          cellData.voltage = 3.680;
          cellData.temperature = 42.4;
          cellData.internalResistance = 2.82;
          cellData.isAnomalous = true;
          cellData.anomaly = {
            cell: 'Cell 67 (M6-C7)',
            issue: 'Temperature Increase Anomaly',
            daysRemaining: 76,
            severity: 'info',
            description: 'Thermal dissipation baseline drifting +3.8°C above module average.',
          };
        }
      }

      cells.push(cellData);
    }

    modules.push({
      id: `M${m}`,
      name: `Module ${m}`,
      cells,
    });
  }

  return modules;
}

export const ev4587RulSeries = [
  { year: '2025 Q1', actual: 98.2, predicted: null, lowerBound: null, upperBound: null },
  { year: '2025 Q2', actual: 96.8, predicted: null, lowerBound: null, upperBound: null },
  { year: '2025 Q3', actual: 95.4, predicted: null, lowerBound: null, upperBound: null },
  { year: '2025 Q4', actual: 93.9, predicted: null, lowerBound: null, upperBound: null },
  { year: '2026 Q1', actual: 92.0, predicted: 92.0, lowerBound: 92.0, upperBound: 92.0 },
  { year: '2026 Q2 (Cur)', actual: 91.5, predicted: 91.5, lowerBound: 90.8, upperBound: 92.2 },
  { year: '2026 Q3', actual: null, predicted: 89.8, lowerBound: 88.6, upperBound: 91.0 },
  { year: '2026 Q4', actual: null, predicted: 88.1, lowerBound: 86.4, upperBound: 89.8 },
  { year: '2027 Q2', actual: null, predicted: 84.6, lowerBound: 82.0, upperBound: 87.2 },
  { year: '2027 Q4', actual: null, predicted: 81.0, lowerBound: 77.5, upperBound: 84.5 },
  { year: '2028 Q2', actual: null, predicted: 77.2, lowerBound: 73.0, upperBound: 81.4 },
  { year: '2028 Q4 (EOL)', actual: null, predicted: 73.1, lowerBound: 68.2, upperBound: 78.0 },
  { year: '2029 Q4', actual: null, predicted: 65.0, lowerBound: 59.0, upperBound: 71.0 },
  { year: '2030 Q4', actual: null, predicted: 56.4, lowerBound: 49.5, upperBound: 63.3 },
];

export const ev4587PerformanceSeries = [
  { month: 'Apr 2026', actualEnergy: 412, predictedEnergy: 418, efficiency: 94.2 },
  { month: 'May 2026', actualEnergy: 428, predictedEnergy: 425, efficiency: 95.1 },
  { month: 'Jun 2026', actualEnergy: 395, predictedEnergy: 402, efficiency: 93.8 },
  { month: 'Jul 2026', actualEnergy: 440, predictedEnergy: 435, efficiency: 94.7 },
  { month: 'Aug 2026', actualEnergy: 418, predictedEnergy: 420, efficiency: 94.0 },
  { month: 'Sep 2026', actualEnergy: 405, predictedEnergy: 410, efficiency: 93.5 },
];

export const ev4587Anomalies = [
  {
    cell: 'Cell 12 (Module 1)',
    issue: 'Voltage Deviation Trend',
    daysRemaining: 18,
    severity: 'warning',
    modelConfidence: '94.2%',
    action: 'Calibrate cell balancer on next depot cycle',
  },
  {
    cell: 'Cell 45 (Module 4)',
    issue: 'Rising Internal Resistance',
    daysRemaining: 42,
    severity: 'warning',
    modelConfidence: '91.8%',
    action: 'Schedule thermal scan & torque inspection',
  },
  {
    cell: 'Cell 67 (Module 6)',
    issue: 'Temperature Delta Increase',
    daysRemaining: 76,
    severity: 'info',
    modelConfidence: '88.5%',
    action: 'Monitor coolant flow channel rate',
  },
];
