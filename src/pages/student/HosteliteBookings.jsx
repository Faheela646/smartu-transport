import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  CalendarRange,
  ClipboardList,
  FileText,
  Receipt,
  Clock,
  Bus as BusIcon,
  Sparkles,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/useAuthStore";
import { useFineStore } from "@/store/useFineStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { isMockMode, transportService } from "@/api/transportService";
import { SCHEDULE_TYPES } from "@/data/mockData";

const badgeVariants = {
  REQUESTED: "warning",
  APPROVED: "accent",
  PASS_ISSUED: "success",
  USED: "secondary",
  REJECTED: "destructive",
  EXPIRED: "secondary",
};

const SERVICE_TYPE_BADGES = {
  [SCHEDULE_TYPES.REGULAR_MORNING]: "success",
  [SCHEDULE_TYPES.REGULAR_RETURN]: "accent",
  [SCHEDULE_TYPES.SPECIAL_SHUTTLE]: "warning",
  [SCHEDULE_TYPES.EVENT_SHUTTLE]: "destructive",
};

const SERVICE_TYPE_LABELS = {
  [SCHEDULE_TYPES.REGULAR_MORNING]: "Morning Service",
  [SCHEDULE_TYPES.REGULAR_RETURN]: "Return Transport",
  [SCHEDULE_TYPES.SPECIAL_SHUTTLE]: "Special Shuttle",
  [SCHEDULE_TYPES.EVENT_SHUTTLE]: "Event Shuttle",
};

const BILL_STATUS_VARIANT = {
  Pending: "warning",
  Paid: "success",
  Overdue: "destructive",
};

