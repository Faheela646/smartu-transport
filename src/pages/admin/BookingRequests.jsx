import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFleetStore } from "@/store/useFleetStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { isMockMode, transportService } from "@/api/transportService";

const badgeVariant = {
  REQUESTED: "warning",
  APPROVED: "accent",
  PASS_ISSUED: "success",
  USED: "secondary",
  REJECTED: "destructive",
  EXPIRED: "secondary",
};

export default function BookingRequests() {
  const { routes, buses } = useFleetStore();
  const storedRequests = useTransportWorkflowStore((state) => state.bookingTickets);
  const storedTrips = useTransportWorkflowStore((state) => state.trips);
  const [remoteRequests, setRemoteRequests] = useState(null);
  const [remoteTrips, setRemoteTrips] = useState(null);
  const [loading, setLoading] = useState(!isMockMode);
  const [loadError, setLoadError] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignments, setAssignments] = useState({});
  const [selected, setSelected] = useState([]);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const requests = remoteRequests ?? storedRequests;
  const trips = remoteTrips ?? storedTrips;

  const refreshRemoteData = async () => {
    if (isMockMode) return;
    const filters = {
      ...(routeFilter !== "all" ? { routeId: routeFilter } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    };
    const [loadedRequests, loadedTrips] = await Promise.all([
      transportService.listBookingRequests(filters),
      transportService.listTrips(dateFilter || undefined),
    ]);
    setRemoteRequests(loadedRequests);
    setRemoteTrips(loadedTrips);
  };

  useEffect(() => {
    if (isMockMode) return undefined;
    let cancelled = false;
    Promise.all([
      transportService.listBookingRequests({
        ...(routeFilter !== "all" ? { routeId: routeFilter } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      }),
      transportService.listTrips(dateFilter || undefined),
    ]).then(([loadedRequests, loadedTrips]) => {
      if (!cancelled) {
        setLoadError("");
        setRemoteRequests(loadedRequests);
        setRemoteTrips(loadedTrips);
      }
    }).catch((error) => {
      if (!cancelled) setLoadError(error.response?.data?.message || error.message || "Could not load backend booking data.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [routeFilter, dateFilter, statusFilter]);

  const visible = useMemo(() => requests.filter((request) =>
    (routeFilter === "all" || request.routeId === routeFilter)
    && (!dateFilter || request.date === dateFilter)
    && (statusFilter === "all" || request.status === statusFilter)
  ), [requests, routeFilter, dateFilter, statusFilter]);

  const assignmentFor = (request) => {
    const saved = assignments[request.id] || {};
    const tripsForRequest = trips.filter((trip) => trip.routeId === request.routeId && trip.date === request.date);
    const trip = tripsForRequest.find((item) => item.id === saved.tripId) || tripsForRequest[0];
    return {
      busId: saved.busId || trip?.busId || "",
      tripId: saved.tripId || trip?.id || "",
      seatType: saved.seatType || (request.fareType === "HALF" ? "STANDING" : "SEATED"),
      trips: tripsForRequest,
    };
  };

  const approve = async (request) => {
    const { trips: _trips, ...assignment } = assignmentFor(request);
    const result = await transportService.approveBooking(request.id, assignment);
    if (!result.success) {
      toast.error(result.error || "Could not approve booking.");
      return false;
    }
    try {
      await refreshRemoteData();
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "Approval succeeded, but booking data could not be refreshed.");
    }
    toast.success(`Pass issued for ${request.identifier}.`);
    return true;
  };

  const bulkApprove = async () => {
    let approved = 0;
    for (const id of selected) {
      const request = requests.find((item) => item.id === id);
      if (request?.status === "REQUESTED" && await approve(request)) approved += 1;
    }
    setSelected([]);
    if (approved) toast.success(`${approved} booking request${approved === 1 ? "" : "s"} approved.`);
  };

  const reject = async () => {
    if (!rejecting || reason.trim().length < 4) return;
    const result = await transportService.rejectBooking(rejecting.id, reason.trim());
    if (!result.success) {
      toast.error(result.error || "Could not reject booking.");
      return;
    }
    try {
      await refreshRemoteData();
    } catch (error) {
      setLoadError(error.response?.data?.message || error.message || "Rejection succeeded, but booking data could not be refreshed.");
    }
    toast.success(`Request rejected for ${rejecting.identifier}.`);
    setRejecting(null);
    setReason("");
  };

  const updateAssignment = (id, key, value) =>
    setAssignments((state) => ({ ...state, [id]: { ...state[id], [key]: value } }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Booking Requests</h1>
        <p className="text-sm text-muted-foreground">Review hostelite trip requests, assign available capacity, and issue trip-bound QR passes.</p>
      </div>

      {loading && <Card><CardContent className="p-3 text-sm text-muted-foreground">Loading backend requests…</CardContent></Card>}
      {loadError && <Card className="border-destructive/40"><CardContent className="p-3 text-sm text-destructive">Backend data error: {loadError}</CardContent></Card>}

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="booking-route-filter">Route</Label>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger id="booking-route-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All routes</SelectItem>
                {routes.map((route) => <SelectItem key={route.id} value={route.id}>{route.shortName || route.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="booking-date-filter">Trip date</Label>
            <Input id="booking-date-filter" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="booking-status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="booking-status-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.keys(badgeVariant).map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {visible.some((request) => request.status === "REQUESTED") && (
        <div className="flex items-center justify-between gap-3">
          <Label className="flex items-center gap-2">
            <input aria-label="Select all pending requests" type="checkbox"
              checked={visible.filter((item) => item.status === "REQUESTED").every((item) => selected.includes(item.id))}
              onChange={(event) => setSelected(event.target.checked
                ? visible.filter((item) => item.status === "REQUESTED").map((item) => item.id)
                : [])} />
            Select pending requests
          </Label>
          <Button size="sm" disabled={!selected.length} onClick={bulkApprove}>Bulk approve &amp; issue passes ({selected.length})</Button>
        </div>
      )}

      {visible.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No booking requests match these filters.</CardContent></Card>}
      {visible.map((request) => {
        const assignment = assignmentFor(request);
        const bus = buses.find((item) => item.id === request.busId);
        const route = routes.find((item) => item.id === request.routeId);
        return (
          <Card key={request.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{request.userName} <span className="font-mono text-sm text-muted-foreground">· {request.identifier}</span></CardTitle>
                  {request.serviceType && (
                    <Badge variant={request.serviceType === "REGULAR_MORNING" ? "success" : request.serviceType === "REGULAR_RETURN" ? "accent" : request.serviceType === "SPECIAL_SHUTTLE" ? "warning" : "destructive"} className="text-[10px]">
                      {request.serviceType.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{route?.shortName || route?.name} · {request.date} · {request.stopId} · {request.tripType || (request.fareType === "HALF" ? "One Way (Half)" : "One Way")} · Rs. {(request.amount || (request.tripType === "Two Way" ? 400 : 250)).toLocaleString()}</p>
              </div>
              <Badge variant={badgeVariant[request.status] || "secondary"}>{request.status.replaceAll("_", " ")}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.status === "REQUESTED" ? (
                <>
                  <Label className="flex items-center gap-2">
                    <input type="checkbox" checked={selected.includes(request.id)} onChange={(event) => setSelected((current) =>
                      event.target.checked ? [...current, request.id] : current.filter((id) => id !== request.id))} />
                    Include in bulk approval
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`trip-${request.id}`}>Assigned trip</Label>
                      <Select value={assignment.tripId} onValueChange={(value) => updateAssignment(request.id, "tripId", value)}>
                        <SelectTrigger id={`trip-${request.id}`}><SelectValue placeholder="Choose trip" /></SelectTrigger>
                        <SelectContent>
                          {assignment.trips.map((trip) => <SelectItem key={trip.id} value={trip.id}>{trip.departureTime} · {trip.status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`bus-${request.id}`}>Bus</Label>
                      <Select value={assignment.busId} onValueChange={(value) => updateAssignment(request.id, "busId", value)}>
                        <SelectTrigger id={`bus-${request.id}`}><SelectValue placeholder="Choose bus" /></SelectTrigger>
                        <SelectContent>{buses.filter((item) => item.routeId === request.routeId || item.status === "Reserve").map((item) =>
                          <SelectItem key={item.id} value={item.id}>{item.plate} · {item.capacity} seats</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`seat-${request.id}`}>Seat type</Label>
                      <Select value={assignment.seatType} onValueChange={(value) => updateAssignment(request.id, "seatType", value)}>
                        <SelectTrigger id={`seat-${request.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="SEATED">Seated</SelectItem><SelectItem value="STANDING">Standing</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => approve(request)}>Approve &amp; issue QR pass</Button>
                    <Button variant="outline" onClick={() => setRejecting(request)}>Reject</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {bus ? `${bus.plate} · ${request.seatType || "—"} · ${request.tripId}` : request.rejectionReason || request.tripId || "No trip assignment"}
                  </p>
                  {["APPROVED", "PASS_ISSUED"].includes(request.status) && (
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="w-full max-w-xs space-y-1.5">
                        <Label htmlFor={`reassign-${request.id}`}>Reassign trip bus</Label>
                        <Select value={assignment.busId} onValueChange={(busId) => updateAssignment(request.id, "busId", busId)}>
                          <SelectTrigger id={`reassign-${request.id}`}><SelectValue placeholder="Select a bus" /></SelectTrigger>
                          <SelectContent>{buses.filter((item) => item.routeId === request.routeId || item.status === "Reserve").map((item) =>
                            <SelectItem key={item.id} value={item.id}>{item.plate} · {item.status}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" variant="outline" disabled={!assignment.busId || assignment.busId === bus?.id} onClick={async () => {
                        const result = await transportService.reassignBookingBus(request.tripId, assignment.busId);
                        if (result.success) {
                          toast.success("Trip bus and issued booking assignments updated.");
                          try { await refreshRemoteData(); } catch (error) { setLoadError(error.message); }
                        }
                        else toast.error(result.error || "Could not reassign the bus.");
                      }}>Save reassignment</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {rejecting && (
        <Card className="border-destructive/40">
          <CardHeader><CardTitle className="text-base">Reject request · {rejecting.identifier}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="rejection-reason">Reason</Label>
              <Input id="rejection-reason" value={reason} onChange={(event) => setReason(event.target.value)} required minLength={4} />
            </div>
            <div className="flex gap-2"><Button variant="destructive" disabled={reason.trim().length < 4} onClick={reject}>Confirm rejection</Button><Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
