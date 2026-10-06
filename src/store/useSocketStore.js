import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncPersistedStore } from "@/lib/storeSync";

// Simulates a Socket.IO connection: broadcasts events (announcements, driver
// status changes, reassignments) that any subscribed portal can react to.
export const useSocketStore = create(persist((set, get) => ({
  connected: true,
  notifications: [{
    id: "EVT-DEMO-VIOLATION",
    type: "violation-reported",
    payload: {
      message: "A seeded hostelite violation report is available for Admin review.",
      audienceLabel: "Violations",
      audienceRole: "ADMIN",
    },
    timestamp: new Date().toISOString(),
    read: false,
  }],

  triggerEvent: (type, payload) => {
    const notification = {
      id: `EVT-${Math.random().toString(36).slice(2, 9)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({ notifications: [notification, ...state.notifications].slice(0, 50) }));
    return notification;
  },

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  markNotificationsReadFor: (studentId) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.payload?.studentId === studentId
          ? { ...notification, read: true }
          : notification
      ),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  setConnected: (connected) => set({ connected }),
}), {
  name: "smartu-notifications",
  partialize: (state) => ({
    connected: state.connected,
    notifications: state.notifications,
  }),
}));

syncPersistedStore(useSocketStore, "smartu-notifications");
