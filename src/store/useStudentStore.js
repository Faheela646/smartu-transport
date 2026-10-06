import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STUDENTS, MOCK_ACCOUNTS, generateStudentEmail, generateStudentPassword } from "@/data/mockData";

export const useStudentStore = create(
  persist(
    (set, get) => ({
      students: STUDENTS.map((student) => ({
        ...student,
        userType: student.userType || "student",
        accountStatus: student.accountStatus || "Approved",
        seatNo: student.seatNo ?? null,
      })),

      addStudent: ({ name, rollNo, role, routeId, email: suppliedEmail, contactEmail, password: suppliedPassword, phone, staffId, pickupStop, semester, feeStatus, userType, accountStatus = "N/A", seatNo = null }) => {
        const formattedRollNo = rollNo.trim().toUpperCase();
        const email = suppliedEmail || generateStudentEmail(formattedRollNo);
        const password = suppliedPassword || generateStudentPassword(formattedRollNo);

        const student = {
          id: `USR-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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
          userType: userType || (role === "FACULTY" ? "faculty" : "student"),
          accountStatus,
          seatNo,
          cnic: "—",
          feeStatus: feeStatus || "Pending",
        };
        set((state) => ({ students: [...state.students, student] }));
        MOCK_ACCOUNTS.push({
          loginId: formattedRollNo,
          rollNo: formattedRollNo,
          email,
          password,
          role,
          userType: student.userType,
          accountStatus: student.accountStatus,
          seatNo: student.seatNo,
          name,
          refId: student.id,
        });
        return { student, email, password };
      },

      bulkCreateStudents: (records) => records.map((record) => get().addStudent(record)),

      updateAccountStatus: (id, accountStatus) =>
        set((state) => ({
          students: state.students.map((student) =>
            student.id === id ? { ...student, accountStatus } : student
          ),
        })),

      approveSemester: (id, { seatNo, routeId, pickupStop, semester }) =>
        set((state) => ({
          students: state.students.map((student) =>
            student.id === id
              ? {
                  ...student,
                  accountStatus: "Approved",
                  seatNo,
                  routeId,
                  pickupStop,
                  semester,
                  feeStatus: "Paid",
                }
              : student
          ),
        })),

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

      deleteStudent: (id) => set((state) => {
        const student = state.students.find((record) => record.id === id);
        if (student) {
          const accountIndex = MOCK_ACCOUNTS.findIndex((account) => account.refId === id);
          if (accountIndex !== -1) MOCK_ACCOUNTS.splice(accountIndex, 1);
        }
        return { students: state.students.filter((s) => s.id !== id) };
      }),

      approveFeeChallan: (id) =>
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, feeStatus: "Paid" } : s)),
        })),
    }),
    {
      name: "smartu-students",
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        students: (persistedState?.students || currentState.students).map((student) => ({
          ...student,
          userType: student.userType || (student.role === "FACULTY" ? "faculty" : "student"),
          accountStatus: student.accountStatus || "Approved",
          seatNo: student.seatNo ?? null,
        })),
      }),
    }
  )
);
