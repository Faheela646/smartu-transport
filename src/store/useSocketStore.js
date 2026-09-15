import { create } from "zustand";

// Simulates a Socket.IO connection: broadcasts events (announcements, driver
// status changes, reassignments) that any subscribed portal can react to.
export const useSocketStore = create((set, get) => ({
  connected: true,
  notifications: [],

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

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  setConnected: (connected) => set({ connected }),
}));
