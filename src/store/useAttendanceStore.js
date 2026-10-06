import { create } from "zustand";
import { persist } from "zustand/middleware";

export const INITIAL_ATTENDANCE_HISTORY = [
  { id: "ATT-101", date: "2026-09-15", routeId: "RT-01", busId: "BUS-101", time: "07:42 AM", stop: "Kohinoor Chowk", method: "QR Scan", status: "Present" },
  { id: "ATT-102", date: "2026-09-14", routeId: "RT-01", busId: "BUS-101", time: "07:39 AM", stop: "Kohinoor Chowk", method: "QR Scan", status: "Present" },
  { id: "ATT-103", date: "2026-09-13", routeId: "RT-01", busId: "BUS-101", time: "07:45 AM", stop: "Kohinoor Chowk", method: "RFID", status: "Present" },
  { id: "ATT-104", date: "2026-09-12", routeId: "RT-01", busId: "BUS-101", time: "07:40 AM", stop: "Kohinoor Chowk", method: "QR Scan", status: "Present" },
  { id: "ATT-105", date: "2026-09-10", routeId: "RT-01", busId: "BUS-101", time: "07:41 AM", stop: "Kohinoor Chowk", method: "QR Scan", status: "Present" },
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

  markAttendance: ({ rollNo, routeId, busId, stop, method = "QR Scan" }) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toISOString().slice(0, 10);
    const existingRecord = get().attendanceHistory.find(
      (record) => record.rollNo === rollNo && record.date === dateStr
    );
    if (existingRecord) return existingRecord;

    const newRecord = {
      id: `ATT-${Date.now()}`,
      rollNo,
      date: dateStr,
      routeId,
      busId,
      time: timeStr,
      stop: stop || "Main Gate",
      method,
      status: "Present",
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
}), { name: "smartu-attendance" })
);
