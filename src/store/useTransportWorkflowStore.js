import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BUSES, ROUTES } from "@/data/mockData";
import { useFleetStore } from "@/store/useFleetStore";
import { useFineStore } from "@/store/useFineStore";
import { useSocketStore } from "@/store/useSocketStore";
import { syncPersistedStore } from "@/lib/storeSync";

const dateKey = (date) => date.toISOString().slice(0, 10);
export const tripIdFor = (routeId, date) => `TRIP-${routeId}-${date}`;
const demoDates = [0, 1, 2].map((offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return dateKey(date);
});
const initialTrips = demoDates.flatMap((date) =>
  ROUTES.map((route) => ({
    id: tripIdFor(route.id, date),
    routeId: route.id,
    busId: route.busId,
    date,
    departureTime: route.departureTime,
    status: "SCHEDULED",
    seatedCapacity: BUSES.find((bus) => bus.id === route.busId)?.capacity || 50,
    standingCapacity: 10,
    seatedCount: 0,
    standingCount: 0,
  }))
);
const primaryDemoTrip = initialTrips.find((trip) => trip.routeId === "RT-04");
const initialBookingRequests = [
  {
    id: "TKT-DEMO-PASS",
    userId: "STU-004",
    userName: "Ayesha Siddiqui",
    identifier: "23F-4410",
    routeId: "RT-04",
    stopId: "Chiniot Bus Stand",
    date: primaryDemoTrip.date,
    tripId: primaryDemoTrip.id,
    fareType: "FULL",
    seatType: "SEATED",
    status: "PASS_ISSUED",
    busId: "BUS-104",
    requestedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    issuedAt: new Date().toISOString(),
    expiresAt: `${primaryDemoTrip.date}T23:59:59.000Z`,
    nonce: "demo-pass-single-use-3091",
    qrToken: JSON.stringify({
      type: "SMARTU_HOSTELITE_PASS",
      ticketId: "TKT-DEMO-PASS",
      studentId: "STU-004",
      tripId: primaryDemoTrip.id,
      nonce: "demo-pass-single-use-3091",
      issuedAt: new Date().toISOString(),
    }),
    statusHistory: ["REQUESTED", "APPROVED", "PASS_ISSUED"],
  },
  {
    id: "TKT-DEMO-REQUEST",
    userId: "STU-008",
    userName: "Mahnoor Khan",
    identifier: "22F-3140",
    routeId: "RT-04",
    stopId: "Chiniot Bus Stand",
    date: demoDates[1],
    tripId: tripIdFor("RT-04", demoDates[1]),
    fareType: "HALF",
    status: "REQUESTED",
    requestedAt: new Date().toISOString(),
    statusHistory: ["REQUESTED"],
  },
  {
    id: "TKT-DEMO-APPROVED",
    userId: "STU-006",
    userName: "Zainab Malik",
    identifier: "21I-0965",
    routeId: "RT-02",
    stopId: "Millat Town",
    date: demoDates[1],
    tripId: tripIdFor("RT-02", demoDates[1]),
    fareType: "FULL",
    status: "APPROVED",
    seatType: "SEATED",
    busId: "BUS-102",
    requestedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
    statusHistory: ["REQUESTED", "APPROVED"],
  },
];

export function calculateHostelBillData(studentId, billingMonth, logs = []) {
  const studentLogs = (logs || []).filter((log) => {
    if (studentId && log.studentId !== studentId) return false;
    if (billingMonth && log.billingMonth !== billingMonth) return false;
    return true;
  });

  // Deduplicate by bookingId to guarantee the same approved booking is NEVER counted twice
  const seenBookings = new Set();
  const dedupedLogs = [];
  for (const log of studentLogs) {
    const key = log.bookingId || log.id;
    if (!seenBookings.has(key)) {
      seenBookings.add(key);
      dedupedLogs.push(log);
    }
  }

  const oneWayLogs = dedupedLogs.filter((log) => (log.tripType || "").toLowerCase() === "one way" || log.tripType === "ONE_WAY");
  const twoWayLogs = dedupedLogs.filter((log) => (log.tripType || "").toLowerCase() === "two way" || log.tripType === "TWO_WAY");

  const oneWayCount = oneWayLogs.length;
  const twoWayCount = twoWayLogs.length;
  const oneWayRate = 250;
  const twoWayRate = 400;
  const oneWaySubtotal = oneWayCount * oneWayRate;
  const twoWaySubtotal = twoWayCount * twoWayRate;
  const totalAmount = oneWaySubtotal + twoWaySubtotal;

  return {
    studentId,
    billingMonth,
    oneWayCount,
    oneWayRate,
    oneWaySubtotal,
    twoWayCount,
    twoWayRate,
    twoWaySubtotal,
    totalAmount,
    totalTrips: dedupedLogs.length,
    logs: dedupedLogs,
  };
}

