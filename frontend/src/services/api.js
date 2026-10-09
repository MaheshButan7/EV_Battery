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
  if (site.id === 'BESS-103') return bess103PowerProfile;

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

  return Promise.resolve({
    ...site,
    energyTodayMWh: site.id === 'BESS-103'
      ? bess103Equipment.energyMeter.todayChargedMWh + bess103Equipment.energyMeter.todayDischargedMWh
      : site.energyTodayMWh,
    pack: { containers },
    rulSeries: bess103RulSeries,
    performanceSeries: bess103PerformanceSeries,
    powerProfile: makeSitePowerProfile(site),
    equipment: bess103Equipment,
    workOrders: bess103WorkOrders,
    predictedAnomalies: bess103SystemAnomalies,
  });
}

export async function getSiteAlarms(id) {
  const siteAlarms = mockFleetOverview.recentAlarms.filter((a) => a.siteId === id);
  // Return all for the site, or a mock full list padded for hero sites
  return Promise.resolve(siteAlarms);
}
