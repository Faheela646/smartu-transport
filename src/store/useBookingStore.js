import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncPersistedStore } from "@/lib/storeSync";
import { ROUTES, BUSES } from "@/data/mockData";

// Seed a handful of existing reservations so the seat counter starts non-empty.
const seedBookings = [
  { id: "BKG-001", rollNo: "22F-3091", routeId: "RT-02", date: todayISO(), fareType: "FULL" },
  { id: "BKG-002", rollNo: "23F-4410", routeId: "RT-04", date: todayISO(), fareType: "FULL" },
  { id: "BKG-003", rollNo: "21I-0965", routeId: "RT-02", date: todayISO(), fareType: "HALF" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function capacityFor(routeId) {
  const route = ROUTES.find((r) => r.id === routeId);
  const bus = BUSES.find((b) => b.id === route?.busId);
  return bus?.capacity ?? 50;
}

export const useBookingStore = create(persist((set, get) => ({
  bookings: seedBookings,

  capacityFor,

  seatsBookedFor: (routeId, date) =>
    get().bookings.filter((b) => b.routeId === routeId && b.date === date && b.fareType === "FULL")
      .length,

  seatsAvailableFor: (routeId, date) => {
    const cap = capacityFor(routeId);
    return Math.max(0, cap - get().seatsBookedFor(routeId, date));
  },

  bookingsForStudent: (rollNo) => get().bookings.filter((b) => b.rollNo === rollNo),

  createBooking: ({ rollNo, routeId, date, fareType }) => {
    if (fareType === "FULL" && get().seatsAvailableFor(routeId, date) <= 0) {
      return { success: false, error: "No reserved seats left for this trip. Try Half Fare (Standing)." };
    }
    const booking = {
      id: `BKG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      rollNo,
      routeId,
      date,
      fareType,
    };
    set((state) => ({ bookings: [...state.bookings, booking] }));
    return { success: true, booking };
  },

  cancelBooking: (id) =>
    set((state) => ({ bookings: state.bookings.filter((b) => b.id !== id) })),
}), { name: "smartu-bookings" }));

syncPersistedStore(useBookingStore, "smartu-bookings");
