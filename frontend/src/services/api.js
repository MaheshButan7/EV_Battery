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

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
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

const siteDetailCache = new Map();

export async function getSite(id) {
  if (siteDetailCache.has(id)) return Promise.resolve(siteDetailCache.get(id));
  const site = mockSites.find((s) => s.id === id) || mockSites[0];
  const containers = generatePackData(site.id);
  const rackCount = containers.reduce((sum, container) => sum + container.racks.length, 0);
  const totalStrings = rackCount * 2;
  const dcVoltageKV = site.dcVoltage / 1000;
  const siteDcCurrentKA = dcVoltageKV ? Math.abs(site.powerMW) / dcVoltageKV : 0;
  const stringCurrentA = (siteDcCurrentKA * 1000) / totalStrings;
  const sitePowerPerRackMW = site.powerMW / rackCount;
  const cells = containers.flatMap((container) => container.racks.flatMap((rack) => rack.modules.flatMap((module) => module.cells)));
  const maxCellTemperature = Math.max(...cells.map((cell) => cell.temperature));
  const voltageValues = cells.map((cell) => cell.voltage);
  const voltageImbalance = +(Math.max(...voltageValues) - Math.min(...voltageValues)).toFixed(3);
  const rackSummary = containers.flatMap((container) => container.racks.map((rack) => {
    const moduleSummary = rack.modules.map((module) => {
      const moduleVoltages = module.cells.map((cell) => cell.voltage);
      const averageCellVoltage = moduleVoltages.reduce((sum, value) => sum + value, 0) / moduleVoltages.length;
      const averageTemperature = module.cells.reduce((sum, cell) => sum + cell.temperature, 0) / module.cells.length;
      module.cells.forEach((cell) => {
        cell.soc = round(Math.max(0, Math.min(100, site.soc + (cell.voltage - averageCellVoltage) * 18)), 1);
        cell.balancingStatus = Math.abs(cell.voltage - averageCellVoltage) >= 0.025 ? 'Review' : 'Balanced';
      });
      return {
        id: module.id,
        name: module.name,
        cellCount: module.cells.length,
        averageCellVoltage: round(averageCellVoltage, 3),
        moduleVoltage: round(averageCellVoltage * module.cells.length, 2),
        averageTemperature: round(averageTemperature, 1),
        maxTemperature: round(Math.max(...module.cells.map((cell) => cell.temperature)), 1),
        voltageSpread: round(Math.max(...moduleVoltages) - Math.min(...moduleVoltages), 3),
        averageSoc: round(module.cells.reduce((sum, cell) => sum + cell.soc, 0) / module.cells.length, 1),
        balancingStatus: module.cells.some((cell) => cell.balancingStatus === 'Review') ? 'Review required' : 'Balanced',
      };
    });
    const rackCells = rack.modules.flatMap((module) => module.cells);
    const averageCellVoltage = rackCells.reduce((sum, cell) => sum + cell.voltage, 0) / rackCells.length;
    const voltageValues = rackCells.map((cell) => cell.voltage);
    return {
      id: `${container.id}-${rack.id}`,
      containerId: container.id,
      containerName: container.name,
      rackId: rack.id,
      rackName: rack.name,
      moduleCount: rack.modules.length,
      cellCount: rackCells.length,
      averageSoc: round(rackCells.reduce((sum, cell) => sum + cell.soc, 0) / rackCells.length, 1),
      averageTemperature: round(rackCells.reduce((sum, cell) => sum + cell.temperature, 0) / rackCells.length, 1),
      maxTemperature: round(Math.max(...rackCells.map((cell) => cell.temperature)), 1),
      averageCellVoltage: round(averageCellVoltage, 3),
      rackVoltage: round(averageCellVoltage * rackCells.length, 2),
      voltageSpread: round(Math.max(...voltageValues) - Math.min(...voltageValues), 3),
      stringCurrentA: round(stringCurrentA, 1),
      chargeDischargePowerMW: round(sitePowerPerRackMW, 2),
      balancingStatus: rackCells.some((cell) => cell.balancingStatus === 'Review') ? 'Review required' : 'Balanced',
      modules: moduleSummary,
    };
  }));
  const containerSummary = containers.map((container) => {
    const racks = rackSummary.filter((rack) => rack.containerId === container.id);
    const containerCells = container.racks.flatMap((rack) => rack.modules.flatMap((module) => module.cells));
    return {
      id: container.id,
      name: container.name,
      soc: +(site.soc + (container.id === 'Cont1' ? 0.8 : -0.6)).toFixed(1),
      maxTemperature: +Math.max(...containerCells.map((cell) => cell.temperature)).toFixed(1),
      voltageSpread: +(Math.max(...containerCells.map((cell) => cell.voltage)) - Math.min(...containerCells.map((cell) => cell.voltage))).toFixed(3),
      rackCount: container.racks.length,
      averageTemperature: round(containerCells.reduce((sum, cell) => sum + cell.temperature, 0) / containerCells.length, 1),
      maximumRackVoltage: round(Math.max(...racks.map((rack) => rack.rackVoltage)), 2),
      averageStringCurrentA: round(racks.reduce((sum, rack) => sum + rack.stringCurrentA, 0) / racks.length, 1),
      chargeDischargePowerMW: round(racks.reduce((sum, rack) => sum + rack.chargeDischargePowerMW, 0), 2),
      balancingStatus: racks.some((rack) => rack.balancingStatus === 'Review required') ? 'Review required' : 'Balanced',
    };
  });
  const basePcs = bess103Equipment.pcs;
  const pcsPower = site.powerMW;
  const pcsAcCurrentA = (Math.abs(pcsPower) * 1_000_000) / (Math.sqrt(3) * basePcs.acVoltage);
  const pcsDcCurrentA = (Math.abs(pcsPower) * 1_000_000) / basePcs.dcVoltage;
  const equipment = {
    ...bess103Equipment,
    transformer: { ...bess103Equipment.transformer, primaryVoltageKV: 33, secondaryVoltageKV: 0.69, tapPosition: 4 },
    switchgear: {
      ...bess103Equipment.switchgear,
      voltageKV: 33,
      currentA: Math.round(Math.abs(site.powerMW) * 1_000_000 / (Math.sqrt(3) * 33_000)),
      tripState: 'Normal',
      interlockState: 'Healthy',
    },
    protectionRelay: { label: 'Protection relay', status: 'Healthy', tripState: 'Normal', activeElements: 0 },
    ups: { ...bess103Equipment.ups, inputVoltageV: 230, outputVoltageV: 230, runtimeMinutes: 42, bypassState: 'Normal' },
    pcs: {
      ...basePcs,
      status: site.status === 'Offline' ? 'Offline' : site.status === 'Fault' ? 'Fault' : 'Active',
      activePowerMW: round(pcsPower, 2),
      reactivePowerMVAr: round(basePcs.reactivePowerMVAr * (Math.abs(pcsPower) / basePcs.activePowerMW), 2),
      acCurrentA: round(pcsAcCurrentA, 0),
      dcCurrentA: round(pcsDcCurrentA, 0),
      setpointMW: round(pcsPower, 2),
      actualPowerMW: round(pcsPower, 2),
      derating: site.id === 'BESS-PUNE' ? 'Active · ambient temperature' : 'None',
      powerProfile: makeSitePowerProfile(site),
    },
    fireSuppression: {
      ...bess103Equipment.fireSuppression,
      status: site.id === 'BESS-JODHUR' ? 'Trouble' : bess103Equipment.fireSuppression.status,
    },
    environment: {
      ...bess103Equipment.environment,
      ambientTempC: site.temperature,
      smokeDetector: site.id === 'BESS-JODHUR' ? 'Normal' : 'Normal',
      gasDetector: site.id === 'BESS-JODHUR' ? 'Normal' : 'Normal',
      emergencySystem: 'Available',
      weather: ({ 'BESS-PUNE': '31 °C · Clear', 'BESS-JODHUR': '36 °C · Dry', 'BESS-CHENNAI': '29 °C · Humid', 'BESS-RAIPUR': '32 °C · Cloudy' })[site.id] || '32 °C · Clear',
      securitySensors: 'Normal',
    },
  };

  const siteDetail = {
    ...site,
    energyTodayMWh: site.id === 'BESS-JODHUR'
      ? bess103Equipment.energyMeter.todayChargedMWh + bess103Equipment.energyMeter.todayDischargedMWh
      : site.energyTodayMWh,
    pack: { containers, containerSummary, rackSummary },
    soeMWh: +(site.capacityMWh * (site.soc / 100) * (site.soh / 100)).toFixed(1),
    maxCellTemperature: +maxCellTemperature.toFixed(1),
    voltageImbalance,
    rulSeries: bess103RulSeries,
    performanceSeries: bess103PerformanceSeries,
    powerProfile: makeSitePowerProfile(site),
    equipment,
    workOrders: bess103WorkOrders,
    predictedAnomalies: bess103SystemAnomalies,
  };
  siteDetailCache.set(id, siteDetail);
  return Promise.resolve(siteDetail);
}

export async function getSiteAlarms(id) {
  const siteAlarms = mockFleetOverview.recentAlarms.filter((a) => a.siteId === id);
  // Return all for the site, or a mock full list padded for hero sites
  return Promise.resolve(siteAlarms);
}
