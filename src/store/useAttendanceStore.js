import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncPersistedStore } from "@/lib/storeSync";

export const INITIAL_ATTENDANCE_HISTORY = [
  { id: "ATT-101", userId: "STU-001", rollNo: "22F-3082", adate: "2026-09-15", date: "2026-09-15", routeId: "RT-01", busId: "BUS-101", time: "07:42 AM", stop: "Kohinoor Chowk", method: "QR Scan" },
  { id: "ATT-102", userId: "STU-002", rollNo: "22F-3091", adate: "2026-09-14", date: "2026-09-14", routeId: "RT-02", busId: "BUS-102", time: "07:39 AM", stop: "Millat Town", method: "QR Scan" },
  { id: "ATT-103", userId: "STU-003", rollNo: "21F-2871", adate: "2026-09-13", date: "2026-09-13", routeId: "RT-03", busId: "BUS-103", time: "07:45 AM", stop: "Jail Road", method: "RFID" },
  { id: "ATT-104", userId: "STU-005", rollNo: "22K-1187", adate: "2026-09-12", date: "2026-09-12", routeId: "RT-01", busId: "BUS-101", time: "07:40 AM", stop: "Susan Road", method: "QR Scan" },
  { id: "ATT-105", userId: "STU-006", rollNo: "21I-0965", adate: "2026-09-10", date: "2026-09-10", routeId: "RT-02", busId: "BUS-102", time: "07:41 AM", stop: "Gulistan Colony", method: "QR Scan" },
];

export const useAttendanceStore = create(
  persist((set, get) => ({
  attendanceHistory: INITIAL_ATTENDANCE_HISTORY,
  rfidCard: {
    cardNumber: "RFID-8812-9041",
    status: "Active",
    issuedDate: "2025-09-01",
    lastScanned: "2026-09-13 07:45 AM",
  },
  todayAttendance: {
    marked: true,
    time: "07:42 AM",
    busId: "BUS-101",
    routeId: "RT-01",
    stop: "Kohinoor Chowk",
    method: "QR Scan",
  },

  markAttendance: ({ userId, rollNo, routeId, busId, stop, method = "QR Scan" }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toISOString().slice(0, 10);
    const existingRecord = get().attendanceHistory.find(
      (record) => (record.userId === userId || record.rollNo === rollNo) && (record.adate || record.date) === dateStr
    );

    syncPersistedStore(useAttendanceStore, "smartu-attendance");
    if (existingRecord) return existingRecord;

    const newRecord = {
      id: `ATT-${Date.now()}`,
      userId,
      rollNo,
      adate: dateStr,
      date: dateStr,
      routeId,
      busId,
      time: timeStr,
      stop: stop || "Main Gate",
      method,
    };

    set((state) => ({
      todayAttendance: {
        marked: true,
        time: timeStr,
        busId,
        routeId,
        stop: stop || "Main Gate",
        method,
      },
      attendanceHistory: [newRecord, ...state.attendanceHistory],
    }));

    return newRecord;
  },

  resetTodayAttendance: () => {
    set({
      todayAttendance: {
        marked: false,
        time: null,
        busId: null,
        routeId: null,
        stop: null,
        method: null,
      },
    });
  },
}), {
  name: "smartu-attendance",
  merge: (persistedState, currentState) => ({
    ...currentState,
    ...persistedState,
    attendanceHistory: (persistedState?.attendanceHistory || currentState.attendanceHistory).map((record) => {
      const { status: _status, ...presence } = record;
      return { ...presence, adate: presence.adate || presence.date };
    }),
  }),
})
);
