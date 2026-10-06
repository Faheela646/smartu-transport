import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BUSES,
  DRIVERS,
  CONDUCTORS,
  ROUTES,
  DEFAULT_SCHEDULES,
  CAMPUS_CENTER,
  SCHEDULE_TYPES,
  RECURRENCE_TYPES,
} from "@/data/mockData";
import { syncPersistedStore } from "@/lib/storeSync";

const INITIAL_STOPS = [...new Map(
  ROUTES.flatMap((route) => route.stops.map((stop) => [stop.name.toLowerCase(), stop]))
).values()].map((stop, index) => ({ id: `STOP-${String(index + 1).padStart(3, "0")}`, ...stop }));

function nextRecordId(prefix, records, firstNumber = 1) {
  const usedIds = new Set(records.map((record) => record.id));
  let number = firstNumber;
  let id = `${prefix}-${String(number).padStart(2, "0")}`;
  while (usedIds.has(id)) {
    number += 1;
    id = `${prefix}-${String(number).padStart(2, "0")}`;
  }
  return id;
}

// Convert "7:15 AM", "05:00 PM", "11:30 PM", "14:00" to minutes from midnight
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const str = timeStr.trim().toUpperCase();
  const matchAmPm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!matchAmPm) return null;
  let hours = Number(matchAmPm[1]);
  const minutes = Number(matchAmPm[2]);
  const ampm = matchAmPm[3];
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Check if schedule is active on a given YYYY-MM-DD
export function isScheduleApplicableOnDate(schedule, dateStr) {
  if (!schedule || schedule.status !== "ACTIVE") return false;
  if (!dateStr) return true;

  // Date boundaries
  if (schedule.startDate && dateStr < schedule.startDate) return false;
  if (schedule.endDate && dateStr > schedule.endDate) return false;

  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday

  switch (schedule.recurrence) {
    case RECURRENCE_TYPES.SPECIFIC_DATE:
    case RECURRENCE_TYPES.EVENT:
      return schedule.specificDate === dateStr;
    case RECURRENCE_TYPES.FRIDAY_ONLY:
      return dayOfWeek === 5;
    case RECURRENCE_TYPES.WEEKDAYS:
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case RECURRENCE_TYPES.DAILY:
      return true;
    case RECURRENCE_TYPES.DATE_RANGE:
      return Boolean(
        (!schedule.startDate || dateStr >= schedule.startDate) &&
        (!schedule.endDate || dateStr <= schedule.endDate)
      );
    default:
      return true;
  }
}

