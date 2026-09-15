import { create } from "zustand";
import { BUSES, DRIVERS, CONDUCTORS, ROUTES } from "@/data/mockData";

export const useFleetStore = create((set, get) => ({
  buses: BUSES,
  drivers: DRIVERS,
  conductors: CONDUCTORS,
  routes: ROUTES,

  // ---- Buses ----
  addBus: (bus) =>
    set((state) => ({
      buses: [
        ...state.buses,
        { id: `BUS-${100 + state.buses.length + 1}`, status: "Reserve", routeId: null, ...bus },
      ],
    })),

  updateBus: (id, patch) =>
    set((state) => ({
      buses: state.buses.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),

  deleteBus: (id) => set((state) => ({ buses: state.buses.filter((b) => b.id !== id) })),

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
        { id: `DRV-${String(state.drivers.length + 1).padStart(2, "0")}`, status: "Reserve", assignedBusId: null, ...driver },
      ],
    })),

  updateDriver: (id, patch) =>
    set((state) => ({
      drivers: state.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })),

  deleteDriver: (id) => set((state) => ({ drivers: state.drivers.filter((d) => d.id !== id) })),

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
        { id: `CND-${String(state.conductors.length + 1).padStart(2, "0")}`, status: "Reserve", assignedBusId: null, ...conductor },
      ],
    })),

  updateConductor: (id, patch) =>
    set((state) => ({
      conductors: state.conductors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  deleteConductor: (id) =>
    set((state) => ({ conductors: state.conductors.filter((c) => c.id !== id) })),

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
      routes: [...state.routes, { id: `RT-${String(state.routes.length + 1).padStart(2, "0")}`, ...route }],
    })),

  updateRoute: (id, patch) =>
    set((state) => ({
      routes: state.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  deleteRoute: (id) => set((state) => ({ routes: state.routes.filter((r) => r.id !== id) })),

  // ---- Selectors ----
  getRoute: (id) => get().routes.find((r) => r.id === id),
  getBus: (id) => get().buses.find((b) => b.id === id),
  getDriver: (id) => get().drivers.find((d) => d.id === id),
  getConductor: (id) => get().conductors.find((c) => c.id === id),
  getReserveDrivers: () => get().drivers.filter((d) => d.status !== "Active"),
  getReserveConductors: () => get().conductors.filter((c) => c.status !== "Active"),
  getReserveBuses: () => get().buses.filter((b) => b.status === "Reserve"),
}));
