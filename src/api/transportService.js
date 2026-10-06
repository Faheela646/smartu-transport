import axios from "axios";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { useFleetStore, isScheduleApplicableOnDate } from "@/store/useFleetStore";
import { useSocketStore } from "@/store/useSocketStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
});
export const isMockMode = import.meta.env.VITE_USE_MOCK !== "false";

function listFrom(response, property) {
  const data = response.data;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[property]) ? data[property] : [];
}

function mergeById(existing, incoming) {
  const incomingIds = new Set(incoming.map((item) => item.id));
  return [...incoming, ...existing.filter((item) => !incomingIds.has(item.id))];
}

export const transportService = {
  listTrips: (date) => {
    if (isMockMode) {
      if (date) {
        useTransportWorkflowStore.getState().ensureTripsForDate(date);
      }
      return Promise.resolve(
        useTransportWorkflowStore.getState().trips.filter((trip) => !date || trip.date === date)
      );
    }
    return api.get("/trips", { params: date ? { date } : {} }).then((response) => {
      const trips = listFrom(response, "trips");
      const state = useTransportWorkflowStore.getState();
      useTransportWorkflowStore.setState({ trips: mergeById(state.trips, trips) });
      return trips;
    });
  },

  // ── Schedules (Admin-Managed Transport Schedules) ───────────────────────
  listSchedules: (filters = {}) => {
    const { routeId, date, serviceType, status } = filters;
    const fleetState = useFleetStore.getState();
    let schedules = fleetState.schedules || [];
    if (status && status !== "all") schedules = schedules.filter((s) => s.status === status);
    if (serviceType && serviceType !== "all") schedules = schedules.filter((s) => s.serviceType === serviceType);
    if (routeId && routeId !== "all") schedules = schedules.filter((s) => s.routeId === routeId);
    if (date) schedules = schedules.filter((s) => isScheduleApplicableOnDate(s, date));
    return Promise.resolve(schedules);
  },

  createSchedule: (scheduleData) =>
    Promise.resolve(useFleetStore.getState().addSchedule(scheduleData)),

  updateSchedule: (id, patch) =>
    Promise.resolve(useFleetStore.getState().updateSchedule(id, patch)),

  deleteSchedule: (id) =>
    Promise.resolve(useFleetStore.getState().deleteSchedule(id)),

  toggleScheduleStatus: (id) =>
    Promise.resolve(useFleetStore.getState().toggleScheduleStatus(id)),

  validateBusConflict: (busId, candidateSchedule, excludeId) =>
    Promise.resolve(useFleetStore.getState().validateBusConflict(busId, candidateSchedule, excludeId)),

  listStudentTickets: (studentId) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().bookingTickets.filter((ticket) => ticket.userId === studentId))
    : api.get("/tickets", { params: { studentId } }).then((response) => {
      const tickets = listFrom(response, "tickets");
      const state = useTransportWorkflowStore.getState();
      useTransportWorkflowStore.setState({ bookingTickets: mergeById(state.bookingTickets, tickets) });
      return tickets;
    }),

  listBookingRequests: (filters = {}) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().bookingTickets.filter((ticket) =>
      (!filters.routeId || ticket.routeId === filters.routeId)
      && (!filters.date || ticket.date === filters.date)
      && (!filters.status || ticket.status === filters.status)))
    : api.get("/tickets", { params: filters }).then((response) => {
      const tickets = listFrom(response, "tickets");
      const state = useTransportWorkflowStore.getState();
      useTransportWorkflowStore.setState({ bookingTickets: mergeById(state.bookingTickets, tickets) });
      return tickets;
    }),

  listScanLogs: (tripId) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().scanLogs.filter((scan) => !tripId || scan.tripId === tripId))
    : api.get("/scans", { params: tripId ? { tripId } : {} }).then((response) => {
      const scanLogs = listFrom(response, "scans");
      const state = useTransportWorkflowStore.getState();
      useTransportWorkflowStore.setState({ scanLogs: mergeById(state.scanLogs, scanLogs) });
      return scanLogs;
    }),

  listViolations: () => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().violations)
    : api.get("/violations").then((response) => {
      const violations = listFrom(response, "violations");
      const state = useTransportWorkflowStore.getState();
      useTransportWorkflowStore.setState({ violations: mergeById(state.violations, violations) });
      return violations;
    }),

  listNotifications: () => isMockMode
    ? Promise.resolve(useSocketStore.getState().notifications)
    : api.get("/notifications").then((response) => {
      const notifications = listFrom(response, "notifications");
      const state = useSocketStore.getState();
      useSocketStore.setState({ notifications: mergeById(state.notifications, notifications) });
      return notifications;
    }),

  createBooking: (request) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().createBookingRequest(request))
    : api.post("/tickets", request).then((response) => {
      const ticket = response.data.ticket || response.data;
      const state = useTransportWorkflowStore.getState();
      useTransportWorkflowStore.setState({ bookingTickets: mergeById(state.bookingTickets, [ticket]) });
      useSocketStore.getState().triggerEvent("booking-request", {
        message: `New hostelite ticket request from ${request.userName} (${request.identifier}).`,
        audienceLabel: "Booking Requests",
        audienceRole: "ADMIN",
        ticketId: ticket.id,
      });
      return response.data;
    }),

  approveBooking: (ticketId, assignment) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().approveBookingRequest(ticketId, assignment))
    : api.post(`/tickets/${encodeURIComponent(ticketId)}/approve`, assignment).then((response) => {
      const localResult = useTransportWorkflowStore.getState().approveBookingRequest(ticketId, assignment);
      if (response.data.ticket) {
        const state = useTransportWorkflowStore.getState();
        useTransportWorkflowStore.setState({ bookingTickets: mergeById(state.bookingTickets, [response.data.ticket]) });
      }
      return { ...localResult, ...response.data, success: true };
    }),

  rejectBooking: (ticketId, reason) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().rejectBookingRequest(ticketId, reason))
    : api.post(`/tickets/${encodeURIComponent(ticketId)}/reject`, { reason }).then((response) => {
      const localResult = useTransportWorkflowStore.getState().rejectBookingRequest(ticketId, reason);
      if (response.data.ticket) {
        const state = useTransportWorkflowStore.getState();
        useTransportWorkflowStore.setState({ bookingTickets: mergeById(state.bookingTickets, [response.data.ticket]) });
      }
      return { ...localResult, ...response.data, success: true };
    }),

  reassignBookingBus: (tripId, busId) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().reassignTripBus(tripId, busId))
    : api.patch(`/trips/${encodeURIComponent(tripId)}/bus`, { busId }).then((response) => ({ success: true, ...response.data })),

  startTrip: (tripId, conductorId) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().startTrip(tripId, conductorId))
    : api.post(`/trips/${encodeURIComponent(tripId)}/start`, { conductorId }).then((response) => {
      useTransportWorkflowStore.getState().startTrip(tripId, conductorId);
      return { ...response.data, success: true };
    }),

  endTrip: (tripId) => isMockMode
    ? Promise.resolve({ expiredCount: useTransportWorkflowStore.getState().endTrip(tripId) })
    : api.post(`/trips/${encodeURIComponent(tripId)}/end`).then((response) => {
      const expiredCount = useTransportWorkflowStore.getState().endTrip(tripId);
      return { ...response.data, expiredCount: response.data.expiredCount ?? expiredCount };
    }),

  scanPass: (qrValue, tripId) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().scanHostelitePass(qrValue, tripId))
    : api.post("/scans", { qrValue, tripId }).then((response) => {
      const responseData = response.data;
      if (responseData.success) {
        const localResult = useTransportWorkflowStore.getState().scanHostelitePass(qrValue, tripId);
        if (responseData.ticket) {
          const state = useTransportWorkflowStore.getState();
          useTransportWorkflowStore.setState({ bookingTickets: mergeById(state.bookingTickets, [responseData.ticket]) });
        }
        if (responseData.trip) {
          const state = useTransportWorkflowStore.getState();
          useTransportWorkflowStore.setState({ trips: mergeById(state.trips, [responseData.trip]) });
        }
        return { ...responseData, ticket: responseData.ticket || localResult.ticket };
      }
      return responseData;
    }),

  syncScans: (scans) => isMockMode
    ? Promise.resolve({
      conflicts: scans.filter((scan) => {
        if (!scan.ticketId) return false;
        const ticket = useTransportWorkflowStore.getState().bookingTickets.find((item) => item.id === scan.ticketId);
        return ticket?.status === "USED"
          && (ticket.conductorId !== scan.conductorId || Date.parse(ticket.scannedAt) < Date.parse(scan.timestamp));
      }),
    })
    : api.post("/scans/sync", { scans }).then((response) => response.data),

  reportViolation: (report) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().reportConductorViolation(report))
    : api.post("/violations", report).then((response) => {
      const localRecord = useTransportWorkflowStore.getState().reportConductorViolation(report);
      const record = response.data.violation || response.data;
      const state = useTransportWorkflowStore.getState();
      useTransportWorkflowStore.setState({ violations: mergeById(state.violations, [record]) });
      return { ...localRecord, ...record };
    }),

  updateViolationStatus: (id, status) => isMockMode
    ? Promise.resolve(useTransportWorkflowStore.getState().updateViolationStatus(id, status))
    : api.patch(`/violations/${encodeURIComponent(id)}`, { status }).then((response) => {
      useTransportWorkflowStore.getState().updateViolationStatus(id, status);
      return response.data;
    }),


  markNotificationsRead: () => isMockMode
    ? Promise.resolve(useSocketStore.getState().markAllRead())
    : api.post("/notifications/read").then((response) => {
      useSocketStore.getState().markAllRead();
      return response.data;
    }),

  // ── Hostel Transport Billing (mock-only for now) ──────────────────────────
  listHostelTransportLogs: (filters = {}) => {
    const { studentId, billingMonth } = filters;
    const state = useTransportWorkflowStore.getState();
    let logs = state.hostelTransportLogs || [];
    if (studentId) logs = logs.filter((log) => log.studentId === studentId);
    if (billingMonth) logs = logs.filter((log) => log.billingMonth === billingMonth);
    // Deduplicate by bookingId
    const seen = new Set();
    logs = logs.filter((log) => {
      const key = log.bookingId || log.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return Promise.resolve(logs);
  },

  listHostelMonthlyBills: (filters = {}) => {
    const { studentId, billingMonth } = filters;
    const state = useTransportWorkflowStore.getState();
    let bills = state.hostelMonthlyBills || [];
    if (studentId) bills = bills.filter((b) => b.studentId === studentId);
    if (billingMonth) bills = bills.filter((b) => b.billingMonth === billingMonth);
    return Promise.resolve(bills);
  },

  generateHostelMonthlyBill: (studentId, billingMonth, studentMeta) =>
    Promise.resolve(useTransportWorkflowStore.getState().generateHostelMonthlyBill(studentId, billingMonth, studentMeta)),

  updateHostelBillStatus: (billId, status) =>
    Promise.resolve(useTransportWorkflowStore.getState().updateHostelBillStatus(billId, status)),
};
