import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mockFleetOverview } from '../data/fleetOverview';
import { bess103WorkOrders } from '../data/siteDetail';
import { mockSites } from '../data/sites';
import { useAuth } from './useAuth';

const DemoDataContext = createContext(null);

const initialParts = [
  { id: 'SP-001', name: 'LFP cell module 280Ah', category: 'Battery', stock: 12, reserved: 2, minimum: 8, location: 'Jodhpur Store', siteId: 'BESS-JODHUR' },
  { id: 'SP-002', name: 'DC fuse 1250V', category: 'Electrical', stock: 8, reserved: 1, minimum: 12, location: 'Jodhpur Store', siteId: 'BESS-JODHUR' },
  { id: 'SP-003', name: 'Coolant circulation pump', category: 'HVAC', stock: 3, reserved: 1, minimum: 4, location: 'Jodhpur Store', siteId: 'BESS-JODHUR' },
  { id: 'SP-004', name: 'BMS voltage sensing board', category: 'Controls', stock: 10, reserved: 1, minimum: 4, location: 'Jodhpur Store', siteId: 'BESS-JODHUR' },
  { id: 'SP-014', name: 'HVAC filter kit', category: 'HVAC', stock: 6, reserved: 3, minimum: 10, location: 'Jodhpur Store', siteId: 'BESS-JODHUR' },
  { id: 'SP-015', name: 'HVAC filter kit', category: 'HVAC', stock: 6, reserved: 3, minimum: 10, location: 'Raipur Store', siteId: 'BESS-RAIPUR' },
  { id: 'SP-016', name: 'HVAC blower motor', category: 'HVAC', stock: 4, reserved: 1, minimum: 4, location: 'Raipur Store', siteId: 'BESS-RAIPUR' },
  { id: 'SP-017', name: 'Battery rack contactor', category: 'Electrical', stock: 9, reserved: 2, minimum: 6, location: 'Raipur Store', siteId: 'BESS-RAIPUR' },
  { id: 'SP-031', name: 'DC fuse 1250V', category: 'Electrical', stock: 24, reserved: 4, minimum: 12, location: 'Pune Store', siteId: 'BESS-PUNE' },
  { id: 'SP-032', name: 'HVAC filter kit', category: 'HVAC', stock: 7, reserved: 1, minimum: 8, location: 'Pune Store', siteId: 'BESS-PUNE' },
  { id: 'SP-033', name: 'Smoke detector module', category: 'Safety', stock: 10, reserved: 0, minimum: 4, location: 'Pune Store', siteId: 'BESS-PUNE' },
  { id: 'SP-041', name: 'Fiber gateway module', category: 'Communications', stock: 2, reserved: 0, minimum: 3, location: 'Chennai Store', siteId: 'BESS-CHENNAI' },
  { id: 'SP-042', name: 'Coolant pump seal kit', category: 'HVAC', stock: 5, reserved: 1, minimum: 4, location: 'Chennai Store', siteId: 'BESS-CHENNAI' },
  { id: 'SP-043', name: 'BMS communications card', category: 'Controls', stock: 7, reserved: 1, minimum: 5, location: 'Chennai Store', siteId: 'BESS-CHENNAI' },
  { id: 'SP-022', name: 'Fire panel sensor', category: 'Safety', stock: 18, reserved: 0, minimum: 5, location: 'Central Store', siteId: null },
  { id: 'SP-023', name: 'Fire system backup battery', category: 'Safety', stock: 11, reserved: 2, minimum: 6, location: 'Central Store', siteId: null },
  { id: 'SP-024', name: 'Thermal sensor harness', category: 'Controls', stock: 3, reserved: 0, minimum: 4, location: 'Central Store', siteId: null },
];

const defaultChecklist = (completed = 0) => [
  { id: 'review', label: 'Review permit and isolation requirements', done: completed > 0 },
  { id: 'inspect', label: 'Inspect equipment and record condition', done: completed > 1 },
  { id: 'verify', label: 'Verify operation and close out findings', done: completed > 2 },
];

const workOrderDateOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const jodhpurWorkOrders = bess103WorkOrders.map((workOrder) => {
  const extra = {
    'WO-2841': { assetId: 'BESS-JODHUR-BMS-01', status: 'Assigned', dueDate: workOrderDateOffset(2), checklist: defaultChecklist(1) },
    'WO-2856': { assetId: 'BESS-JODHUR-HVAC-02', status: 'In progress', dueDate: workOrderDateOffset(6), checklist: defaultChecklist(2), reservedParts: ['SP-014'] },
    'WO-2872': { assetId: 'BESS-JODHUR-CONT-01-RACK-02', status: 'Waiting parts', dueDate: workOrderDateOffset(-2), checklist: defaultChecklist(1), reservedParts: ['SP-001'] },
    'WO-2891': { assetId: 'BESS-JODHUR-SWG-01', status: 'Done', dueDate: workOrderDateOffset(20), checklist: defaultChecklist(3) },
  }[workOrder.id];
  return { ...workOrder, siteId: 'BESS-JODHUR', ...extra };
});

const otherSiteWorkOrders = mockSites.filter((site) => site.id !== 'BESS-JODHUR').flatMap((site, index) => {
  const firstNumber = 3001 + index * 2;
  return [
    {
      id: `WO-${firstNumber}`,
      siteId: site.id,
      assetId: `${site.id}-BMS-01`,
      type: 'Preventive',
      description: 'Quarterly BMS health check and calibration review',
      priority: 'Minor',
      dueDate: workOrderDateOffset(4),
      assignee: ['A. Rao', 'R. Mehta', 'V. Shah'][index],
      status: 'Scheduled',
      checklist: defaultChecklist(),
      reservedParts: [],
    },
    {
      id: `WO-${firstNumber + 1}`,
      siteId: site.id,
      assetId: `${site.id}-HVAC-01`,
      type: 'Corrective',
      description: 'Inspect HVAC filters and verify cooling performance',
      priority: site.riskLevel === 'High' ? 'Major' : 'Minor',
      dueDate: workOrderDateOffset(8),
      assignee: ['P. Kumar', 'N. Iyer', 'S. Patil'][index],
      status: 'Assigned',
      checklist: defaultChecklist(1),
      reservedParts: [],
    },
  ];
});

const initialWorkOrders = [...jodhpurWorkOrders, ...otherSiteWorkOrders];

