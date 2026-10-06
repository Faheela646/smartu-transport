import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  WifiOff,
  Users,
  Info,
  Layers,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFleetStore } from "@/store/useFleetStore";
import { useMapStore } from "@/store/useMapStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";

// Custom leaflet icons
const busIcon = L.divIcon({
  className: "custom-bus-icon",
  html: `<div style="background-color: #2563eb; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(37,99,235,0.4); border: 2px solid white;">🚌</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const stopIcon = L.divIcon({
  className: "custom-stop-icon",
  html: `<div style="background-color: #10b981; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">📍</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const campusIcon = L.divIcon({
  className: "custom-campus-icon",
  html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 2px 8px rgba(239,68,68,0.4);">🏫</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function Transport() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "tracking";

  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  const [offlineSimulated, setOfflineSimulated] = useState(false);

  const user = useAuthStore((state) => state.user);
  const { routes, buses, drivers } = useFleetStore();
  const { getBusPosition, startSimulation, stopSimulation } = useMapStore();
  const student = useStudentStore((state) => state.students.find((record) => record.id === user?.id));
  const attendanceHistory = useAttendanceStore((state) => state.attendanceHistory);
  const tickets = useTransportWorkflowStore((state) => state.tickets);
  const activeTicket = tickets.find((ticket) =>
    ticket.userId === user?.id && ["Active", "HalfRedeemed"].includes(ticket.status)
  );
  const hasTransportAccess = user?.role === "HOSTELITE"
    ? Boolean(activeTicket)
    : student?.accountStatus === "Approved";
  const routeId = user?.role === "HOSTELITE" ? activeTicket?.routeId : student?.routeId;
  const selectedRoute = routes.find((route) => route.id === routeId) || routes[0];
  const assignedBus = buses.find((bus) => bus.id === selectedRoute?.busId);
  const assignedDriver = drivers.find((driver) => driver.id === selectedRoute?.driverId);
  const pickupStopName = user?.role === "HOSTELITE" ? activeTicket?.stopId : student?.pickupStop;
  const mapCenterStop = selectedRoute?.stops.find((stop) => stop.name === pickupStopName) || selectedRoute?.stops[0];

  // Start live simulation on mount, clean up on unmount
  useEffect(() => {
    if (!hasTransportAccess) return undefined;
    startSimulation();
    return () => stopSimulation();
  }, [hasTransportAccess, startSimulation, stopSimulation]);

  // Bus location state — derived from the map store's animated position
  const rawPos = getBusPosition(selectedRoute?.id);
  const busLocationData = rawPos ?? {
    lat: (selectedRoute?.stops[0]?.lat || 31.4504) + 0.005,
    lng: (selectedRoute?.stops[0]?.lng || 73.0782) - 0.002,
    speed: 38,
    heading: 45,
    lastUpdated: new Date().toLocaleTimeString(),
  };

  const polylineCoords = useMemo(
    () => selectedRoute?.stops.map((s) => [s.lat, s.lng]) || [],
    [selectedRoute]
  );

  // Seat capacity calculations
  const totalCapacity = assignedBus?.capacity || 0;
  const today = new Date().toISOString().slice(0, 10);
  const occupiedSeats = Math.min(totalCapacity, attendanceHistory.filter((record) =>
    (record.adate || record.date) === today && record.routeId === selectedRoute?.id
  ).length);
  const availableSeats = Math.max(0, totalCapacity - occupiedSeats);
  const occupancyPct = totalCapacity ? Math.round((occupiedSeats / totalCapacity) * 100) : 0;

  const getOccupancyBadge = (pct) => {
    if (pct < 70) return <Badge variant="success">Available Seats ({availableSeats})</Badge>;
    if (pct < 95) return <Badge variant="warning">Limited Seats ({availableSeats})</Badge>;
    return <Badge variant="destructive">Full Capacity</Badge>;
  };

  if (!hasTransportAccess) {
    const applicationPath = user?.role === "HOSTELITE" ? "/student/tickets" : "/student/semester";
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-semibold">No active transport assignment</p>
          <p className="text-sm text-muted-foreground">
            {user?.role === "HOSTELITE"
              ? "Request a ticket and wait for Admin approval before viewing its route."
              : "Submit your semester application and wait for Admin approval before viewing a route."}
          </p>
          <Button asChild><Link to={applicationPath}>{user?.role === "HOSTELITE" ? "Request ticket" : "Apply for semester transport"}</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (!selectedRoute || !assignedBus) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="font-semibold">Route or bus assignment unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">Contact the Transport Office to confirm your approved route assignment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Transport Route & Shuttle Demo</h1>
        <p className="text-sm text-muted-foreground">View your approved route and browser-simulated shuttle position. Live GPS is not connected.</p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="tracking">Live Map</TabsTrigger>
          <TabsTrigger value="route">My Route</TabsTrigger>
          <TabsTrigger value="seats">Seat Capacity</TabsTrigger>
        </TabsList>

        {/* SUBTAB 1: LIVE MAP TRACKING */}
        <TabsContent value="tracking" className="space-y-4 mt-4">
          {/* Offline simulator toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Network Mode:</span>
              <span className="text-muted-foreground">
                {offlineSimulated ? "Simulated Offline Mode" : "Local route simulation"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="offline-mode" className="text-xs cursor-pointer">Simulate Network Loss</Label>
              <Switch id="offline-mode" checked={offlineSimulated} onCheckedChange={setOfflineSimulated} />
            </div>
          </div>

          {offlineSimulated && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-400">
              <WifiOff className="h-4 w-4 shrink-0 text-amber-500" />
              <span>
                <strong>⚠️ Demo map mode:</strong> This browser is showing sample route/location data; live GPS is not connected.
              </span>
            </div>
          )}

          {/* Interactive Leaflet Map */}
          <Card className="overflow-hidden border-border">
            <div className="h-[380px] sm:h-[460px] w-full relative">
              <MapContainer
                center={[mapCenterStop?.lat || 31.4504, mapCenterStop?.lng || 73.0782]}
                zoom={13}
                className="h-full w-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Route Polyline */}
                <Polyline positions={polylineCoords} color="#2563eb" weight={5} opacity={0.8} />

                {/* Stop Markers */}
                {selectedRoute.stops.map((stop, index) => (
                  <Marker
                    key={index}
                    position={[stop.lat, stop.lng]}
                    icon={index === selectedRoute.stops.length - 1 ? campusIcon : stopIcon}
                  >
                    <Popup>
                      <div className="p-1 text-xs">
                        <p className="font-bold">{stop.name}</p>
                        <p className="text-muted-foreground">Scheduled: {stop.eta}</p>
                        {stop.name === pickupStopName && <span className="text-emerald-600 font-semibold">Your Pickup Stop</span>}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Moving Bus Marker */}
                {!offlineSimulated && (
                  <Marker position={[busLocationData.lat, busLocationData.lng]} icon={busIcon}>
                    <Popup>
                      <div className="p-1 text-xs space-y-1">
                        <p className="font-bold text-primary">{assignedBus.plate} ({assignedBus.id})</p>
                        <p>Route: {selectedRoute.shortName}</p>
                        <p>Speed: {busLocationData.speed} km/h</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* Overlay Bus Telemetry Box */}
              <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto z-10 max-w-sm rounded-xl border border-border/80 bg-background/95 p-3.5 backdrop-blur shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">{assignedBus.plate}</span>
                    <Badge variant={offlineSimulated ? "secondary" : "success"} className="text-[10px]">
                      {offlineSimulated ? "Simulated Offline" : "Browser Demo"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs border-t border-border/50 pt-2">
                  <div>
                    <span className="text-muted-foreground">Departure:</span>
                    <p className="font-bold text-foreground">{selectedRoute.departureTime}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Today's boardings:</span>
                    <p className="font-bold text-primary">{occupiedSeats}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SUBTAB 2: MY ROUTE DETAILS */}
        <TabsContent value="route" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold">{selectedRoute.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Route ID: {selectedRoute.id} • Assigned Bus: {assignedBus.plate}</p>
                </div>
                <Badge variant="accent">Assigned Route</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-secondary/30 p-3.5 border border-border">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Pickup Stop</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" /> {pickupStopName || "Not selected"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Departure Time</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {selectedRoute.departureTime}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Assigned Driver</span>
                  <p className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> {assignedDriver?.name || "Not assigned"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Today's Scheduled Services</h3>
                {(() => {
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const activeRouteSchedules = (useFleetStore.getState().getSchedulesForDate(todayStr, selectedRoute?.id) || []);
                  if (!activeRouteSchedules.length) {
                    return (
                      <p className="text-xs text-muted-foreground italic p-3 rounded bg-secondary/30">
                        No active service scheduled for today. Baseline morning departs at {selectedRoute.departureTime}.
                      </p>
                    );
                  }
                  return (
                    <div className="grid gap-2 sm:grid-cols-2 mb-4">
                      {activeRouteSchedules.map((sch) => (
                        <div key={sch.id} className="rounded-lg border border-border/80 bg-card p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{sch.title}</span>
                            <Badge variant={sch.serviceType === "REGULAR_MORNING" ? "success" : sch.serviceType === "REGULAR_RETURN" ? "accent" : sch.serviceType === "SPECIAL_SHUTTLE" ? "warning" : "destructive"} className="text-[10px]">
                              {sch.serviceType.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground pt-1">
                            <span className="font-bold text-primary text-sm">{sch.departureTime}</span>
                            {sch.arrivalTime && <span>ETA {sch.arrivalTime}</span>}
                          </div>
                          {sch.notes && <p className="text-[11px] text-muted-foreground italic">{sch.notes}</p>}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Stop Sequence & Baseline Timetable</h3>
                <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                  {selectedRoute.stops.map((stop, idx) => {
                    const isPickup = stop.name === pickupStopName;
                    return (
                      <div key={idx} className="flex items-center justify-between relative pl-8 text-sm">
                        <div
                          className={`absolute left-2 h-4 w-4 rounded-full border-2 border-background ${
                            isPickup ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-primary"
                          }`}
                        />
                        <div>
                          <p className={`font-medium ${isPickup ? "text-emerald-600 font-bold" : "text-foreground"}`}>
                            {stop.name} {isPickup && " (Your Pickup Stop)"}
                          </p>
                          <p className="text-xs text-muted-foreground">Stop #{idx + 1}</p>
                        </div>
                        <Badge variant={isPickup ? "success" : "outline"} className="text-xs">
                          {stop.eta}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBTAB 3: SEAT AVAILABILITY (VIEW ONLY) */}
        <TabsContent value="seats" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Live Seat Capacity</CardTitle>
                  <p className="text-xs text-muted-foreground">View-only seating status updated via conductor RFID/QR boarding scans.</p>
                </div>
                {getOccupancyBadge(occupancyPct)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-border p-4 bg-card/60 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{assignedBus.model} ({assignedBus.plate})</span>
                  <span className="text-muted-foreground">{occupiedSeats} / {totalCapacity} seats occupied</span>
                </div>
                <Progress value={occupancyPct} className="h-3" />
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>0 (Empty)</span>
                  <span className="font-bold text-foreground">{occupancyPct}% Occupancy</span>
                  <span>{totalCapacity} (Full)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                  <p className="text-2xl font-extrabold text-emerald-600">{availableSeats}</p>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-1">Available Seats</p>
                </div>

                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
                  <p className="text-2xl font-extrabold text-blue-600">{occupiedSeats}</p>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mt-1">Occupied Seats</p>
                </div>

                <div className="rounded-xl bg-secondary/60 border border-border p-4 text-center">
                  <p className="text-2xl font-extrabold text-foreground">{totalCapacity}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Total Capacity</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-secondary/40 p-3.5 border border-border text-xs text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Day Scholar Seat Policy:</strong> Seat availability for day scholars is provided as a live view-only feature. Online seat booking reservations are strictly reserved for hostelite users.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