export const useFleetStore = create(persist((set, get) => ({
  buses: BUSES,
  drivers: DRIVERS,
  conductors: CONDUCTORS,
  routes: ROUTES,
  stops: INITIAL_STOPS,
  schedules: DEFAULT_SCHEDULES,

  // ---- Buses ----
  addBus: (bus) =>
    set((state) => ({
      buses: [
        ...state.buses,
        { id: nextRecordId("BUS", state.buses, 101), status: "Reserve", routeId: null, ...bus },
      ],
    })),

  updateBus: (id, patch) =>
    set((state) => ({
      buses: state.buses.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),

  deleteBus: (id) => set((state) => ({
    buses: state.buses.filter((bus) => bus.id !== id),
    routes: state.routes.map((route) => route.busId === id ? { ...route, busId: null } : route),
    schedules: state.schedules.map((sch) => sch.busId === id ? { ...sch, busId: null } : sch),
    drivers: state.drivers.map((driver) =>
      driver.assignedBusId === id ? { ...driver, status: "Reserve", assignedBusId: null } : driver
    ),
    conductors: state.conductors.map((conductor) =>
      conductor.assignedBusId === id ? { ...conductor, status: "Reserve", assignedBusId: null } : conductor
    ),
  })),

  sendBusToMaintenance: (busId, replacementBusId) =>
    set((state) => {
      const bus = state.buses.find((b) => b.id === busId);
      const routeId = bus?.routeId;
      return {
        buses: state.buses.map((b) => {
          if (b.id === busId) return { ...b, status: "Under Maintenance", routeId: null };
          if (b.id === replacementBusId) return { ...b, status: "Active", routeId };
          return b;
        }),
        routes: state.routes.map((r) => (r.id === routeId ? { ...r, busId: replacementBusId } : r)),
        schedules: state.schedules.map((sch) =>
          sch.busId === busId ? { ...sch, busId: replacementBusId || null } : sch
        ),
      };
    }),

  // ---- Drivers ----
  addDriver: (driver) =>
    set((state) => ({
      drivers: [
        ...state.drivers,
        { id: nextRecordId("DRV", state.drivers), status: "Reserve", assignedBusId: null, ...driver },
      ],
    })),

  updateDriver: (id, patch) =>
    set((state) => ({
      drivers: state.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })),

  deleteDriver: (id) => set((state) => ({
    drivers: state.drivers.filter((driver) => driver.id !== id),
    routes: state.routes.map((route) => route.driverId === id ? { ...route, driverId: null } : route),
    schedules: state.schedules.map((sch) => sch.driverId === id ? { ...sch, driverId: null } : sch),
  })),

  reassignDriver: (routeId, newDriverId) =>
    set((state) => {
      const route = state.routes.find((r) => r.id === routeId);
      const oldDriverId = route?.driverId;
      return {
        routes: state.routes.map((r) => (r.id === routeId ? { ...r, driverId: newDriverId } : r)),
        drivers: state.drivers.map((d) => {
          if (d.id === newDriverId) return { ...d, status: "Active", assignedBusId: route?.busId };
          if (d.id === oldDriverId) return { ...d, status: "Reserve", assignedBusId: null };
          return d;
        }),
      };
    }),

  // ---- Conductors ----
  addConductor: (conductor) =>
    set((state) => ({
      conductors: [
        ...state.conductors,
        { id: nextRecordId("CND", state.conductors), status: "Reserve", assignedBusId: null, ...conductor },
      ],
    })),

  updateConductor: (id, patch) =>
    set((state) => ({
      conductors: state.conductors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  deleteConductor: (id) =>
    set((state) => ({
      conductors: state.conductors.filter((conductor) => conductor.id !== id),
      routes: state.routes.map((route) => route.conductorId === id ? { ...route, conductorId: null } : route),
      schedules: state.schedules.map((sch) => sch.conductorId === id ? { ...sch, conductorId: null } : sch),
    })),

  reassignConductor: (routeId, newConductorId) =>
    set((state) => {
      const route = state.routes.find((r) => r.id === routeId);
      const oldConductorId = route?.conductorId;
      return {
        routes: state.routes.map((r) => (r.id === routeId ? { ...r, conductorId: newConductorId } : r)),
        conductors: state.conductors.map((c) => {
          if (c.id === newConductorId) return { ...c, status: "Active", assignedBusId: route?.busId };
          if (c.id === oldConductorId) return { ...c, status: "Reserve", assignedBusId: null };
          return c;
        }),
      };
    }),

  // ---- Routes ----
  addRoute: (route) =>
    set((state) => {
      const newRoute = { id: nextRecordId("RT", state.routes), ...route };
      return { routes: [...state.routes, newRoute] };
    }),

  updateRoute: (id, patch) =>
    set((state) => {
      const route = state.routes.find((record) => record.id === id);
      if (!route) return {};
      const updatedRoute = { ...route, ...patch };
      const busChanged = Object.hasOwn(patch, "busId") && patch.busId !== route.busId;
      const driverChanged = Object.hasOwn(patch, "driverId") && patch.driverId !== route.driverId;
      const conductorChanged = Object.hasOwn(patch, "conductorId") && patch.conductorId !== route.conductorId;
      const conflictingRoutes = busChanged && patch.busId
        ? state.routes.filter((record) => record.id !== id && record.busId === patch.busId)
        : [];
      const conflictingDriverRoutes = driverChanged && patch.driverId
        ? state.routes.filter((record) => record.id !== id && record.driverId === patch.driverId)
        : [];
      const conflictingConductorRoutes = conductorChanged && patch.conductorId
        ? state.routes.filter((record) => record.id !== id && record.conductorId === patch.conductorId)
        : [];

      return {
        routes: state.routes.map((record) => {
          if (record.id === id) return updatedRoute;
          if (conflictingRoutes.some((conflict) => conflict.id === record.id)) return { ...record, busId: null };
          if (conflictingDriverRoutes.some((conflict) => conflict.id === record.id)) return { ...record, driverId: null };
          if (conflictingConductorRoutes.some((conflict) => conflict.id === record.id)) return { ...record, conductorId: null };
          return record;
        }),
        buses: state.buses.map((bus) => {
          if (busChanged && bus.id === route.busId) {
            return { ...bus, routeId: null, status: bus.status === "Under Maintenance" ? bus.status : "Reserve" };
          }
          if (busChanged && bus.id === patch.busId) {
            return { ...bus, routeId: id, status: bus.status === "Under Maintenance" ? bus.status : "Active" };
          }
          return bus;
        }),
        drivers: state.drivers.map((driver) => {
          if ((driverChanged && driver.id === route.driverId) || conflictingRoutes.some((record) => record.driverId === driver.id)) {
            return { ...driver, status: "Reserve", assignedBusId: null };
          }
          if (conflictingDriverRoutes.some((record) => record.driverId === driver.id)) {
            return { ...driver, status: "Reserve", assignedBusId: null };
          }
          if (driverChanged && driver.id === patch.driverId) {
            return {
              ...driver,
              status: updatedRoute.busId ? "Active" : "Reserve",
              assignedBusId: updatedRoute.busId || null,
            };
          }
          if (busChanged && !driverChanged && driver.id === route.driverId) {
            return {
              ...driver,
              status: updatedRoute.busId ? "Active" : "Reserve",
              assignedBusId: updatedRoute.busId || null,
            };
          }
          return driver;
        }),
        conductors: state.conductors.map((conductor) => {
          if ((conductorChanged && conductor.id === route.conductorId) || conflictingRoutes.some((record) => record.conductorId === conductor.id)) {
            return { ...conductor, status: "Reserve", assignedBusId: null };
          }
          if (conflictingConductorRoutes.some((record) => record.conductorId === conductor.id)) {
            return { ...conductor, status: "Reserve", assignedBusId: null };
          }
          if (conductorChanged && conductor.id === patch.conductorId) {
            return {
              ...conductor,
              status: updatedRoute.busId ? "Active" : "Reserve",
              assignedBusId: updatedRoute.busId || null,
            };
          }
          if (busChanged && !conductorChanged && conductor.id === route.conductorId) {
            return {
              ...conductor,
              status: updatedRoute.busId ? "Active" : "Reserve",
              assignedBusId: updatedRoute.busId || null,
            };
          }
          return conductor;
        }),
      };
    }),

  deleteRoute: (id) =>
    set((state) => {
      const route = state.routes.find((record) => record.id === id);
      return {
        routes: state.routes.filter((record) => record.id !== id),
        schedules: state.schedules.filter((sch) => sch.routeId !== id),
        buses: state.buses.map((bus) => bus.id === route?.busId
          ? { ...bus, routeId: null, status: bus.status === "Under Maintenance" ? bus.status : "Reserve" }
          : bus),
        drivers: state.drivers.map((driver) => driver.id === route?.driverId
          ? { ...driver, status: "Reserve", assignedBusId: null }
          : driver),
        conductors: state.conductors.map((conductor) => conductor.id === route?.conductorId
          ? { ...conductor, status: "Reserve", assignedBusId: null }
          : conductor),
      };
    }),

  // ---- Stops ----
  addStop: (stop) => {
    const name = stop.name.trim();
    if (!name || get().stops.some((record) => record.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: "Stop name is required and must be unique." };
    }
    const record = {
      id: nextRecordId("STOP", get().stops),
      name,
      lat: Number(stop.lat) || CAMPUS_CENTER.lat,
      lng: Number(stop.lng) || CAMPUS_CENTER.lng,
    };
    set((state) => ({ stops: [...state.stops, record] }));
    return { success: true, stop: record };
  },

  updateStop: (id, patch) =>
    set((state) => ({
      stops: state.stops.map((stop) => stop.id === id ? { ...stop, ...patch } : stop),
      routes: state.routes.map((route) => ({
        ...route,
        stops: route.stops.map((stop) => {
          const oldStop = state.stops.find((record) => record.id === id);
          return oldStop && stop.name === oldStop.name ? { ...stop, ...patch } : stop;
        }),
      })),
    })),

  deleteStop: (id) =>
    set((state) => {
      const stop = state.stops.find((record) => record.id === id);
      return {
        stops: state.stops.filter((record) => record.id !== id),
        routes: state.routes.map((route) => ({
          ...route,
          stops: route.stops.filter((item) => item.name !== stop?.name),
        })),
      };
    }),

  addRouteStop: (routeId, stopId, eta = "") => {
    const stop = get().stops.find((record) => record.id === stopId);
    if (!stop) return { success: false, error: "Select an existing stop." };
    const route = get().routes.find((record) => record.id === routeId);
    if (!route) return { success: false, error: "Route not found." };
    if (route.stops.some((record) => record.name === stop.name)) {
      return { success: false, error: "That stop is already on this route." };
    }
    set((state) => ({
      routes: state.routes.map((record) => record.id === routeId
        ? { ...record, stops: [...record.stops, { name: stop.name, lat: stop.lat, lng: stop.lng, eta }] }
        : record),
    }));
    return { success: true };
  },

  updateRouteStop: (routeId, stopName, patch) =>
    set((state) => ({
      routes: state.routes.map((route) => route.id !== routeId ? route : {
        ...route,
        stops: route.stops.map((stop) => stop.name === stopName ? { ...stop, ...patch } : stop),
      }),
    })),

  removeRouteStop: (routeId, stopName) =>
    set((state) => ({
      routes: state.routes.map((route) => route.id === routeId
        ? { ...route, stops: route.stops.filter((stop) => stop.name !== stopName) }
        : route),
    })),

  // ---------------------------------------------------------------------------
  // ---- SCHEDULES (Admin-managed Schedules, Overrides, & Shuttles) ----------
  // ---------------------------------------------------------------------------
  addSchedule: (scheduleData) => {
    const state = get();
    // Validate Bus Conflict
    if (scheduleData.busId) {
      const conflict = state.validateBusConflict(scheduleData.busId, scheduleData);
      if (conflict.hasConflict) {
        return { success: false, error: conflict.message };
      }
    }

    const id = nextRecordId("SCH", state.schedules);
    const newSchedule = {
      id,
      status: "ACTIVE",
      notes: "",
      isOverride: false,
      ...scheduleData,
    };
    set((s) => ({ schedules: [newSchedule, ...s.schedules] }));
    return { success: true, schedule: newSchedule };
  },

  updateSchedule: (id, patch) => {
    const state = get();
    const existing = state.schedules.find((s) => s.id === id);
    if (!existing) return { success: false, error: "Schedule not found." };

    const merged = { ...existing, ...patch };
    // Validate Bus Conflict if bus or time or date changed
    if (merged.busId) {
      const conflict = state.validateBusConflict(merged.busId, merged, id);
      if (conflict.hasConflict) {
        return { success: false, error: conflict.message };
      }
    }

    set((s) => ({
      schedules: s.schedules.map((sch) => (sch.id === id ? merged : sch)),
    }));
    return { success: true, schedule: merged };
  },

  deleteSchedule: (id) => {
    set((state) => ({
      schedules: state.schedules.filter((sch) => sch.id !== id),
    }));
    return { success: true };
  },

  toggleScheduleStatus: (id) => {
    set((state) => ({
      schedules: state.schedules.map((sch) =>
        sch.id === id ? { ...sch, status: sch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : sch
      ),
    }));
  },

  // Bus conflict validation
  validateBusConflict: (busId, candidateSchedule, excludeScheduleId = null) => {
    if (!busId) return { hasConflict: false };
    const state = get();
    const candTime = parseTimeToMinutes(candidateSchedule.departureTime);
    if (candTime === null) return { hasConflict: false };

    const activeSchedulesWithBus = state.schedules.filter((sch) =>
      sch.busId === busId && sch.status === "ACTIVE" && sch.id !== excludeScheduleId
    );

    for (const existing of activeSchedulesWithBus) {
      // Check if dates/recurrence can overlap
      let overlapsDay = false;

      // Case A: Specific dates match
      if (
        (candidateSchedule.recurrence === RECURRENCE_TYPES.SPECIFIC_DATE || candidateSchedule.recurrence === RECURRENCE_TYPES.EVENT) &&
        (existing.recurrence === RECURRENCE_TYPES.SPECIFIC_DATE || existing.recurrence === RECURRENCE_TYPES.EVENT)
      ) {
        if (candidateSchedule.specificDate === existing.specificDate) overlapsDay = true;
      } else if (
        candidateSchedule.recurrence === RECURRENCE_TYPES.WEEKDAYS &&
        existing.recurrence === RECURRENCE_TYPES.WEEKDAYS
      ) {
        overlapsDay = true;
      } else if (
        candidateSchedule.recurrence === RECURRENCE_TYPES.FRIDAY_ONLY &&
        existing.recurrence === RECURRENCE_TYPES.FRIDAY_ONLY
      ) {
        overlapsDay = true;
      } else if (
        candidateSchedule.recurrence === RECURRENCE_TYPES.DAILY ||
        existing.recurrence === RECURRENCE_TYPES.DAILY
      ) {
        overlapsDay = true;
      } else if (
        (candidateSchedule.recurrence === RECURRENCE_TYPES.WEEKDAYS && existing.recurrence === RECURRENCE_TYPES.FRIDAY_ONLY) ||
        (candidateSchedule.recurrence === RECURRENCE_TYPES.FRIDAY_ONLY && existing.recurrence === RECURRENCE_TYPES.WEEKDAYS)
      ) {
        overlapsDay = true; // Friday overlaps with weekdays
      } else if (
        candidateSchedule.specificDate &&
        (existing.recurrence === RECURRENCE_TYPES.WEEKDAYS || existing.recurrence === RECURRENCE_TYPES.DAILY || existing.recurrence === RECURRENCE_TYPES.FRIDAY_ONLY)
      ) {
        // Test if specific date falls on existing recurrence day
        overlapsDay = isScheduleApplicableOnDate(existing, candidateSchedule.specificDate);
      } else if (
        existing.specificDate &&
        (candidateSchedule.recurrence === RECURRENCE_TYPES.WEEKDAYS || candidateSchedule.recurrence === RECURRENCE_TYPES.DAILY || candidateSchedule.recurrence === RECURRENCE_TYPES.FRIDAY_ONLY)
      ) {
        overlapsDay = isScheduleApplicableOnDate(candidateSchedule, existing.specificDate);
      }

      if (overlapsDay) {
        const existTime = parseTimeToMinutes(existing.departureTime);
        if (existTime !== null) {
          const diff = Math.abs(candTime - existTime);
          // Conflict if within 45 minutes of each other
          if (diff < 45) {
            const bus = state.buses.find((b) => b.id === busId);
            const route = state.routes.find((r) => r.id === existing.routeId);
            return {
              hasConflict: true,
              message: `Bus conflict: Bus ${bus?.plate || busId} is already scheduled on ${route?.shortName || existing.routeId} at ${existing.departureTime} (${existing.serviceType.replace("_", " ")}). Choose another bus or adjust time.`,
              conflictingSchedule: existing,
            };
          }
        }
      }
    }

    return { hasConflict: false };
  },

  // Retrieve applicable schedules for a date (and optional route filter)
  getSchedulesForDate: (dateStr, routeId = null) => {
    const schedules = get().schedules || [];
    return schedules.filter((sch) => {
      if (routeId && sch.routeId !== routeId) return false;
      return isScheduleApplicableOnDate(sch, dateStr);
    });
  },

  // ---- Selectors ----
  getRoute: (id) => get().routes.find((r) => r.id === id),
  getBus: (id) => get().buses.find((b) => b.id === id),
  getDriver: (id) => get().drivers.find((d) => d.id === id),
  getConductor: (id) => get().conductors.find((c) => c.id === id),
  getReserveDrivers: () => get().drivers.filter((d) => d.status !== "Active"),
  getReserveConductors: () => get().conductors.filter((c) => c.status !== "Active"),
  getReserveBuses: () => get().buses.filter((b) => b.status === "Reserve"),
}), {
  name: "smartu-fleet",
  merge: (persistedState, currentState) => ({
    ...currentState,
    ...persistedState,
    stops: persistedState?.stops || currentState.stops,
    routes: persistedState?.routes || currentState.routes,
    schedules: persistedState?.schedules || currentState.schedules,
  }),
}));

syncPersistedStore(useFleetStore, "smartu-fleet");
