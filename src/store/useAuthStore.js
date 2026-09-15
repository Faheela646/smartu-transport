import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findAccount, ROLL_NO_REGEX } from "@/data/mockData";

function validateLoginId(loginId) {
  const trimmed = loginId.trim();
  if (ROLL_NO_REGEX.test(trimmed)) return { ok: true, kind: "roll" };
  if (/^[a-zA-Z][a-zA-Z0-9_]{2,}$/.test(trimmed)) return { ok: true, kind: "staff" };
  return { ok: false, kind: null };
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
              "Enter a valid Roll Number (e.g. 22F-1111) or staff login ID (e.g. admin, driver_1).",
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
          rollNo: /^(DAY_SCHOLAR|HOSTELITE)$/.test(account.role) ? account.loginId : undefined,
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
