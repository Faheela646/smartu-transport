import { create } from "zustand";
import { FINES } from "@/data/mockData";

export const useFineStore = create((set, get) => ({
  fines: FINES,

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
}));
