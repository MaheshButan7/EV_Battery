import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mockFleetOverview } from '../data/fleetOverview';
import { bess103WorkOrders } from '../data/siteDetail';
import { mockSites } from '../data/sites';
import { useAuth } from './useAuth';

const DemoDataContext = createContext(null);

const initialParts = [
  { id: 'SP-001', name: 'LFP cell module 280Ah', stock: 12, reserved: 2, minimum: 8, location: 'Jodhpur Store' },
  { id: 'SP-014', name: 'HVAC filter kit', stock: 6, reserved: 3, minimum: 10, location: 'Raipur Store' },
  { id: 'SP-022', name: 'Fire panel sensor', stock: 18, reserved: 0, minimum: 5, location: 'Central Store' },
  { id: 'SP-031', name: 'DC fuse 1250V', stock: 24, reserved: 4, minimum: 12, location: 'Pune Store' },
];

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
  const [workOrders, setWorkOrders] = useState(() => bess103WorkOrders);
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

  const createWorkOrderFromAlarm = (alarmId, user = 'Demo Operator') => {
    const alarm = alarms.find((item) => item.id === alarmId);
    if (!alarm) return null;

    const existing = workOrders.find((workOrder) => workOrder.alarmId === alarmId);
    if (existing) return existing;

    const workOrder = {
      id: `WO-${String(workOrders.length + 2842).padStart(4, '0')}`,
      alarmId,
      siteId: alarm.siteId,
      type: alarm.priority === 'Critical' ? 'Emergency' : 'Corrective',
      description: alarm.title,
      priority: alarm.priority,
      dueDate: '2026-10-16',
      assignee: 'Unassigned',
      status: 'New',
    };

    setWorkOrders((current) => [workOrder, ...current]);
    setAlarms((current) => current.map((item) => (
      item.id === alarmId ? { ...item, workOrderId: workOrder.id } : item
    )));
    addEvent({ type: 'Work order created', alarmId, workOrderId: workOrder.id, siteId: alarm.siteId, actor: user });
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
    addEvent({ type: 'Spare part reserved', partId, partName: part.name, actor: user });
    return true;
  };

  const value = useMemo(() => ({
    tick,
    lastUpdated,
    connection: 'Connected',
    isSimulated: true,
    accessibleSiteIds,
    accessibleSites: mockSites.filter((site) => accessibleSiteIds.includes(site.id)),
    selectedSiteId,
    selectedSite: mockSites.find((site) => site.id === selectedSiteId) || null,
    selectSite,
    alarms: alarms.filter((alarm) => alarm.siteId === selectedSiteId),
    workOrders: workOrders.filter((workOrder) => !workOrder.siteId || workOrder.siteId === selectedSiteId),
    events,
    permit,
    parts,
    acknowledgeAlarm,
    createWorkOrderFromAlarm,
    updateWorkOrderStatus,
    updatePermit,
    reservePart,
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
