import { create } from "zustand";
import { ROUTES } from "@/data/mockData";

// Give every route a starting progress somewhere along its path so the demo
// doesn't always show buses sitting at the first stop.
const initialProgress = Object.fromEntries(
  ROUTES.map((r, i) => [r.id, 0.15 + ((i * 0.17) % 0.6)])
);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Given a route's stop list and a 0..1 progress along the whole path, return
// the interpolated lat/lng plus which leg (segment) the bus is currently on.
function positionAlongStops(stops, progress) {
  const segments = stops.length - 1;
  if (segments <= 0) return { lat: stops[0].lat, lng: stops[0].lng, segmentIndex: 0, segmentT: 0 };
  const scaled = Math.min(progress, 0.9999) * segments;
  const segmentIndex = Math.floor(scaled);
  const segmentT = scaled - segmentIndex;
  const from = stops[segmentIndex];
  const to = stops[segmentIndex + 1];
  return {
    lat: lerp(from.lat, to.lat, segmentT),
    lng: lerp(from.lng, to.lng, segmentT),
    segmentIndex,
    segmentT,
  };
}

export const useMapStore = create((set, get) => ({
  progress: initialProgress,
  intervalId: null,

  getBusPosition: (routeId) => {
    const route = ROUTES.find((r) => r.id === routeId);
    if (!route) return null;
    const p = get().progress[routeId] ?? 0.1;
    const pos = positionAlongStops(route.stops, p);
    return { ...pos, routeId };
  },

  getNextStop: (routeId) => {
    const route = ROUTES.find((r) => r.id === routeId);
    if (!route) return null;
    const p = get().progress[routeId] ?? 0.1;
    const pos = positionAlongStops(route.stops, p);
    const idx = Math.min(pos.segmentIndex + 1, route.stops.length - 1);
    return route.stops[idx];
  },

  getEtaMinutes: (routeId) => {
    const route = ROUTES.find((r) => r.id === routeId);
    if (!route) return null;
    const p = get().progress[routeId] ?? 0.1;
    const remaining = Math.max(0, 1 - p);
    // Whole route takes ~50 minutes end-to-end in this simulation.
    return Math.max(1, Math.round(remaining * 50));
  },

  // Advances every route's bus a small random step forward (looping back to
  // the start once it reaches the final stop) — simulates a Socket.IO GPS feed.
  tick: () =>
    set((state) => {
      const next = { ...state.progress };
      for (const routeId of Object.keys(next)) {
        const step = 0.008 + Math.random() * 0.01;
        next[routeId] = (next[routeId] + step) % 1;
      }
      return { progress: next };
    }),

  startSimulation: () => {
    if (get().intervalId) return;
    const id = setInterval(() => get().tick(), 3000);
    set({ intervalId: id });
  },

  stopSimulation: () => {
    const id = get().intervalId;
    if (id) clearInterval(id);
    set({ intervalId: null });
  },
}));
