import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRegistrationStore = create(
  persist(
    (set) => ({
      applications: [],

      submitApplication: (application) => {
        const record = {
          ...application,
          id: `APP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          status: "Pending",
          submittedAt: new Date().toISOString(),
        };
        set((state) => ({ applications: [record, ...state.applications] }));
        return record;
      },

      updateApplicationStatus: (id, status) =>
        set((state) => ({
          applications: state.applications.map((application) =>
            application.id === id ? { ...application, status } : application
          ),
        })),
    }),
    { name: "smartu-registration-applications" }
  )
);