export const initialAliBookings = [
  {
    id: "BKG-ALI-01",
    userId: "STU-014",
    userName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    stopId: "D-Ground Chowk",
    date: "2026-09-02",
    tripId: "TRIP-RT-01-2026-09-02",
    tripType: "One Way",
    fare: 250,
    fareType: "FULL",
    seatType: "SEATED",
    status: "APPROVED",
    busId: "BUS-101",
    requestedAt: "2026-09-01T15:30:00.000Z",
    approvedAt: "2026-09-02T10:00:00.000Z",
    issuedAt: "2026-09-02T10:00:00.000Z",
    statusHistory: ["REQUESTED", "APPROVED"],
  },
  {
    id: "BKG-ALI-02",
    userId: "STU-014",
    userName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    stopId: "Susan Road",
    date: "2026-09-05",
    tripId: "TRIP-RT-01-2026-09-05",
    tripType: "Two Way",
    fare: 400,
    fareType: "FULL",
    seatType: "SEATED",
    status: "APPROVED",
    busId: "BUS-101",
    requestedAt: "2026-09-04T12:00:00.000Z",
    approvedAt: "2026-09-05T09:30:00.000Z",
    issuedAt: "2026-09-05T09:30:00.000Z",
    statusHistory: ["REQUESTED", "APPROVED"],
  },
  {
    id: "BKG-ALI-03",
    userId: "STU-014",
    userName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    stopId: "Kohinoor Chowk",
    date: "2026-09-08",
    tripId: "TRIP-RT-01-2026-09-08",
    tripType: "One Way",
    fare: 250,
    fareType: "FULL",
    seatType: "SEATED",
    status: "APPROVED",
    busId: "BUS-101",
    requestedAt: "2026-09-07T14:00:00.000Z",
    approvedAt: "2026-09-08T10:15:00.000Z",
    issuedAt: "2026-09-08T10:15:00.000Z",
    statusHistory: ["REQUESTED", "APPROVED"],
  },
  {
    id: "BKG-ALI-04",
    userId: "STU-014",
    userName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    stopId: "Abdullahpur Stop",
    date: "2026-09-10",
    tripId: "TRIP-RT-01-2026-09-10",
    tripType: "One Way",
    fare: 250,
    fareType: "FULL",
    status: "REJECTED",
    rejectionReason: "Bus fully booked",
    requestedAt: "2026-09-09T16:20:00.000Z",
    statusHistory: ["REQUESTED", "REJECTED"],
  },
  {
    id: "BKG-ALI-05",
    userId: "STU-014",
    userName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-02",
    stopId: "Millat Town",
    date: "2026-09-15",
    tripId: "TRIP-RT-02-2026-09-15",
    tripType: "Two Way",
    fare: 400,
    fareType: "FULL",
    seatType: "SEATED",
    status: "APPROVED",
    busId: "BUS-102",
    requestedAt: "2026-09-14T09:00:00.000Z",
    approvedAt: "2026-09-15T11:20:00.000Z",
    issuedAt: "2026-09-15T11:20:00.000Z",
    statusHistory: ["REQUESTED", "APPROVED"],
  },
  {
    id: "BKG-ALI-06",
    userId: "STU-014",
    userName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    stopId: "D-Ground Chowk",
    date: "2026-09-20",
    tripId: "TRIP-RT-01-2026-09-20",
    tripType: "One Way",
    fare: 250,
    fareType: "FULL",
    seatType: "SEATED",
    status: "APPROVED",
    busId: "BUS-101",
    requestedAt: "2026-09-19T10:10:00.000Z",
    approvedAt: "2026-09-20T08:45:00.000Z",
    issuedAt: "2026-09-20T08:45:00.000Z",
    statusHistory: ["REQUESTED", "APPROVED"],
  },
  {
    id: "BKG-ALI-07",
    userId: "STU-014",
    userName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    stopId: "Susan Road",
    date: "2026-09-22",
    tripId: "TRIP-RT-01-2026-09-22",
    tripType: "One Way",
    fare: 250,
    fareType: "FULL",
    status: "REQUESTED",
    requestedAt: "2026-09-21T18:00:00.000Z",
    statusHistory: ["REQUESTED"],
  },
];