export function DemoDataProvider({ children }) {
  const { user } = useAuth();
  const accessibleSiteIds = user?.siteIds?.length ? user.siteIds : mockSites.map((site) => site.id);
  const defaultSiteId = accessibleSiteIds.includes('BESS-JODHUR') ? 'BESS-JODHUR' : accessibleSiteIds[0];
  const [selectedSiteId, setSelectedSiteId] = useState(() => localStorage.getItem('bess_selected_site') || defaultSiteId);
  const [tick, setTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [alarms, setAlarms] = useState(() => mockFleetOverview.recentAlarms.map((alarm) => ({
    ...alarm,
    state: 'Active',
    acknowledgedAt: null,
    acknowledgedBy: null,
    workOrderId: null,
  })));
  const [workOrders, setWorkOrders] = useState(() => initialWorkOrders);
  const [events, setEvents] = useState([]);
  const [permit, setPermit] = useState({
    id: 'PTW-2026-0042',
    state: 'Requested',
    isolationVerified: false,
  });
  const [parts, setParts] = useState(initialParts);

  useEffect(() => {
    if (!accessibleSiteIds.includes(selectedSiteId)) {
      setSelectedSiteId(defaultSiteId);
    }
  }, [accessibleSiteIds, defaultSiteId, selectedSiteId]);

  useEffect(() => {
    if (selectedSiteId) localStorage.setItem('bess_selected_site', selectedSiteId);
  }, [selectedSiteId]);

  const selectSite = (siteId) => {
    if (accessibleSiteIds.includes(siteId)) setSelectedSiteId(siteId);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
      setLastUpdated(new Date());
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  const addEvent = (event) => {
    setEvents((current) => [{
      id: `EVT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...event,
    }, ...current]);
  };

  const acknowledgeAlarm = (alarmId, user = 'Demo Operator') => {
    setAlarms((current) => current.map((alarm) => (
      alarm.id === alarmId
        ? { ...alarm, state: 'Acknowledged', acknowledgedAt: new Date().toISOString(), acknowledgedBy: user }
        : alarm
    )));
    const alarm = alarms.find((item) => item.id === alarmId);
    if (alarm) addEvent({ type: 'Alarm acknowledged', alarmId, siteId: alarm.siteId, actor: user });
  };

  const updateAlarmState = (alarmId, state, details = {}, user = 'Demo Operator') => {
    const alarm = alarms.find((item) => item.id === alarmId);
    if (!alarm || alarm.state === state && !Object.keys(details).length) return;
    setAlarms((current) => current.map((item) => (
      item.id === alarmId
        ? { ...item, ...details, state, updatedAt: new Date().toISOString(), updatedBy: user }
        : item
    )));
    addEvent({ type: `Alarm ${state.toLowerCase()}`, alarmId, siteId: alarm.siteId, actor: user, ...details });
  };

  const shelveAlarm = (alarmId, durationMinutes = 60, user = 'Demo Operator') => updateAlarmState(
    alarmId,
    'Shelved',
    { shelvedUntil: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(), shelvedForMinutes: durationMinutes },
    user,
  );

  const suppressAlarm = (alarmId, reason = 'Demo suppression rule', user = 'Demo Operator') => updateAlarmState(
    alarmId,
    'Suppressed',
    { suppressionReason: reason },
    user,
  );

  const escalateAlarm = (alarmId, role = 'Maintenance Planner', user = 'Demo Operator') => updateAlarmState(
    alarmId,
    'Escalated',
    { escalatedTo: role },
    user,
  );

  const correlateAlarm = (alarmId, parentAlarmId, user = 'Demo Operator') => {
    const alarm = alarms.find((item) => item.id === alarmId);
    const parent = alarms.find((item) => item.id === parentAlarmId);
    if (!alarm || !parent || alarmId === parentAlarmId) return;
    updateAlarmState(alarmId, alarm.state, { correlatedTo: parentAlarmId }, user);
  };

  const createWorkOrderFromAlarm = (alarmId, user = 'Demo Operator') => {
    const alarm = alarms.find((item) => item.id === alarmId);
    if (!alarm) return null;

    const existing = workOrders.find((workOrder) => workOrder.alarmId === alarmId);
    if (existing) return existing;

    const workOrder = {
      id: `WO-${String(Math.max(3000, ...workOrders.map((item) => Number(item.id.replace('WO-', '')) || 0)) + 1).padStart(4, '0')}`,
      alarmId,
      siteId: alarm.siteId,
      assetId: alarm.equipment?.includes('HVAC') ? `${alarm.siteId}-HVAC-${alarm.equipment.endsWith('-1') ? '01' : '02'}`
        : alarm.equipment?.includes('FIRE') ? `${alarm.siteId}-FIRE-01`
          : alarm.equipment?.startsWith('GW') ? `${alarm.siteId}-GW-01`
            : `${alarm.siteId}-BMS-01`,
      type: alarm.priority === 'Critical' ? 'Emergency' : 'Corrective',
      description: alarm.title,
      priority: alarm.priority,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      assignee: 'Unassigned',
      status: 'New',
      checklist: defaultChecklist(),
      reservedParts: [],
    };

    setWorkOrders((current) => [workOrder, ...current]);
    setAlarms((current) => current.map((item) => (
      item.id === alarmId ? { ...item, workOrderId: workOrder.id } : item
    )));
    addEvent({ type: 'Work order created', alarmId, workOrderId: workOrder.id, siteId: alarm.siteId, actor: user });
    return workOrder;
  };

  const createManualWorkOrder = ({ siteId, assetId, description, priority = 'Major', type = 'Corrective' }, user = 'Demo Operator') => {
    const workOrder = {
      id: `WO-${String(Math.max(3000, ...workOrders.map((item) => Number(item.id.replace('WO-', '')) || 0)) + 1).padStart(4, '0')}`,
      siteId,
      assetId,
      type,
      description,
      priority,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      assignee: 'Unassigned',
      status: 'New',
      checklist: defaultChecklist(),
      reservedParts: [],
    };
    setWorkOrders((current) => [workOrder, ...current]);
    addEvent({ type: 'Manual work order created', workOrderId: workOrder.id, siteId, assetId, actor: user });
    return workOrder;
  };

  const updateWorkOrderStatus = (workOrderId, status, user = 'Demo Operator') => {
    const workOrder = workOrders.find((item) => item.id === workOrderId);
    if (!workOrder || workOrder.status === status) return;
    setWorkOrders((current) => current.map((item) => (
      item.id === workOrderId ? { ...item, status } : item
    )));
    addEvent({ type: 'Work order status updated', workOrderId, status, siteId: workOrder.siteId, actor: user });
  };

  const assignWorkOrder = (workOrderId, assignee, user = 'Demo Operator') => {
    const workOrder = workOrders.find((item) => item.id === workOrderId);
    if (!workOrder || workOrder.assignee === assignee) return;
    setWorkOrders((current) => current.map((item) => item.id === workOrderId ? { ...item, assignee } : item));
    addEvent({ type: 'Work order assigned', workOrderId, siteId: workOrder.siteId, assignee, actor: user });
  };

  const updateWorkOrderChecklist = (workOrderId, checklistItemId, done, user = 'Demo Operator') => {
    const workOrder = workOrders.find((item) => item.id === workOrderId);
    if (!workOrder) return;
    setWorkOrders((current) => current.map((item) => item.id === workOrderId
      ? { ...item, checklist: (item.checklist || []).map((checklistItem) => checklistItem.id === checklistItemId ? { ...checklistItem, done } : checklistItem) }
      : item));
    addEvent({ type: done ? 'Inspection checklist item completed' : 'Inspection checklist item reopened', workOrderId, siteId: workOrder.siteId, checklistItemId, actor: user });
  };

  const reservePartForWorkOrder = (workOrderId, partId, user = 'Demo Operator') => {
    const workOrder = workOrders.find((item) => item.id === workOrderId);
    const part = parts.find((item) => item.id === partId);
    if (!workOrder || !part || (part.siteId && part.siteId !== workOrder.siteId) || part.stock <= part.reserved || (workOrder.reservedParts || []).includes(partId)) return false;
    setParts((current) => current.map((item) => item.id === partId ? { ...item, reserved: item.reserved + 1 } : item));
    setWorkOrders((current) => current.map((item) => item.id === workOrderId
      ? { ...item, reservedParts: [...(item.reservedParts || []), partId] }
      : item));
    addEvent({ type: 'Spare part reserved for work order', workOrderId, siteId: workOrder.siteId, partId, partName: part.name, actor: user });
    return true;
  };

  const updatePermit = (changes, user = 'Demo Operator') => {
    setPermit((current) => ({ ...current, ...changes }));
    addEvent({ type: 'Permit updated', permitId: permit.id, ...changes, actor: user });
  };

  const reservePart = (partId, user = 'Demo Operator') => {
    const part = parts.find((item) => item.id === partId);
    if (!part || part.stock <= part.reserved) return false;
    setParts((current) => current.map((item) => (
      item.id === partId ? { ...item, reserved: item.reserved + 1 } : item
    )));
    addEvent({ type: 'Spare part reserved', partId, partName: part.name, siteId: part.siteId || selectedSiteId, actor: user });
    return true;
  };

  const updatePartStock = (partId, delta, transaction = 'Stock adjusted', user = 'Demo Operator') => {
    const part = parts.find((item) => item.id === partId);
    if (!part || part.stock + delta < part.reserved) return false;
    setParts((current) => current.map((item) => item.id === partId ? { ...item, stock: item.stock + delta } : item));
    addEvent({ type: transaction, partId, partName: part.name, quantity: Math.abs(delta), siteId: part.siteId || selectedSiteId, actor: user });
    return true;
  };

  const value = useMemo(() => ({
    tick,
    lastUpdated,
    connection: 'Connected',
    isSimulated: true,
    accessibleSiteIds,
    accessibleSites: mockSites.filter((site) => accessibleSiteIds.includes(site.id)),
    accessibleAlarms: alarms.filter((alarm) => accessibleSiteIds.includes(alarm.siteId)),
    selectedSiteId,
    selectedSite: mockSites.find((site) => site.id === selectedSiteId) || null,
    selectSite,
    alarms: alarms.filter((alarm) => alarm.siteId === selectedSiteId),
    workOrders: workOrders.filter((workOrder) => !workOrder.siteId || workOrder.siteId === selectedSiteId),
    events,
    permit,
    parts,
    acknowledgeAlarm,
    updateAlarmState,
    shelveAlarm,
    suppressAlarm,
    escalateAlarm,
    correlateAlarm,
    createWorkOrderFromAlarm,
    createManualWorkOrder,
    updateWorkOrderStatus,
    assignWorkOrder,
    updateWorkOrderChecklist,
    reservePartForWorkOrder,
    updatePermit,
    reservePart,
    updatePartStock,
  }), [tick, lastUpdated, alarms, workOrders, events, permit, parts, accessibleSiteIds, selectedSiteId]);

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used inside DemoDataProvider');
  }
  return context;
}
