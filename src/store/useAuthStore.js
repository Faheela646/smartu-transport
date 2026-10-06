import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findAccount } from "@/data/mockData";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";

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
        const normalizedId = loginId.trim().toLowerCase();
        let account = null;
        const student = useStudentStore.getState().students.find((record) =>
            [record.rollNo, record.email, record.staffId].some((value) => value?.toLowerCase() === normalizedId)
            && record.password === password
        );

        if (student) {
          account = {
            loginId: student.rollNo,
            rollNo: student.rollNo,
            email: student.email,
            password: student.password,
            role: student.role,
            userType: student.userType,
            accountStatus: student.accountStatus,
            seatNo: student.seatNo,
            name: student.name,
            refId: student.id,
          };
        }
        if (!account) {
          const { drivers, conductors } = useFleetStore.getState();
          const staff = [...drivers, ...conductors].find((record) =>
            record.loginId?.toLowerCase() === normalizedId && record.password === password
          );
          if (staff) {
            account = {
              loginId: staff.loginId,
              role: conductors.some((record) => record.id === staff.id) ? "CONDUCTOR" : "DRIVER",
              name: staff.name,
              refId: staff.id,
            };
          }
        }
        if (!account) account = findAccount(loginId, password);
        if (!account) {
          return { success: false, error: "Incorrect login ID or password." };
        }
        const token = `mock-jwt-${account.refId}-${Date.now()}`;
        const user = {
          id: account.refId,
          name: account.name,
          role: account.role,
          loginId: account.loginId,
          rollNo: account.rollNo || (/^(DAY_SCHOLAR|HOSTELITE|FACULTY)$/.test(account.role) ? account.loginId : undefined),
          email: account.email,
          userType: account.userType,
          accountStatus: account.accountStatus,
          seatNo: account.seatNo ?? null,
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
