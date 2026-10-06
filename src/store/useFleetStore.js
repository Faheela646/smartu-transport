import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BUSES, DRIVERS, CONDUCTORS, ROUTES, CAMPUS_CENTER } from "@/data/mockData";

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

export const useFleetStore = create(persist((set, get) => ({
  buses: BUSES,
  drivers: DRIVERS,
  conductors: CONDUCTORS,
  routes: ROUTES,
  stops: INITIAL_STOPS,

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
    drivers: state.drivers.map((driver) =>
      driver.assignedBusId === id ? { ...driver, status: "Reserve", assignedBusId: null } : driver
    ),
    conductors: state.conductors.map((conductor) =>
      conductor.assignedBusId === id ? { ...conductor, status: "Reserve", assignedBusId: null } : conductor
    ),
  })),

  // Sets a bus to maintenance and swaps its route to a replacement bus atomically.
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
    set((state) => ({
      routes: [...state.routes, { id: nextRecordId("RT", state.routes), ...route }],
    })),

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
  merge: (persistedState, currentState) => ({ ...currentState, ...persistedState, stops: persistedState?.stops || currentState.stops }),
}));
