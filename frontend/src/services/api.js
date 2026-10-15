import { mockSites } from '../data/sites.js';
import { mockFleetOverview } from '../data/fleetOverview.js';
import {
  generatePackData,
  bess103RulSeries,
  bess103PerformanceSeries,
  bess103PowerProfile,
  bess103Equipment,
  bess103WorkOrders,
  bess103SystemAnomalies,
} from '../data/siteDetail.js';

/**
 * Service API layer — all components access data through these functions.
 *
 * To swap for a real API:
 *   1. Replace the `return Promise.resolve(...)` bodies with `fetch()` or `axios` calls.
 *   2. Keep the return data shapes aligned with what components expect.
 *   3. No component changes required.
 */

export async function getFleetOverview() {
  return Promise.resolve(mockFleetOverview);
}

export async function getSites() {
  return Promise.resolve(mockSites);
}

function makeSitePowerProfile(site) {
  if (site.id === 'BESS-JODHUR') return bess103PowerProfile;

  const usableCapacityMWh = site.capacityMWh * (site.soh / 100);
  const oneWayEfficiency = Math.sqrt(site.roundTripEfficiency / 100);
  const direction = site.status === 'Discharging' ? -1 : 1;
  const ratingScale = site.capacityMW / 30;
  const readings = bess103PowerProfile.map((point, index) => ({
    hour: point.hour,
    power: index === 23 && ['Idle', 'Fault'].includes(site.status)
      ? 0
      : point.power * ratingScale * direction,
  }));

  const calculate = (dispatchScale) => {
    const increments = readings.map(({ power }) => {
      const storedEnergyMWh = power >= 0
        ? power * oneWayEfficiency
        : power / oneWayEfficiency;
      return (storedEnergyMWh / usableCapacityMWh) * 100 * dispatchScale;
    });
    const netChange = increments.reduce((sum, value) => sum + value, 0);
    let soc = site.soc - netChange;
    const profile = readings.map((point, index) => {
      soc += increments[index];
      return { ...point, power: +(point.power * dispatchScale).toFixed(1), soc: +soc.toFixed(1) };
    });
    return { profile, valid: profile.every((point) => point.soc >= 5 && point.soc <= 95) };
  };

  let low = 0;
  let high = 1;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const middle = (low + high) / 2;
    if (calculate(middle).valid) low = middle;
    else high = middle;
  }
  return calculate(low).profile;
}

export async function getSite(id) {
  const site = mockSites.find((s) => s.id === id) || mockSites[0];
  const containers = generatePackData(site.id);
  const cells = containers.flatMap((container) => container.racks.flatMap((rack) => rack.modules.flatMap((module) => module.cells)));
  const maxCellTemperature = Math.max(...cells.map((cell) => cell.temperature));
  const voltageValues = cells.map((cell) => cell.voltage);
  const voltageImbalance = +(Math.max(...voltageValues) - Math.min(...voltageValues)).toFixed(3);
  const containerSummary = containers.map((container) => {
    const containerCells = container.racks.flatMap((rack) => rack.modules.flatMap((module) => module.cells));
    return {
      id: container.id,
      name: container.name,
      soc: +(site.soc + (container.id === 'Cont1' ? 0.8 : -0.6)).toFixed(1),
      maxTemperature: +Math.max(...containerCells.map((cell) => cell.temperature)).toFixed(1),
      voltageSpread: +(Math.max(...containerCells.map((cell) => cell.voltage)) - Math.min(...containerCells.map((cell) => cell.voltage))).toFixed(3),
      rackCount: container.racks.length,
    };
  });
  const equipment = {
    ...bess103Equipment,
    fireSuppression: {
      ...bess103Equipment.fireSuppression,
      status: site.id === 'BESS-JODHUR' ? 'Trouble' : bess103Equipment.fireSuppression.status,
    },
    environment: {
      ...bess103Equipment.environment,
      ambientTempC: site.temperature,
      smokeDetector: site.id === 'BESS-JODHUR' ? 'Normal' : 'Normal',
      gasDetector: site.id === 'BESS-JODHUR' ? 'Normal' : 'Normal',
      securitySensors: 'Normal',
    },
  };

  return Promise.resolve({
    ...site,
    energyTodayMWh: site.id === 'BESS-JODHUR'
      ? bess103Equipment.energyMeter.todayChargedMWh + bess103Equipment.energyMeter.todayDischargedMWh
      : site.energyTodayMWh,
    pack: { containers, containerSummary },
    soeMWh: +(site.capacityMWh * (site.soc / 100) * (site.soh / 100)).toFixed(1),
    maxCellTemperature: +maxCellTemperature.toFixed(1),
    voltageImbalance,
    rulSeries: bess103RulSeries,
    performanceSeries: bess103PerformanceSeries,
    powerProfile: makeSitePowerProfile(site),
    equipment,
    workOrders: bess103WorkOrders,
    predictedAnomalies: bess103SystemAnomalies,
  });
}

export async function getSiteAlarms(id) {
  const siteAlarms = mockFleetOverview.recentAlarms.filter((a) => a.siteId === id);
  // Return all for the site, or a mock full list padded for hero sites
  return Promise.resolve(siteAlarms);
}