const allInitialBookingRequests = [...initialBookingRequests, ...initialAliBookings];

export const initialHostelTransportLogs = [
  {
    id: "LOG-BKG-ALI-01",
    bookingId: "BKG-ALI-01",
    studentId: "STU-014",
    studentName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    routeName: "D-Ground",
    busId: "BUS-101",
    busPlate: "FSD-2023",
    tripId: "TRIP-RT-01-2026-09-02",
    date: "2026-09-02",
    tripType: "One Way",
    fare: 250,
    bookingStatus: "APPROVED",
    approvedAt: "2026-09-02T10:00:00.000Z",
    billingMonth: "2026-09",
  },
  {
    id: "LOG-BKG-ALI-02",
    bookingId: "BKG-ALI-02",
    studentId: "STU-014",
    studentName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    routeName: "D-Ground",
    busId: "BUS-101",
    busPlate: "FSD-2023",
    tripId: "TRIP-RT-01-2026-09-05",
    date: "2026-09-05",
    tripType: "Two Way",
    fare: 400,
    bookingStatus: "APPROVED",
    approvedAt: "2026-09-05T09:30:00.000Z",
    billingMonth: "2026-09",
  },
  {
    id: "LOG-BKG-ALI-03",
    bookingId: "BKG-ALI-03",
    studentId: "STU-014",
    studentName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    routeName: "D-Ground",
    busId: "BUS-101",
    busPlate: "FSD-2023",
    tripId: "TRIP-RT-01-2026-09-08",
    date: "2026-09-08",
    tripType: "One Way",
    fare: 250,
    bookingStatus: "APPROVED",
    approvedAt: "2026-09-08T10:15:00.000Z",
    billingMonth: "2026-09",
  },
  {
    id: "LOG-BKG-ALI-05",
    bookingId: "BKG-ALI-05",
    studentId: "STU-014",
    studentName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-02",
    routeName: "Jaranwala Road",
    busId: "BUS-102",
    busPlate: "FSD-4471",
    tripId: "TRIP-RT-02-2026-09-15",
    date: "2026-09-15",
    tripType: "Two Way",
    fare: 400,
    bookingStatus: "APPROVED",
    approvedAt: "2026-09-15T11:20:00.000Z",
    billingMonth: "2026-09",
  },
  {
    id: "LOG-BKG-ALI-06",
    bookingId: "BKG-ALI-06",
    studentId: "STU-014",
    studentName: "Ali",
    identifier: "22F-3099",
    routeId: "RT-01",
    routeName: "D-Ground",
    busId: "BUS-101",
    busPlate: "FSD-2023",
    tripId: "TRIP-RT-01-2026-09-20",
    date: "2026-09-20",
    tripType: "One Way",
    fare: 250,
    bookingStatus: "APPROVED",
    approvedAt: "2026-09-20T08:45:00.000Z",
    billingMonth: "2026-09",
  },
];

export const initialHostelMonthlyBills = [
  {
    id: "BILL-STU-014-2026-09",
    studentId: "STU-014",
    studentName: "Ali",
    rollNo: "22F-3099",
    billingMonth: "2026-09",
    monthLabel: "September 2026",
    oneWayCount: 3,
    oneWayRate: 250,
    oneWaySubtotal: 750,
    twoWayCount: 2,
    twoWayRate: 400,
    twoWaySubtotal: 800,
    totalAmount: 1550,
    totalTrips: 5,
    status: "Pending",
    generatedAt: "2026-09-30T23:59:59.000Z",
    bookingIds: ["BKG-ALI-01", "BKG-ALI-02", "BKG-ALI-03", "BKG-ALI-05", "BKG-ALI-06"],
  },
];

