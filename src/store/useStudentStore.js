import { create } from "zustand";
import { STUDENTS, MOCK_ACCOUNTS } from "@/data/mockData";

function generateTempPassword() {
  return Math.random().toString(36).slice(2, 6) + Math.floor(Math.random() * 90 + 10);
}

export const useStudentStore = create((set, get) => ({
  students: STUDENTS,

  addStudent: ({ name, rollNo, role, routeId }) => {
    const tempPassword = generateTempPassword();
    const student = {
      id: `STU-${String(get().students.length + 1).padStart(3, "0")}`,
      name,
      rollNo,
      role,
      routeId,
      cnic: "—",
      feeStatus: "Pending",
    };
    set((state) => ({ students: [...state.students, student] }));
    // Provision the login account (mock — normally hashed server-side).
    MOCK_ACCOUNTS.push({ loginId: rollNo, password: tempPassword, role, name, refId: student.id });
    return { student, tempPassword };
  },

  updateStudent: (id, patch) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),

  deleteStudent: (id) => set((state) => ({ students: state.students.filter((s) => s.id !== id) })),

  approveFeeChallan: (id) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, feeStatus: "Paid" } : s)),
    })),
}));