function TripCountdown({ expiresAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Date.parse(expiresAt) - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return <span>{remaining ? `Valid for ${hours}h ${minutes}m ${seconds}s` : "Expired"}</span>;
}

function formatMonth(billingMonth) {
  if (!billingMonth) return "";
  const [year, month] = billingMonth.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function HosteliteBookings() {
  const user = useAuthStore((state) => state.user);
  const students = useStudentStore((state) => state.students);
  const student = students.find((item) => item.id === user?.id);
  const routes = useFleetStore((state) => state.routes);
  const buses = useFleetStore((state) => state.buses);
  const getSchedulesForDate = useFleetStore((state) => state.getSchedulesForDate);
  const storedTrips = useTransportWorkflowStore((state) => state.trips);
  const storedTickets = useTransportWorkflowStore((state) => state.bookingTickets);
  const storedLogs = useTransportWorkflowStore((state) => state.hostelTransportLogs);
  const storedBills = useTransportWorkflowStore((state) => state.hostelMonthlyBills);
  const allFines = useFineStore((state) => state.fines);

  // Booking form state
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [tripId, setTripId] = useState("");
  const [stopSearch, setStopSearch] = useState("");
  const [stopId, setStopId] = useState("");
  const [tripType, setTripType] = useState("One Way");
  const [submitting, setSubmitting] = useState(false);
  const [remoteTrips, setRemoteTrips] = useState(null);
  const [remoteTickets, setRemoteTickets] = useState(null);
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(!isMockMode && Boolean(user?.id));

  // Bill tab state
  const [selectedBillingMonth, setSelectedBillingMonth] = useState("");

  // Get active schedules available for selected date
  const availableSchedulesForDate = useMemo(() => {
    return getSchedulesForDate(tripDate);
  }, [getSchedulesForDate, tripDate]);

  // Ensure trips are synced for this date in mock store
  useEffect(() => {
    transportService.listTrips(tripDate);
  }, [tripDate]);

  const trips = remoteTrips ?? storedTrips;
  const tickets = remoteTickets ?? storedTickets;

  // Selected schedule object
  const activeSchedule = useMemo(() => {
    return availableSchedulesForDate.find((s) => s.id === selectedScheduleId) || null;
  }, [availableSchedulesForDate, selectedScheduleId]);

  // When schedule changes, synchronize routeId
  useEffect(() => {
    if (activeSchedule) {
      setRouteId(activeSchedule.routeId);
      const matchingTrip = trips.find(
        (t) =>
          t.date === tripDate &&
          (t.scheduleId === activeSchedule.id ||
            (t.routeId === activeSchedule.routeId && t.departureTime === activeSchedule.departureTime))
      );
      if (matchingTrip) {
        setTripId(matchingTrip.id);
      } else {
        setTripId(`TRIP-${activeSchedule.id}-${tripDate}`);
      }
    }
  }, [activeSchedule, tripDate, trips]);

  const route = routes.find((item) => item.id === routeId);

  const filteredStops = useMemo(() => {
    return (route?.stops || []).filter((stop) =>
      stop.name.toLowerCase().includes(stopSearch.toLowerCase())
    );
  }, [route, stopSearch]);

  const studentFines = allFines.filter((fine) => fine.rollNo === student?.rollNo && fine.status !== "Cleared");
  const blocked = student?.feeStatus !== "Paid" || studentFines.length > 0;
  const myTickets = tickets.filter((ticket) => ticket.userId === user?.id);
  const hasActiveRequest = myTickets.some((ticket) =>
    ["REQUESTED", "APPROVED", "PASS_ISSUED"].includes(ticket.status)
  );

  // Transport logs for this student (approved bookings only)
  const myLogs = useMemo(() => {
    const allLogs = storedLogs || [];
    const filtered = allLogs.filter((log) => log.studentId === user?.id);
    const seen = new Set();
    return filtered.filter((log) => {
      const key = log.bookingId || log.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [storedLogs, user?.id]);

  // Unique billing months from logs
  const billingMonths = useMemo(() => {
    const months = [...new Set(myLogs.map((log) => log.billingMonth))].sort().reverse();
    return months;
  }, [myLogs]);

  // Active selected month (default to first available)
  const activeBillingMonth = selectedBillingMonth || billingMonths[0] || "";

  // Logs for selected month
  const monthLogs = useMemo(
    () => myLogs.filter((log) => !activeBillingMonth || log.billingMonth === activeBillingMonth),
    [myLogs, activeBillingMonth]
  );

  // Bill for the selected month
  const myBills = (storedBills || []).filter((b) => b.studentId === user?.id);
  const activeBill = myBills.find((b) => b.billingMonth === activeBillingMonth);

  // Compute running total from logs for selected month
  const monthOneWay = monthLogs.filter((l) => (l.tripType || "").toLowerCase() === "one way").length;
  const monthTwoWay = monthLogs.filter((l) => (l.tripType || "").toLowerCase() === "two way").length;
  const monthTotal = monthOneWay * 250 + monthTwoWay * 400;

  useEffect(() => {
    if (isMockMode || !user?.id) return undefined;
    let cancelled = false;
    Promise.all([transportService.listTrips(tripDate), transportService.listStudentTickets(user.id)])
      .then(([loadedTrips, loadedTickets]) => {
        if (cancelled) return;
        setRequestError("");
        setRemoteTrips(loadedTrips);
        setRemoteTickets(loadedTickets);
      })
      .catch((error) => {
        if (!cancelled)
          setRequestError(
            error.response?.data?.message || error.message || "Could not load trips and tickets."
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripDate, user?.id]);

  const fareAmount = tripType === "Two Way" ? 400 : 250;

  const submit = async (event) => {
    event.preventDefault();
    if (blocked) {
      toast.error(
        student?.feeStatus !== "Paid"
          ? "Unpaid transport fees block new bookings."
          : "Clear unpaid fines before requesting another ticket."
      );
      return;
    }
    if (hasActiveRequest) {
      toast.error("You already have a pending or active ticket for an upcoming trip.");
      return;
    }
    if (!selectedScheduleId || !routeId || !stopId) {
      toast.error("Choose an available schedule, route, and drop-off stop.");
      return;
    }
    setSubmitting(true);
    try {
      await transportService.createBooking({
        userId: user.id,
        userName: user.name,
        identifier: user.rollNo || user.loginId,
        routeId,
        tripId: tripId || `TRIP-${selectedScheduleId}-${tripDate}`,
        scheduleId: selectedScheduleId,
        serviceType: activeSchedule?.serviceType || "REGULAR_MORNING",
        date: tripDate,
        stopId,
        tripType,
        fareType: "FULL",
        amount: fareAmount,
      });
      if (!isMockMode) {
        const [loadedTrips, loadedTickets] = await Promise.all([
          transportService.listTrips(tripDate),
          transportService.listStudentTickets(user.id),
        ]);
        setRemoteTrips(loadedTrips);
        setRemoteTickets(loadedTickets);
      }
      toast.success("Booking request sent to Admin for approval.");
      setStopId("");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to submit booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hostelite Transport</h1>
        <p className="text-sm text-muted-foreground">
          Select an active transport schedule, book trips, view your transport history, and review monthly bills.
        </p>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-3 text-sm text-muted-foreground">
            Loading available schedules and passes…
          </CardContent>
        </Card>
      )}
      {requestError && (
        <Card className="border-destructive/40">
          <CardContent className="p-3 text-sm text-destructive">
            Could not load backend data: {requestError}
          </CardContent>
        </Card>
      )}
      {blocked && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">
            {student?.feeStatus !== "Paid"
              ? "Your transport fee is unpaid. New bookings are blocked until it is cleared."
              : "Your account has an unpaid fine. New bookings are blocked until payment is cleared."}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="book">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="book">
            <CalendarRange className="mr-1.5 h-4 w-4" />
            Book Schedule
          </TabsTrigger>
          <TabsTrigger value="history">
            <ClipboardList className="mr-1.5 h-4 w-4" />
            Transport Log
          </TabsTrigger>
          <TabsTrigger value="bill">
            <Receipt className="mr-1.5 h-4 w-4" />
            Monthly Bill
          </TabsTrigger>
        </TabsList>

        {/* ── BOOK TAB ── */}
        <TabsContent value="book" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Request a trip from available schedules</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {availableSchedulesForDate.length} active service(s) on selected date
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Date Picker */}
                  <div className="space-y-1.5">
                    <Label htmlFor="booking-date">Select Travel Date</Label>
                    <Input
                      id="booking-date"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={tripDate}
                      onChange={(event) => {
                        setTripDate(event.target.value);
                        setSelectedScheduleId("");
                        setRouteId("");
                        setStopId("");
                      }}
                      required
                    />
                  </div>

                  {/* Schedule Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="booking-schedule">Available Schedule / Service</Label>
                    <Select
                      value={selectedScheduleId}
                      onValueChange={(val) => {
                        setSelectedScheduleId(val);
                        setStopId("");
                        setStopSearch("");
                      }}
                    >
                      <SelectTrigger id="booking-schedule">
                        <SelectValue
                          placeholder={
                            availableSchedulesForDate.length
                              ? "Choose available schedule"
                              : "No service scheduled on this date"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSchedulesForDate.map((sch) => {
                          const routeObj = routes.find((r) => r.id === sch.routeId);
                          return (
                            <SelectItem key={sch.id} value={sch.id}>
                              {sch.departureTime} · {routeObj?.shortName || sch.routeId} (
                              {SERVICE_TYPE_LABELS[sch.serviceType] || sch.serviceType})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Schedule Details Card */}
                  {activeSchedule && (
                    <div className="sm:col-span-2 rounded-lg border border-border bg-secondary/20 p-3 text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {route?.name || route?.shortName}
                          </span>
                          <Badge variant={SERVICE_TYPE_BADGES[activeSchedule.serviceType] || "secondary"}>
                            {SERVICE_TYPE_LABELS[activeSchedule.serviceType] || activeSchedule.serviceType}
                          </Badge>
                        </div>
                        <span className="font-semibold text-primary text-sm flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Departs: {activeSchedule.departureTime}
                          {activeSchedule.arrivalTime && ` · ETA: ${activeSchedule.arrivalTime}`}
                        </span>
                      </div>
                      {activeSchedule.notes && (
                        <p className="text-muted-foreground italic flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-amber-500" /> {activeSchedule.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Trip Type (One Way / Two Way) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="booking-trip-type">Trip Type &amp; Rate</Label>
                    <Select value={tripType} onValueChange={setTripType}>
                      <SelectTrigger id="booking-trip-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="One Way">One Way · Rs. 250</SelectItem>
                        <SelectItem value="Two Way">Two Way · Rs. 400</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Stop Selection */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="stop-search">Search Drop-off / Boarding Stop</Label>
                    <Input
                      id="stop-search"
                      value={stopSearch}
                      onChange={(event) => {
                        setStopSearch(event.target.value);
                        setStopId("");
                      }}
                      placeholder="Type a stop name to search"
                      disabled={!route}
                    />
                    <div className="max-h-36 overflow-y-auto rounded-md border border-border">
                      {!route && (
                        <p className="p-3 text-sm text-muted-foreground">
                          Choose an active schedule above to see its stops.
                        </p>
                      )}
                      {route &&
                        filteredStops.map((stop) => (
                          <button
                            key={stop.name}
                            type="button"
                            onClick={() => {
                              setStopId(stop.name);
                              setStopSearch(stop.name);
                            }}
                            className={`block w-full px-3 py-2 text-left text-sm hover:bg-secondary ${
                              stopId === stop.name ? "bg-primary/10 font-medium text-primary" : ""
                            }`}
                          >
                            <span className="font-medium">{stop.name}</span>
                            {stop.eta && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (ETA: {stop.eta})
                              </span>
                            )}
                          </button>
                        ))}
                      {route && !filteredStops.length && (
                        <p className="p-3 text-sm text-muted-foreground">No matching stops.</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {stopId ? `Selected Stop: ${stopId}` : "Select a stop from the list above."}
                    </p>
                  </div>
                </div>

                {/* Fare summary */}
                <div className="rounded-md bg-primary/5 p-3 text-sm flex items-center justify-between">
                  <span>
                    <span className="font-medium">Fare:</span> Rs. {fareAmount.toLocaleString()} · {tripType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Billed monthly upon Admin approval
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || blocked || hasActiveRequest || !selectedScheduleId || !stopId}
                >
                  {submitting ? "Submitting request…" : "Request Booking"}
                </Button>
                {hasActiveRequest && (
                  <p className="text-xs text-muted-foreground">
                    An active or pending booking already exists. Book after the current request completes.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Student's Active & Past Passes */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">My Passes &amp; Requests</h2>
            {!myTickets.length && (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No ticket requests yet. Select a schedule above to request your first pass.
                </CardContent>
              </Card>
            )}
            {myTickets.map((ticket) => {
              const assignedBus = buses.find((bus) => bus.id === ticket.busId);
              const routeForTicket = routes.find((item) => item.id === ticket.routeId);
              return (
                <Card key={ticket.id} className={ticket.status === "USED" ? "opacity-60" : ""}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {routeForTicket?.shortName || routeForTicket?.name}
                        </h3>
                        <Badge variant={badgeVariants[ticket.status] || "secondary"}>
                          {ticket.status.replaceAll("_", " ")}
                        </Badge>
                        {ticket.serviceType && (
                          <Badge variant={SERVICE_TYPE_BADGES[ticket.serviceType] || "outline"} className="text-xs">
                            {SERVICE_TYPE_LABELS[ticket.serviceType] || ticket.serviceType}
                          </Badge>
                        )}
                        {ticket.tripType && (
                          <Badge variant="outline" className="text-xs">
                            {ticket.tripType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ticket.date} · {ticket.stopId} · Rs.{" "}
                        {(ticket.amount || (ticket.tripType === "Two Way" ? 400 : 250)).toLocaleString()} ·{" "}
                        {assignedBus?.plate || "Bus pending"}
                      </p>
                      {ticket.status === "REJECTED" && (
                        <p className="text-sm text-destructive">Reason: {ticket.rejectionReason}</p>
                      )}
                      {ticket.status === "PASS_ISSUED" && ticket.expiresAt && (
                        <p className="text-xs font-medium text-primary">
                          <TripCountdown expiresAt={ticket.expiresAt} />
                        </p>
                      )}
                      {ticket.status === "USED" && (
                        <p className="text-xs text-muted-foreground">
                          Used {ticket.scannedAt ? new Date(ticket.scannedAt).toLocaleString() : ""}.
                        </p>
                      )}
                    </div>
                    {ticket.status === "PASS_ISSUED" && ticket.qrToken && (
                      <div className="mx-auto rounded-lg bg-white p-2 sm:mx-0">
                        <QRCodeSVG
                          value={ticket.qrToken}
                          size={144}
                          level="M"
                          includeMargin
                          aria-label={`Single-use boarding pass QR for ${ticket.identifier}`}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </TabsContent>

        {/* ── TRANSPORT LOG TAB ── */}
        <TabsContent value="history" className="space-y-4 pt-4">
          <div>
            <h2 className="text-lg font-semibold">Transport History</h2>
            <p className="text-sm text-muted-foreground">
              Only admin-approved bookings appear here. These entries form the basis of your monthly transport bill.
            </p>
          </div>

          {/* Month filter */}
          {billingMonths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBillingMonth("")}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  !selectedBillingMonth
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-secondary"
                }`}
              >
                All months
              </button>
              {billingMonths.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedBillingMonth(m)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    selectedBillingMonth === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-secondary"
                  }`}
                >
                  {formatMonth(m)}
                </button>
              ))}
            </div>
          )}

          {myLogs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No approved transport bookings recorded yet.
              </CardContent>
            </Card>
          ) : (
            <>
              {activeBillingMonth && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-foreground">
                      {formatMonth(activeBillingMonth)} summary
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-3 text-center text-xs">
                      <div>
                        <p className="text-muted-foreground">One Way</p>
                        <p className="text-lg font-bold">{monthOneWay}</p>
                        <p className="text-muted-foreground">× Rs. 250</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Two Way</p>
                        <p className="text-lg font-bold">{monthTwoWay}</p>
                        <p className="text-muted-foreground">× Rs. 400</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-primary">Rs. {monthTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">ID</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Route</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Bus</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Trip Type</th>
                      <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Fare</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Approved At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{log.bookingId}</td>
                        <td className="px-3 py-2">{log.date}</td>
                        <td className="px-3 py-2">{log.routeName || log.routeId}</td>
                        <td className="px-3 py-2 text-muted-foreground">{log.busPlate || log.busId || "—"}</td>
                        <td className="px-3 py-2">
                          <Badge variant={log.tripType === "Two Way" ? "accent" : "secondary"} className="text-xs">
                            {log.tripType}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">Rs. {(log.fare || 0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {log.approvedAt ? new Date(log.approvedAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── MONTHLY BILL TAB ── */}
        <TabsContent value="bill" className="space-y-4 pt-4">
          <div>
            <h2 className="text-lg font-semibold">Monthly Transport Bill</h2>
            <p className="text-sm text-muted-foreground">
              Bills are generated from admin-approved bookings. Only approved trips are charged.
            </p>
          </div>

          {/* Month picker */}
          {billingMonths.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="bill-month-select">Select billing month</Label>
              <Select value={activeBillingMonth} onValueChange={setSelectedBillingMonth}>
                <SelectTrigger id="bill-month-select" className="w-60">
                  <SelectValue placeholder="Choose month" />
                </SelectTrigger>
                <SelectContent>
                  {billingMonths.map((m) => (
                    <SelectItem key={m} value={m}>
                      {formatMonth(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {billingMonths.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No approved bookings yet. Bills are generated once you have approved trips.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" />
                      Hostel Transport Bill
                    </CardTitle>
                    {activeBill && (
                      <Badge variant={BILL_STATUS_VARIANT[activeBill.status] || "secondary"}>
                        {activeBill.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Month: <strong>{formatMonth(activeBillingMonth)}</strong>
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-secondary/30 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Student</span>
                      <span className="font-medium">
                        {student?.name || user?.name} ({student?.rollNo || user?.rollNo || user?.loginId})
                      </span>
                    </div>
                    <div className="border-t border-border my-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">One Way trips</span>
                      <span>
                        {monthOneWay} × Rs. 250 = <strong>Rs. {(monthOneWay * 250).toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Two Way trips</span>
                      <span>
                        {monthTwoWay} × Rs. 400 = <strong>Rs. {(monthTwoWay * 400).toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="border-t border-border my-2" />
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span>Total</span>
                      <span className="text-primary text-base">Rs. {monthTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {monthTotal === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No approved trips for this month. Bill is Rs. 0.
                    </p>
                  )}

                  {/* Breakdown table */}
                  {monthLogs.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Approved trips included:</p>
                      <div className="overflow-x-auto rounded-md border border-border">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border bg-secondary/30">
                              <th className="px-2 py-2 text-left font-medium text-muted-foreground">Date</th>
                              <th className="px-2 py-2 text-left font-medium text-muted-foreground">Route</th>
                              <th className="px-2 py-2 text-left font-medium text-muted-foreground">Type</th>
                              <th className="px-2 py-2 text-right font-medium text-muted-foreground">Fare</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthLogs.map((log) => (
                              <tr key={log.id} className="border-b border-border last:border-0">
                                <td className="px-2 py-1.5">{log.date}</td>
                                <td className="px-2 py-1.5">{log.routeName || log.routeId}</td>
                                <td className="px-2 py-1.5">
                                  <Badge variant={log.tripType === "Two Way" ? "accent" : "secondary"} className="text-xs">
                                    {log.tripType}
                                  </Badge>
                                </td>
                                <td className="px-2 py-1.5 text-right">Rs. {(log.fare || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Other months */}
              {myBills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">All billing months:</p>
                  <div className="space-y-2">
                    {myBills.map((bill) => (
                      <button
                        key={bill.id}
                        onClick={() => setSelectedBillingMonth(bill.billingMonth)}
                        className="w-full flex items-center justify-between rounded-md border border-border p-3 text-left hover:bg-secondary/40 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{bill.monthLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {bill.totalTrips} trips · {bill.oneWayCount} one-way · {bill.twoWayCount} two-way
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">Rs. {bill.totalAmount.toLocaleString()}</p>
                          <Badge variant={BILL_STATUS_VARIANT[bill.status] || "secondary"} className="text-xs mt-1">
                            {bill.status}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
