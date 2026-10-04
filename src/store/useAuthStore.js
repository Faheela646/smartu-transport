import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findAccount, ROLL_NO_REGEX } from "@/data/mockData";

function validateLoginId(loginId) {
  const trimmed = loginId ? loginId.trim() : "";
  if (!trimmed) return { ok: false, kind: null };
  return { ok: true, kind: "valid" };
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (loginId, password) => {
        const format = validateLoginId(loginId);
        if (!format.ok) {
          return {
            success: false,
            error:
              "Enter a valid Roll Number (e.g. 22F-3284), Email (e.g. f223284@cfd.nu.edu.pk), or staff ID.",
          };
        }
        const account = findAccount(loginId, password);
        if (!account) {
          return { success: false, error: "Incorrect login ID or password." };
        }
        const token = `mock-jwt-${account.refId}-${Date.now()}`;
        const user = {
          id: account.refId,
          name: account.name,
          role: account.role,
          loginId: account.loginId,
          rollNo: account.rollNo || (/^(DAY_SCHOLAR|HOSTELITE)$/.test(account.role) ? account.loginId : undefined),
          email: account.email,
          token,
        };
        set({ user, isAuthenticated: true });
        return { success: true, user };
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      changePassword: () => {
        // Mock only — in a real backend this would hash + persist server-side.
        return { success: true };
      },
    }),
    {
      name: "smartu-auth",
    }
  )
);