const initialViolations = [{
  id: "VIO-DEMO-001",
  studentId: "STU-004",
  userIds: ["STU-004"],
  users: [{ userId: "STU-004", strike: 1, fine: 1000, fineKey: "FINE_1ST", paymentStatus: "Unpaid" }],
  rollNo: "23F-4410",
  tripId: primaryDemoTrip.id,
  routeId: "RT-01",
  type: "without_ticket",
  description: "Seeded example: boarding without a valid ticket.",
  conductorId: "CND-01",
  conductorName: "Aslam Chaudhry",
  note: "",
  timestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  status: "OPEN",
}];

export const useTransportWorkflowStore = create(
  persist(
    (set, get) => ({
      feeSchedule: { FEE_DAY_SCHOLAR: 38500, FEE_DAY_SCHOLAR_LATE: 43500, FEE_FACULTY: null },
      semesterPayments: [],
      tickets: [],
      bookingTickets: allInitialBookingRequests,
      trips: initialTrips,
      scanLogs: [],
      failureAlertAt: null,
      violations: initialViolations,
      fineSchedule: { FINE_1ST: 500, FINE_2ND: 1000, FINE_3RD: 2000 },
      // Hostel transport billing state
      hostelTransportLogs: initialHostelTransportLogs,
      hostelMonthlyBills: initialHostelMonthlyBills,

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

      createBookingRequest: (request) => {
        const record = {
          ...request,
          id: `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          status: "REQUESTED",
          requestedAt: new Date().toISOString(),
          statusHistory: ["REQUESTED"],
          scheduleId: request.scheduleId || null,
          serviceType: request.serviceType || "REGULAR_MORNING",
        };
        set((state) => ({ bookingTickets: [record, ...state.bookingTickets] }));
        useSocketStore.getState().triggerEvent("booking-request", {
          message: `New hostelite ticket request from ${record.userName} (${record.identifier}).`,
          audienceLabel: "Booking Requests",
          audienceRole: "ADMIN",
          ticketId: record.id,
        });
        return record;
      },

      ensureTripsForDate: (dateStr) => {
        if (!dateStr) return get().trips;
        const state = get();
        const fleetStore = useFleetStore.getState();
        const activeSchedules = fleetStore.getSchedulesForDate(dateStr);
        const existingTrips = state.trips;
        const newTrips = [];

        for (const sch of activeSchedules) {
          const tripId = `TRIP-${sch.id}-${dateStr}`;
          const exists = existingTrips.find(
            (t) => t.id === tripId || (t.routeId === sch.routeId && t.date === dateStr && t.departureTime === sch.departureTime)
          );
          if (!exists) {
            const bus = fleetStore.buses.find((b) => b.id === sch.busId);
            newTrips.push({
              id: tripId,
              scheduleId: sch.id,
              serviceType: sch.serviceType,
              title: sch.title || `${sch.serviceType.replace("_", " ")}`,
              routeId: sch.routeId,
              busId: sch.busId,
              driverId: sch.driverId,
              conductorId: sch.conductorId,
              date: dateStr,
              departureTime: sch.departureTime,
              arrivalTime: sch.arrivalTime,
              status: "SCHEDULED",
              seatedCapacity: bus?.capacity || 50,
              standingCapacity: 10,
              seatedCount: 0,
              standingCount: 0,
            });
          }
        }

        if (newTrips.length > 0) {
          set((s) => ({ trips: [...s.trips, ...newTrips] }));
        }
        return get().trips.filter((t) => t.date === dateStr);
      },

      approveBookingRequest: (ticketId, { busId, tripId, seatType }) => {
        const state = get();
        const ticket = state.bookingTickets.find((item) => item.id === ticketId);
        const trip = state.trips.find((item) => item.id === tripId);
        const bus = useFleetStore.getState().buses.find((item) => item.id === busId);
        if (!ticket || ticket.status !== "REQUESTED") return { success: false, error: "Request is no longer pending." };
        if (!trip || trip.routeId !== ticket.routeId || trip.date !== ticket.date) return { success: false, error: "Select a trip matching the requested route and date." };
        if (!bus || bus.status === "Under Maintenance" || (bus.routeId !== ticket.routeId && bus.status !== "Reserve")) return { success: false, error: "Select a bus assigned to this route or an available reserve bus." };
              const capacity = Number(bus.capacity) || 50;
              const seatedCount = state.bookingTickets.filter((item) =>
                item.tripId === tripId && item.seatType === "SEATED" && ["APPROVED", "PASS_ISSUED", "USED"].includes(item.status)
              ).length;
        const standingCapacity = Number(trip.standingCapacity) || 10;
        const standingCount = state.bookingTickets.filter((item) =>
          item.tripId === tripId && item.seatType === "STANDING" && ["APPROVED", "PASS_ISSUED", "USED"].includes(item.status)
        ).length;
        if (seatType === "SEATED" && seatedCount >= capacity) return { success: false, error: "No seated capacity remains on this bus." };
        if (seatType === "STANDING" && standingCount >= standingCapacity) return { success: false, error: "No standing capacity remains on this trip." };

        const nonce = crypto.randomUUID();
        const issuedAt = new Date().toISOString();
        const token = {
          type: "SMARTU_HOSTELITE_PASS",
          ticketId: ticket.id,
          studentId: ticket.userId,
          tripId,
          nonce,
          issuedAt,
        };
        const qrToken = JSON.stringify(token);
        set((current) => ({
          bookingTickets: current.bookingTickets.map((item) => item.id !== ticketId ? item : {
            ...item,
            busId,
            tripId,
            seatType,
            status: "PASS_ISSUED",
            approvedAt: issuedAt,
            issuedAt,
            expiresAt: `${ticket.date}T23:59:59.999Z`,
            nonce,
            qrToken,
            statusHistory: [...(item.statusHistory || ["REQUESTED"]), "APPROVED", "PASS_ISSUED"],
          }),
          trips: current.trips.map((item) => item.id === tripId ? { ...item, busId, seatedCapacity: bus.capacity } : item),
        }));

        // ── HOSTEL BILLING LOG (idempotent by bookingId) ──────────────────
        // Only create a log if one for this bookingId does not already exist.
        const existingLog = get().hostelTransportLogs.find((log) => log.bookingId === ticketId);
        if (!existingLog) {
          const billingDate = issuedAt.slice(0, 10); // YYYY-MM-DD
          const billingMonth = billingDate.slice(0, 7); // YYYY-MM
          const routeData = (useFleetStore.getState().routes || []).find((r) => r.id === ticket.routeId);
          const tripType = ticket.tripType || (ticket.fareType === "HALF" ? "One Way" : "One Way");
          const fare = tripType === "Two Way" ? 400 : 250;
          const newLog = {
            id: `LOG-${ticketId}`,
            bookingId: ticketId,
            studentId: ticket.userId,
            studentName: ticket.userName,
            identifier: ticket.identifier,
            routeId: ticket.routeId,
            routeName: routeData?.shortName || routeData?.name || ticket.routeId,
            busId,
            busPlate: bus.plate || busId,
            tripId,
            date: ticket.date,
            tripType,
            fare,
            bookingStatus: "APPROVED",
            approvedAt: issuedAt,
            billingMonth,
          };
          set((current) => ({ hostelTransportLogs: [newLog, ...current.hostelTransportLogs] }));
        }

        useSocketStore.getState().triggerEvent("booking-approved", {
          message: `Your hostelite pass for ${ticket.identifier} has been approved and issued.`,
          audienceLabel: ticket.identifier,
          studentId: ticket.userId,
        });
        return { success: true };
      },

      // ── Hostel Transport Log helpers ──────────────────────────────────────
      addHostelTransportLog: (log) => {
        // Idempotent: skip if a log for this bookingId already exists
        const existing = get().hostelTransportLogs.find((l) => l.bookingId === log.bookingId);
        if (existing) return existing;
        const record = { id: `LOG-${log.bookingId}`, ...log };
        set((state) => ({ hostelTransportLogs: [record, ...state.hostelTransportLogs] }));
        return record;
      },

      getHostelLogsForStudent: (studentId, billingMonth) => {
        const logs = get().hostelTransportLogs.filter((log) => {
          if (log.studentId !== studentId) return false;
          if (billingMonth && log.billingMonth !== billingMonth) return false;
          return true;
        });
        // Deduplicate by bookingId
        const seenIds = new Set();
        return logs.filter((log) => {
          const key = log.bookingId || log.id;
          if (seenIds.has(key)) return false;
          seenIds.add(key);
          return true;
        });
      },

      // ── Hostel Monthly Bill actions ───────────────────────────────────────
      generateHostelMonthlyBill: (studentId, billingMonth, studentMeta) => {
        const state = get();
        // Prevent duplicate bill for same student+month
        const existing = state.hostelMonthlyBills.find(
          (b) => b.studentId === studentId && b.billingMonth === billingMonth
        );
        if (existing) return { success: false, error: "Bill already exists for this student and month.", bill: existing };

        // Compute from logs (deduplicated)
        const logs = get().getHostelLogsForStudent(studentId, billingMonth);
        const oneWayLogs = logs.filter((log) => (log.tripType || "").toLowerCase() === "one way" || log.tripType === "ONE_WAY");
        const twoWayLogs = logs.filter((log) => (log.tripType || "").toLowerCase() === "two way" || log.tripType === "TWO_WAY");
        const oneWayCount = oneWayLogs.length;
        const twoWayCount = twoWayLogs.length;
        const oneWayRate = 250;
        const twoWayRate = 400;
        const oneWaySubtotal = oneWayCount * oneWayRate;
        const twoWaySubtotal = twoWayCount * twoWayRate;
        const totalAmount = oneWaySubtotal + twoWaySubtotal;

        const [year, month] = billingMonth.split("-");
        const monthLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

        const bill = {
          id: `BILL-${studentId}-${billingMonth}`,
          studentId,
          studentName: studentMeta?.name || logs[0]?.studentName || studentId,
          rollNo: studentMeta?.rollNo || logs[0]?.identifier || "",
          billingMonth,
          monthLabel,
          oneWayCount,
          oneWayRate,
          oneWaySubtotal,
          twoWayCount,
          twoWayRate,
          twoWaySubtotal,
          totalAmount,
          totalTrips: logs.length,
          status: "Pending",
          generatedAt: new Date().toISOString(),
          bookingIds: logs.map((l) => l.bookingId),
        };
        set((s) => ({ hostelMonthlyBills: [bill, ...s.hostelMonthlyBills] }));
        return { success: true, bill };
      },

      updateHostelBillStatus: (billId, status) =>
        set((state) => ({
          hostelMonthlyBills: state.hostelMonthlyBills.map((bill) =>
            bill.id === billId ? { ...bill, status, updatedAt: new Date().toISOString() } : bill
          ),
        })),

      getHostelBillsForStudent: (studentId) =>
        get().hostelMonthlyBills.filter((bill) => bill.studentId === studentId),

      rejectBookingRequest: (ticketId, reason) => {
        const ticket = get().bookingTickets.find((item) => item.id === ticketId);
        if (!ticket || ticket.status !== "REQUESTED") return { success: false, error: "Request is no longer pending." };
        set((state) => ({
          bookingTickets: state.bookingTickets.map((item) => item.id !== ticketId ? item : {
            ...item,
            status: "REJECTED",
            rejectionReason: reason,
            statusHistory: [...(item.statusHistory || ["REQUESTED"]), "REJECTED"],
          }),
        }));
        useSocketStore.getState().triggerEvent("booking-rejected", {
          message: `Your ticket request was rejected: ${reason}`,
          audienceLabel: ticket.identifier,
          studentId: ticket.userId,
        });
        return { success: true };
      },

      startTrip: (tripId, conductorId) => {
        const trip = get().trips.find((item) => item.id === tripId);
        if (!trip || trip.status === "COMPLETED") return { success: false, error: "Trip is unavailable." };
        set((state) => ({
          trips: state.trips.map((item) => item.id === tripId
            ? { ...item, status: "ACTIVE", conductorId, startedAt: new Date().toISOString() }
            : item),
        }));
        return { success: true };
      },

      reassignTripBus: (tripId, busId) => {
        const trip = get().trips.find((item) => item.id === tripId);
        const bus = useFleetStore.getState().buses.find((item) => item.id === busId);
        if (!trip || !bus || (bus.routeId && bus.routeId !== trip.routeId) || bus.status === "Under Maintenance") {
          return { success: false, error: "Choose a bus assigned to this route or an available reserve bus." };
        }
        set((state) => ({
          trips: state.trips.map((item) => item.id === tripId
            ? { ...item, busId, seatedCapacity: bus.capacity }
            : item),
          bookingTickets: state.bookingTickets.map((ticket) => ticket.tripId === tripId && ["APPROVED", "PASS_ISSUED"].includes(ticket.status)
            ? { ...ticket, busId }
            : ticket),
        }));
        return { success: true };
      },

      endTrip: (tripId) => {
        const endedAt = new Date().toISOString();
        const expiredTickets = get().bookingTickets.filter((ticket) =>
          ticket.tripId === tripId && ticket.status === "PASS_ISSUED"
        );
        set((state) => ({
          trips: state.trips.map((trip) => trip.id === tripId
            ? { ...trip, status: "COMPLETED", endedAt }
            : trip),
          bookingTickets: state.bookingTickets.map((ticket) =>
            ticket.tripId === tripId && ticket.status === "PASS_ISSUED"
              ? { ...ticket, status: "EXPIRED", statusHistory: [...(ticket.statusHistory || []), "EXPIRED"] }
              : ticket),
        }));
        expiredTickets.forEach((ticket) => useSocketStore.getState().triggerEvent("booking-expired", {
          message: `Your pass expired when the trip ended (${ticket.identifier}).`,
          audienceLabel: ticket.identifier,
          studentId: ticket.userId,
        }));
        return expiredTickets.length;
      },

      scanHostelitePass: (qrValue, tripId) => {
        let payload;
        try {
          payload = JSON.parse(qrValue);
        } catch {
          return { success: false, reason: "Invalid QR" };
        }
        if (payload?.type !== "SMARTU_HOSTELITE_PASS") return { success: false, reason: "Invalid QR" };
        const ticket = get().bookingTickets.find((item) => item.id === payload.ticketId);
        if (!ticket) return { success: false, reason: "Not approved" };
        if (ticket.status === "USED") return { success: false, reason: "Already used", ticket };
        if (ticket.status === "EXPIRED" || (ticket.expiresAt && Date.now() > Date.parse(ticket.expiresAt))) {
          return { success: false, reason: "Expired", ticket };
        }
        if (ticket.status === "REJECTED" || ticket.status === "CANCELLED") return { success: false, reason: "Cancelled", ticket };
        if (ticket.status !== "PASS_ISSUED") return { success: false, reason: "Not approved", ticket };
        if (payload.studentId !== ticket.userId || payload.nonce !== ticket.nonce) return { success: false, reason: "Invalid QR", ticket };
        if (ticket.tripId !== tripId || payload.tripId !== tripId) return { success: false, reason: "Wrong trip", ticket };
        const scannedAt = new Date().toISOString();
        set((state) => ({
          bookingTickets: state.bookingTickets.map((item) => item.id === ticket.id
            ? { ...item, status: "USED", scannedAt, conductorId: get().trips.find((trip) => trip.id === tripId)?.conductorId, statusHistory: [...(item.statusHistory || []), "USED"] }
            : item),
          trips: state.trips.map((trip) => trip.id !== tripId ? trip : {
            ...trip,
            seatedCount: trip.seatedCount + (ticket.seatType === "STANDING" ? 0 : 1),
            standingCount: trip.standingCount + (ticket.seatType === "STANDING" ? 1 : 0),
          }),
        }));
        useSocketStore.getState().triggerEvent("booking-used", {
          message: `Your pass for ${ticket.identifier} was scanned and used.`,
          audienceLabel: ticket.identifier,
          studentId: ticket.userId,
        });
        return { success: true, ticket };
      },

      recordScan: (scan) => {
        const record = {
          id: `SCAN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          ...scan,
        };
        set((state) => ({
          scanLogs: [record, ...state.scanLogs].slice(0, 2000),
          trips: scan.result === "GREEN" && scan.type === "DAY_SCHOLAR"
            ? state.trips.map((trip) => trip.id === scan.tripId
              ? { ...trip, seatedCount: (trip.seatedCount || 0) + 1 }
              : trip)
            : state.trips,
        }));
        const recentFailures = get().scanLogs.filter((item) =>
          item.result === "RED" && Date.now() - Date.parse(item.timestamp) < 60000
        ).length;
        if (recentFailures >= 5 && (!get().failureAlertAt || Date.now() - Date.parse(get().failureAlertAt) > 300000)) {
          const alertedAt = new Date().toISOString();
          set({ failureAlertAt: alertedAt });
          useSocketStore.getState().triggerEvent("failed-scan-spike", {
            message: `${recentFailures} failed conductor scans were recorded in the last minute.`,
            audienceLabel: "Scan Logs",
          });
        }
        return record;
      },

      reportConductorViolation: ({ student, tripId, routeId, type, conductor, note }) => {
        const existing = get().violations.filter((item) =>
          item.studentId === student.id || item.userIds?.includes(student.id)
        ).length;
        const strike = existing + 1;
        const fine = strike === 1 ? 1000 : strike === 2 ? 5000 : 0;
        const id = `VIO-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const createdAt = new Date().toISOString();
        const record = {
          id,
          studentId: student.id,
          userIds: [student.id],
          users: [{ userId: student.id, strike, fine, fineKey: strike >= 3 ? "DDC" : `FINE_${strike}`, paymentStatus: strike >= 3 ? "Escalated" : "Unpaid" }],
          rollNo: student.rollNo,
          studentName: student.name,
          tripId,
          routeId,
          type,
          conductorId: conductor.id,
          conductorName: conductor.name,
          note: note.trim(),
          amount: fine,
          penalty: strike >= 3 ? "Referred to Disciplinary Committee (DDC)" : `Rs. ${fine.toLocaleString()}`,
          strike,
          timestamp: createdAt,
          createdAt,
          status: "OPEN",
        };
        set((state) => ({ violations: [record, ...state.violations] }));
        if (fine > 0) {
          useFineStore.getState().addFine({
            rollNo: student.rollNo,
            reason: `Conductor violation: ${type}`,
            amount: fine,
            date: dateKey(new Date()),
            violationId: id,
          });
        }
        useSocketStore.getState().triggerEvent("violation-reported", {
          message: `${student.rollNo}: ${type.replaceAll("_", " ")} · ${record.penalty}`,
          audienceLabel: "Violations",
          violationId: id,
        });
        useSocketStore.getState().triggerEvent("student-fine", {
          message: `A transport penalty was recorded: ${record.penalty}.`,
          audienceLabel: student.rollNo,
          studentId: student.id,
        });
        return record;
      },

      updateViolationStatus: (id, status) => {
        const violation = get().violations.find((item) => item.id === id);
        set((state) => ({
          violations: state.violations.map((item) => item.id === id
            ? { ...item, status, resolvedAt: new Date().toISOString() }
            : item),
        }));
        if (["Resolved", "Waived"].includes(status) && violation) {
          useFineStore.getState().fines
            .filter((fine) => fine.violationId === id && fine.status !== "Cleared")
            .forEach((fine) => useFineStore.getState().clearFine(fine.id));
          const studentId = violation.studentId || violation.userIds?.[0];
          if (studentId) useSocketStore.getState().triggerEvent("student-fine-updated", {
            message: `Your violation ${id} was marked ${status.toLowerCase()} by Admin.`,
            audienceLabel: violation.rollNo,
            studentId,
          });
        }
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
    {
      name: "smartu-transport-workflows",
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        bookingTickets: persistedState?.bookingTickets || currentState.bookingTickets,
        trips: persistedState?.trips || currentState.trips,
        scanLogs: persistedState?.scanLogs || currentState.scanLogs,
        failureAlertAt: persistedState?.failureAlertAt || currentState.failureAlertAt,
        violations: persistedState?.violations || currentState.violations,
        hostelTransportLogs: persistedState?.hostelTransportLogs || currentState.hostelTransportLogs,
        hostelMonthlyBills: persistedState?.hostelMonthlyBills || currentState.hostelMonthlyBills,
      }),
    }
  )
);

syncPersistedStore(useTransportWorkflowStore, "smartu-transport-workflows");
