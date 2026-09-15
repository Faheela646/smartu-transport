import { create } from "zustand";

export const INITIAL_ISSUES = [
  {
    id: "ISS-901",
    category: "Bus Delay",
    routeId: "RT-01",
    busId: "BUS-101",
    description: "Morning shuttle arrived 12 minutes late at Kohinoor Chowk stop due to severe traffic.",
    status: "Resolved",
    date: "2026-09-11T08:15:00",
    resolutionNote: "Driver notified office; traffic delay verified.",
  },
];

export const useIssueStore = create((set) => ({
  issues: INITIAL_ISSUES,

  submitIssue: ({ category, routeId, busId, description, image }) => {
    const newIssue = {
      id: `ISS-${Math.floor(100 + Math.random() * 900)}`,
      category,
      routeId,
      busId,
      description,
      image: image || null,
      status: "Pending Investigation",
      date: new Date().toISOString(),
      resolutionNote: null,
    };

    set((state) => ({ issues: [newIssue, ...state.issues] }));
    return newIssue;
  },
}));
