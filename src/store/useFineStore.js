import { create } from "zustand";
import { FINES } from "@/data/mockData";

// Determine the current semester label and date range automatically
function detectCurrentSemester() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-based
  const year = now.getFullYear();
  if (month >= 8 || month === 1) {
    // Aug-Jan → Fall semester
    const startYear = month >= 8 ? year : year - 1;
    return {
      label: `Fall ${startYear}`,
      type: "FALL",
      startDate: `${startYear}-08-01`,
      endDate: `${startYear + 1}-01-31`,
    };
  } else {
    // Feb-Jul → Spring semester
    return {
      label: `Spring ${year}`,
      type: "SPRING",
      startDate: `${year}-02-01`,
      endDate: `${year}-06-30`,
    };
  }
}

export const useFineStore = create((set, get) => ({
  fines: FINES,

  // ── Semester Challans ────────────────────────────────────────────────────
  // Each entry: { id, semester, type, amount, startDate, endDate, dueDate, note, generatedAt, studentCount }
  semesterChallans: [],

  activeChallan: () => get().semesterChallans[0] ?? null,

  addSemesterChallan: (challan) =>
    set((state) => ({
      semesterChallans: [
        { id: `CHL-${Date.now()}`, generatedAt: new Date().toISOString(), ...challan },
        ...state.semesterChallans,
      ],
    })),

  // ── Fine helpers ─────────────────────────────────────────────────────────
  finesForStudent: (rollNo) => get().fines.filter((f) => f.rollNo === rollNo),

  clearFine: (id) =>
    set((state) => ({
      fines: state.fines.map((f) => (f.id === id ? { ...f, status: "Cleared" } : f)),
    })),

  submitChallan: (id, fileName) =>
    set((state) => ({
      fines: state.fines.map((f) =>
        f.id === id ? { ...f, status: "Pending Approval", challanFile: fileName } : f
      ),
    })),

  approveChallan: (id) =>
    set((state) => ({
      fines: state.fines.map((f) => (f.id === id ? { ...f, status: "Cleared" } : f)),
    })),

  addFine: (fine) =>
    set((state) => ({
      fines: [
        ...state.fines,
        { id: `FIN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, status: "Unpaid", ...fine },
      ],
    })),

  detectCurrentSemester,
}));
