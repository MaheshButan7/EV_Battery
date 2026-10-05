import { mockVehicles } from '../data/vehicles.js';
import { mockFleetOverview } from '../data/fleetOverview.js';
import {
  generatePackData,
  ev4587RulSeries,
  ev4587PerformanceSeries,
  ev4587Anomalies,
} from '../data/vehicleDetail.js';

/**
 * Service API layer returning Promises so components don't bind directly to mock files.
 */

export async function getFleetOverview() {
  // Simulate immediate microtask promise resolution
  return Promise.resolve(mockFleetOverview);
}

export async function getVehicles() {
  return Promise.resolve(mockVehicles);
}

export async function getVehicle(id) {
  const vehicle = mockVehicles.find((v) => v.id === id) || mockVehicles[0];

  const modules = generatePackData(vehicle.id);

  return Promise.resolve({
    ...vehicle,
    pack: {
      totalModules: 8,
      cellsPerModule: 12,
      totalCells: 96,
      modules,
    },
    rulSeries: ev4587RulSeries,
    performanceSeries: ev4587PerformanceSeries,
    predictedAnomalies: ev4587Anomalies,
  });
}
