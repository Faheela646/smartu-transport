import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STUDENTS, MOCK_ACCOUNTS, generateStudentEmail, generateStudentPassword } from "@/data/mockData";

export const useStudentStore = create(
  persist(
    (set, get) => ({
      students: STUDENTS,

      addStudent: ({ name, rollNo, role, routeId, email: suppliedEmail, contactEmail, password: suppliedPassword, phone, staffId, pickupStop, semester, feeStatus }) => {
        const formattedRollNo = rollNo.trim().toUpperCase();
        const email = suppliedEmail || generateStudentEmail(formattedRollNo);
        const password = suppliedPassword || generateStudentPassword(formattedRollNo);

        const student = {
          id: `STU-${String(get().students.length + 1).padStart(3, "0")}`,
          name,
          rollNo: formattedRollNo,
          email,
          contactEmail,
          password,
          role,
          routeId,
          phone,
          staffId,
          pickupStop,
          semester,
          cnic: "—",
          feeStatus: feeStatus || "Pending",
        };
        set((state) => ({ students: [...state.students, student] }));
        // Provision the login account with email, roll number, and password
        MOCK_ACCOUNTS.push({
          loginId: formattedRollNo,
          rollNo: formattedRollNo,
          email,
          password,
          role,
          name,
          refId: student.id,
        });
        return { student, email, password };
      },

      updateStudent: (id, patch) =>
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),

      updateStudentPassword: (rollNo, newPassword) =>
        set((state) => ({
          students: state.students.map((s) => 
            s.rollNo === rollNo ? { ...s, password: newPassword } : s
          ),
        })),

      deleteStudent: (id) => set((state) => ({ students: state.students.filter((s) => s.id !== id) })),

      approveFeeChallan: (id) =>
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, feeStatus: "Paid" } : s)),
        })),
    }),
    {
      name: "smartu-students",
    }
  )
);
