import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTransportWorkflowStore = create(
  persist(
    (set, get) => ({
      feeSchedule: { FEE_DAY_SCHOLAR: 38500, FEE_DAY_SCHOLAR_LATE: 43500, FEE_FACULTY: null },
      semesterPayments: [],
      tickets: [],
      violations: [],
      fineSchedule: { FINE_1ST: 500, FINE_2ND: 1000, FINE_3RD: 2000 },

      updateFeeSchedule: (patch) =>
        set((state) => ({ feeSchedule: { ...state.feeSchedule, ...patch } })),

      updateFineSchedule: (patch) =>
        set((state) => ({ fineSchedule: { ...state.fineSchedule, ...patch } })),

      submitSemesterPayment: (application) => {
        const feeKey = application.userType === "faculty"
          ? "FEE_FACULTY"
          : application.lateFee ? "FEE_DAY_SCHOLAR_LATE" : "FEE_DAY_SCHOLAR";
        const record = {
          ...application,
          id: `SEM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          amount: get().feeSchedule[feeKey],
          status: "Pending",
          submittedAt: new Date().toISOString(),
        };
        set((state) => ({ semesterPayments: [record, ...state.semesterPayments] }));
        return record;
      },

      updateSemesterPayment: (id, status, reviewNote = "") =>
        set((state) => ({
          semesterPayments: state.semesterPayments.map((payment) =>
            payment.id === id ? { ...payment, status, reviewNote, reviewedAt: new Date().toISOString() } : payment
          ),
        })),

      requestTicket: (request) => {
        const record = {
          ...request,
          id: `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          status: "Pending",
          requestedAt: new Date().toISOString(),
        };
        set((state) => ({ tickets: [record, ...state.tickets] }));
        return record;
      },

      updateTicketStatus: (id, status) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? { ...ticket, status, ...(status === "Active" ? { qrToken: crypto.randomUUID() } : {}) }
              : ticket
          ),
        })),

      redeemTicket: (qrToken, routeId) => {
        const ticket = get().tickets.find((item) => item.qrToken === qrToken);
        if (!ticket || !["Active", "HalfRedeemed"].includes(ticket.status)) {
          return { success: false, error: "Invalid or already redeemed ticket." };
        }
        if (ticket.routeId !== routeId) return { success: false, error: "Ticket is for another route." };
        const nextStatus = ticket.ticketType === "OneWay" || ticket.status === "HalfRedeemed"
          ? "Redeemed"
          : "HalfRedeemed";
        set((state) => ({
          tickets: state.tickets.map((item) =>
            item.id === ticket.id
              ? {
                  ...item,
                  status: nextStatus,
                  scans: [...(item.scans || []), new Date().toISOString()],
                }
              : item
          ),
        }));
        return { success: true, ticket: { ...ticket, status: nextStatus } };
      },

      fileViolation: ({ userIds = [], unregisteredNote = "", ...data }) => {
        const existing = get().violations;
        const targetedIds = [...new Set(userIds)];
        const finesByUser = targetedIds.map((userId) => {
          const strike = existing.filter((violation) => violation.userIds?.includes(userId)).length + 1;
          const fineKey = strike >= 3 ? "FINE_3RD" : strike === 2 ? "FINE_2ND" : "FINE_1ST";
          return { userId, strike, fine: get().fineSchedule[fineKey], fineKey, paymentStatus: "Unpaid" };
        });
        const record = {
          ...data,
          id: `VIO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          userIds: targetedIds,
          unregisteredNote: unregisteredNote.trim(),
          users: finesByUser,
          status: "Pending",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ violations: [record, ...state.violations] }));
        return record;
      },

      submitFinePayment: (violationId, userId, evidence) =>
        set((state) => ({
          violations: state.violations.map((violation) =>
            violation.id === violationId
              ? {
                  ...violation,
                  users: violation.users.map((user) =>
                    user.userId === userId
                      ? { ...user, paymentStatus: "Pending Verification", paymentEvidence: evidence }
                      : user
                  ),
                }
              : violation
          ),
        })),

      resolveViolationForUser: (violationId, userId) =>
        set((state) => ({
          violations: state.violations.map((violation) => {
            if (violation.id !== violationId) return violation;
            const users = violation.users.map((user) =>
              user.userId === userId ? { ...user, paymentStatus: "Resolved" } : user
            );
            return {
              ...violation,
              users,
              status: users.every((user) => user.paymentStatus === "Resolved") ? "Resolved" : violation.status,
            };
          }),
        })),

      attachViolationUser: (violationId, userId) =>
        set((state) => ({
          violations: state.violations.map((violation) =>
            violation.id === violationId && !violation.userIds.includes(userId)
              ? (() => {
                  const strike = state.violations.filter((item) => item.userIds.includes(userId)).length + 1;
                  const fineKey = strike >= 3 ? "FINE_3RD" : strike === 2 ? "FINE_2ND" : "FINE_1ST";
                  return {
                    ...violation,
                    userIds: [...violation.userIds, userId],
                    users: [...violation.users, {
                      userId,
                      strike,
                      fine: get().fineSchedule[fineKey],
                      fineKey,
                      paymentStatus: "Unpaid",
                    }],
                  };
                })()
              : violation
          ),
        })),
    }),
    { name: "smartu-transport-workflows" }
  )
);
