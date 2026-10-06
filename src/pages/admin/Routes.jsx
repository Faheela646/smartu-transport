import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  MapPin,
  Bus as BusIcon,
  UserCog,
  Clock,
  Trash2,
  CalendarRange,
  Route as RouteIcon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  Power,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFleetStore } from "@/store/useFleetStore";
import {
  CAMPUS_CENTER,
  SCHEDULE_TYPES,
  RECURRENCE_TYPES,
} from "@/data/mockData";

const SERVICE_TYPE_LABELS = {
  [SCHEDULE_TYPES.REGULAR_MORNING]: "Regular Morning",
  [SCHEDULE_TYPES.REGULAR_RETURN]: "Regular Return",
  [SCHEDULE_TYPES.SPECIAL_SHUTTLE]: "Special Shuttle",
  [SCHEDULE_TYPES.EVENT_SHUTTLE]: "Event Shuttle",
};

const SERVICE_TYPE_BADGES = {
  [SCHEDULE_TYPES.REGULAR_MORNING]: "success",
  [SCHEDULE_TYPES.REGULAR_RETURN]: "accent",
  [SCHEDULE_TYPES.SPECIAL_SHUTTLE]: "warning",
  [SCHEDULE_TYPES.EVENT_SHUTTLE]: "destructive",
};

const RECURRENCE_LABELS = {
  [RECURRENCE_TYPES.WEEKDAYS]: "Mon – Fri (Weekdays)",
  [RECURRENCE_TYPES.DAILY]: "Daily (7 Days)",
  [RECURRENCE_TYPES.FRIDAY_ONLY]: "Friday Only",
  [RECURRENCE_TYPES.SPECIFIC_DATE]: "Specific Date",
  [RECURRENCE_TYPES.DATE_RANGE]: "Date Range",
  [RECURRENCE_TYPES.EVENT]: "Event Specific Date",
};

export default function AdminRoutes() {
  const {
    routes,
    buses,
    drivers,
    conductors,
    stops,
    schedules,
    addRoute,
    updateRoute,
    deleteRoute,
    addStop,
    updateStop,
    deleteStop,
    addRouteStop,
    updateRouteStop,
    removeRouteStop,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus,
    validateBusConflict,
  } = useFleetStore();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState("schedules");

  // Schedule Filter State
  const [scheduleRouteFilter, setScheduleRouteFilter] = useState("all");
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState("all");
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState("all");
  const [scheduleSearch, setScheduleSearch] = useState("");

  // Schedule Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    routeId: "",
    title: "",
    serviceType: SCHEDULE_TYPES.REGULAR_MORNING,
    recurrence: RECURRENCE_TYPES.WEEKDAYS,
    departureTime: "7:15 AM",
    arrivalTime: "8:25 AM",
    specificDate: "",
    startDate: "",
    endDate: "",
    busId: "",
    driverId: "",
    conductorId: "",
    status: "ACTIVE",
    notes: "",
  });
  const [busConflictWarning, setBusConflictWarning] = useState("");

  // Route Modal State
  const [addRouteOpen, setAddRouteOpen] = useState(false);
  const [stopName, setStopName] = useState("");
  const [selectedStopByRoute, setSelectedStopByRoute] = useState({});
  const [routeForm, setRouteForm] = useState({
    name: "",
    shortName: "",
    departureTime: "7:15 AM",
    stopsText: "",
    busId: "",
    driverId: "",
    conductorId: "",
  });

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return (schedules || []).filter((sch) => {
      if (scheduleRouteFilter !== "all" && sch.routeId !== scheduleRouteFilter) return false;
      if (scheduleTypeFilter !== "all" && sch.serviceType !== scheduleTypeFilter) return false;
      if (scheduleStatusFilter !== "all" && sch.status !== scheduleStatusFilter) return false;
      if (scheduleSearch) {
        const query = scheduleSearch.toLowerCase();
        const routeObj = routes.find((r) => r.id === sch.routeId);
        const titleMatch = (sch.title || "").toLowerCase().includes(query);
        const routeMatch = (routeObj?.name || routeObj?.shortName || "").toLowerCase().includes(query);
        const notesMatch = (sch.notes || "").toLowerCase().includes(query);
        const timeMatch = (sch.departureTime || "").toLowerCase().includes(query);
        if (!titleMatch && !routeMatch && !notesMatch && !timeMatch) return false;
      }
      return true;
    });
  }, [schedules, scheduleRouteFilter, scheduleTypeFilter, scheduleStatusFilter, scheduleSearch, routes]);

  // Summary counts
  const morningCount = useMemo(
    () => (schedules || []).filter((s) => s.serviceType === SCHEDULE_TYPES.REGULAR_MORNING && s.status === "ACTIVE").length,
    [schedules]
  );
  const returnCount = useMemo(
    () => (schedules || []).filter((s) => s.serviceType === SCHEDULE_TYPES.REGULAR_RETURN && s.status === "ACTIVE").length,
    [schedules]
  );
  const specialCount = useMemo(
    () =>
      (schedules || []).filter(
        (s) =>
          (s.serviceType === SCHEDULE_TYPES.SPECIAL_SHUTTLE || s.serviceType === SCHEDULE_TYPES.EVENT_SHUTTLE) &&
          s.status === "ACTIVE"
      ).length,
    [schedules]
  );

  // Check bus conflict live as admin changes schedule form
  const handleScheduleBusOrTimeChange = (updatedPatch) => {
    const candidate = { ...scheduleForm, ...updatedPatch };
    setScheduleForm(candidate);
    if (candidate.busId && candidate.departureTime) {
      const conflict = validateBusConflict(candidate.busId, candidate, editingScheduleId);
      if (conflict.hasConflict) {
        setBusConflictWarning(conflict.message);
      } else {
        setBusConflictWarning("");
      }
    } else {
      setBusConflictWarning("");
    }
  };

  const openCreateScheduleModal = () => {
    setEditingScheduleId(null);
    setBusConflictWarning("");
    setScheduleForm({
      routeId: routes[0]?.id || "RT-01",
      title: "",
      serviceType: SCHEDULE_TYPES.REGULAR_MORNING,
      recurrence: RECURRENCE_TYPES.WEEKDAYS,
      departureTime: "7:15 AM",
      arrivalTime: "8:25 AM",
      specificDate: "",
      startDate: "",
      endDate: "",
      busId: routes[0]?.busId || buses[0]?.id || "",
      driverId: routes[0]?.driverId || drivers[0]?.id || "",
      conductorId: routes[0]?.conductorId || conductors[0]?.id || "",
      status: "ACTIVE",
      notes: "",
    });
    setScheduleModalOpen(true);
  };

  const openEditScheduleModal = (schedule) => {
    setEditingScheduleId(schedule.id);
    setBusConflictWarning("");
    setScheduleForm({
      routeId: schedule.routeId || "",
      title: schedule.title || "",
      serviceType: schedule.serviceType || SCHEDULE_TYPES.REGULAR_MORNING,
      recurrence: schedule.recurrence || RECURRENCE_TYPES.WEEKDAYS,
      departureTime: schedule.departureTime || "",
      arrivalTime: schedule.arrivalTime || "",
      specificDate: schedule.specificDate || "",
      startDate: schedule.startDate || "",
      endDate: schedule.endDate || "",
      busId: schedule.busId || "",
      driverId: schedule.driverId || "",
      conductorId: schedule.conductorId || "",
      status: schedule.status || "ACTIVE",
      notes: schedule.notes || "",
    });
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    if (!scheduleForm.routeId) {
      toast.error("Please select a route.");
      return;
    }
    if (!scheduleForm.departureTime) {
      toast.error("Please enter a departure time.");
      return;
    }

    if (
      (scheduleForm.recurrence === RECURRENCE_TYPES.SPECIFIC_DATE || scheduleForm.recurrence === RECURRENCE_TYPES.EVENT) &&
      !scheduleForm.specificDate
    ) {
      toast.error("Please specify the date for this schedule.");
      return;
    }

    const payload = {
      ...scheduleForm,
      title:
        scheduleForm.title.trim() ||
        `${routes.find((r) => r.id === scheduleForm.routeId)?.shortName || "Route"} ${SERVICE_TYPE_LABELS[scheduleForm.serviceType] || "Schedule"}`,
    };

    if (editingScheduleId) {
      const res = updateSchedule(editingScheduleId, payload);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Schedule updated successfully.");
    } else {
      const res = addSchedule(payload);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("New schedule created.");
    }
    setScheduleModalOpen(false);
  };

  // Route handlers
  const handleAddRoute = (e) => {
    e.preventDefault();
    const routeStops = routeForm.stopsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => {
        const existingStop = stops.find((stop) => stop.name.toLowerCase() === name.toLowerCase());
        return {
          name,
          lat: existingStop?.lat || CAMPUS_CENTER.lat,
          lng: existingStop?.lng || CAMPUS_CENTER.lng,
          eta: routeForm.departureTime,
        };
      });

    routeStops.forEach((stop) => {
      if (!stops.some((existing) => existing.name.toLowerCase() === stop.name.toLowerCase())) {
        addStop(stop);
      }
    });

    addRoute({
      name: routeForm.name,
      shortName: routeForm.shortName || routeForm.name,
      departureTime: routeForm.departureTime,
      busId: routeForm.busId || null,
      driverId: routeForm.driverId || null,
      conductorId: routeForm.conductorId || null,
      stops: routeStops,
    });
    toast.success("Route created.");
    setAddRouteOpen(false);
    setRouteForm({
      name: "",
      shortName: "",
      departureTime: "7:15 AM",
      stopsText: "",
      busId: "",
      driverId: "",
      conductorId: "",
    });
  };

  const handleAddStop = (event) => {
    event.preventDefault();
    const result = addStop({ name: stopName });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Stop "${result.stop.name}" added to the global stop catalog.`);
    setStopName("");
  };

  const availableStops = (route) =>
    stops.filter((stop) => !route.stops.some((assigned) => assigned.name === stop.name));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <RouteIcon className="h-6 w-6 text-primary" />
            Transport Schedules &amp; Routes
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage dynamic university schedules, Friday shuttles, late-night event transport, and baseline route timetables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "schedules" ? (
            <Button onClick={openCreateScheduleModal} className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Create Schedule
            </Button>
          ) : (
            <Button onClick={() => setAddRouteOpen(true)} className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Create Route
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="schedules" className="gap-1.5">
            <CalendarRange className="h-4 w-4" />
            Schedules ({schedules.length})
          </TabsTrigger>
          <TabsTrigger value="routes" className="gap-1.5">
            <RouteIcon className="h-4 w-4" />
            Routes ({routes.length})
          </TabsTrigger>
          <TabsTrigger value="stops" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            Stops Catalog ({stops.length})
          </TabsTrigger>
        </TabsList>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: TRANSPORT SCHEDULES (Dynamic Admin Schedules)               */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="schedules" className="space-y-5">
          {/* Summary Stat Cards */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <Card className="bg-card/70 border-border/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Morning Services</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{morningCount}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Baseline Morning</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Return Services</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{returnCount}</p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400">5:00 PM+ Closing</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <BusIcon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Special &amp; Events</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{specialCount}</p>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400">Friday / Late-Night</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/80">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Schedules</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{schedules.length}</p>
                    <p className="text-[11px] text-muted-foreground">Active in System</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarRange className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Bar */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1 sm:col-span-1">
                  <Label htmlFor="sch-search" className="text-xs">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="sch-search"
                      placeholder="Search title, route, time…"
                      value={scheduleSearch}
                      onChange={(e) => setScheduleSearch(e.target.value)}
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sch-route" className="text-xs">Route</Label>
                  <Select value={scheduleRouteFilter} onValueChange={setScheduleRouteFilter}>
                    <SelectTrigger id="sch-route" className="h-9 text-xs">
                      <SelectValue placeholder="All routes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Routes</SelectItem>
                      {routes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.shortName || r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sch-type" className="text-xs">Service Type</Label>
                  <Select value={scheduleTypeFilter} onValueChange={setScheduleTypeFilter}>
                    <SelectTrigger id="sch-type" className="h-9 text-xs">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sch-status" className="text-xs">Status</Label>
                  <Select value={scheduleStatusFilter} onValueChange={setScheduleStatusFilter}>
                    <SelectTrigger id="sch-status" className="h-9 text-xs">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active Only</SelectItem>
                      <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Table */}
          {filteredSchedules.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No schedules match your current filters. Click &quot;Create Schedule&quot; to add one.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-xs">
                    <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground">Route &amp; Service</th>
                    <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground">Type</th>
                    <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground">Recurrence / Date</th>
                    <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground">Departure</th>
                    <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground">Assigned Bus</th>
                    <th className="px-3.5 py-3 text-left font-semibold text-muted-foreground">Staff</th>
                    <th className="px-3.5 py-3 text-center font-semibold text-muted-foreground">Status</th>
                    <th className="px-3.5 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSchedules.map((sch) => {
                    const route = routes.find((r) => r.id === sch.routeId);
                    const bus = buses.find((b) => b.id === sch.busId);
                    const driver = drivers.find((d) => d.id === sch.driverId);
                    const isInactive = sch.status === "INACTIVE";

                    return (
                      <tr
                        key={sch.id}
                        className={`transition-colors hover:bg-secondary/20 ${
                          isInactive ? "opacity-60 bg-muted/20" : ""
                        }`}
                      >
                        <td className="px-3.5 py-3">
                          <p className="font-semibold text-foreground">
                            {route?.shortName || route?.name || sch.routeId}
                          </p>
                          <p className="text-xs text-muted-foreground">{sch.title}</p>
                          {sch.notes && (
                            <p className="text-[11px] text-muted-foreground italic mt-0.5">{sch.notes}</p>
                          )}
                        </td>

                        <td className="px-3.5 py-3">
                          <Badge variant={SERVICE_TYPE_BADGES[sch.serviceType] || "secondary"} className="text-xs">
                            {SERVICE_TYPE_LABELS[sch.serviceType] || sch.serviceType}
                          </Badge>
                        </td>

                        <td className="px-3.5 py-3 text-xs">
                          <p className="font-medium text-foreground">
                            {RECURRENCE_LABELS[sch.recurrence] || sch.recurrence}
                          </p>
                          {sch.specificDate && (
                            <p className="text-muted-foreground font-mono mt-0.5">{sch.specificDate}</p>
                          )}
                          {sch.startDate && sch.endDate && (
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                              {sch.startDate} to {sch.endDate}
                            </p>
                          )}
                        </td>

                        <td className="px-3.5 py-3">
                          <span className="font-bold text-primary">{sch.departureTime}</span>
                          {sch.arrivalTime && (
                            <span className="text-xs text-muted-foreground block">
                              ETA {sch.arrivalTime}
                            </span>
                          )}
                        </td>

                        <td className="px-3.5 py-3 text-xs">
                          {bus ? (
                            <div>
                              <p className="font-medium text-foreground">{bus.plate}</p>
                              <p className="text-muted-foreground text-[11px]">{bus.capacity} seats ({bus.id})</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>

                        <td className="px-3.5 py-3 text-xs">
                          <p className="text-foreground">{driver?.name || "—"}</p>
                        </td>

                        <td className="px-3.5 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleScheduleStatus(sch.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                            title="Click to toggle status"
                          >
                            {sch.status === "ACTIVE" ? (
                              <Badge variant="success" className="gap-1 cursor-pointer">
                                <CheckCircle2 className="h-3 w-3" /> Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 cursor-pointer">
                                <XCircle className="h-3 w-3" /> Inactive
                              </Badge>
                            )}
                          </button>
                        </td>

                        <td className="px-3.5 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-foreground hover:bg-secondary"
                              onClick={() => openEditScheduleModal(sch)}
                              title="Edit schedule"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                if (window.confirm(`Delete schedule "${sch.title}"?`)) {
                                  deleteSchedule(sch.id);
                                  toast.success("Schedule deleted.");
                                }
                              }}
                              title="Delete schedule"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ROUTES & BASELINE TIMETABLES                                  */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="routes" className="space-y-4">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3.5 text-xs text-foreground flex items-center justify-between">
            <p>
              <strong>Baseline Route Timetable:</strong> These permanent route definitions define stops and default morning ETAs (Routes 01 – 16). Date-specific operations and shuttles are scheduled via the <strong>Schedules</strong> tab.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {routes.map((route) => (
              <Card key={route.id} className="border-border">
                <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base font-bold">{route.name}</CardTitle>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Baseline Morning: <strong>{route.departureTime}</strong>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                    onClick={() => {
                      if (window.confirm(`Delete route ${route.name}?`)) {
                        deleteRoute(route.id);
                        toast.success("Route removed.");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Default Fleet Assignments */}
                  <div className="grid grid-cols-3 gap-2 rounded-md bg-secondary/30 p-2.5">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <BusIcon className="h-3 w-3" /> Bus
                      </Label>
                      <Select
                        value={route.busId || ""}
                        onValueChange={(v) => updateRoute(route.id, { busId: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {buses.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.plate} ({b.capacity} seats)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <UserCog className="h-3 w-3" /> Driver
                      </Label>
                      <Select
                        value={route.driverId || ""}
                        onValueChange={(v) => updateRoute(route.id, { driverId: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <UserCog className="h-3 w-3" /> Conductor
                      </Label>
                      <Select
                        value={route.conductorId || ""}
                        onValueChange={(v) => updateRoute(route.id, { conductorId: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {conductors.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Stops Sequence */}
                  <div>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">Stop Sequence &amp; ETAs</p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {route.stops.map((stop, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-background p-1.5 rounded border border-border/60">
                          <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}.</span>
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="text-foreground text-xs font-medium truncate">{stop.name}</span>
                          <Input
                            aria-label={`${stop.name} arrival time`}
                            className="ml-auto h-7 w-24 px-2 text-xs"
                            value={stop.eta || ""}
                            onChange={(event) =>
                              updateRouteStop(route.id, stop.name, { eta: event.target.value })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => removeRouteStop(route.id, stop.name)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Select
                        value={selectedStopByRoute[route.id] || ""}
                        onValueChange={(value) =>
                          setSelectedStopByRoute((current) => ({ ...current, [route.id]: value }))
                        }
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Add stop from catalog" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStops(route).map((stop) => (
                            <SelectItem key={stop.id} value={stop.id}>
                              {stop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const result = addRouteStop(route.id, selectedStopByRoute[route.id]);
                          if (result.success) {
                            setSelectedStopByRoute((current) => ({ ...current, [route.id]: "" }));
                          } else {
                            toast.error(result.error);
                          }
                        }}
                      >
                        Add Stop
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: STOPS CATALOG                                                 */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="stops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Reusable Pickup Stops Catalog</CardTitle>
              <CardDescription>
                Manage all registered campus and city stops. Stops in this catalog can be attached to any route.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddStop} className="flex gap-2 max-w-md">
                <Input
                  value={stopName}
                  onChange={(event) => setStopName(event.target.value)}
                  placeholder="New stop name (e.g. Satiana Road Chowk)"
                  required
                  className="h-9 text-xs"
                />
                <Button type="submit" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Stop
                </Button>
              </form>

              <div className="flex flex-wrap gap-2 pt-2">
                {stops.map((stop) => (
                  <Badge key={stop.id} variant="outline" className="gap-2 py-1.5 px-3 text-xs bg-card">
                    <MapPin className="h-3 w-3 text-primary" />
                    {stop.name}
                    <button
                      type="button"
                      aria-label={`Rename ${stop.name}`}
                      className="text-primary underline ml-1 hover:text-primary/80"
                      onClick={() => {
                        const name = window.prompt("Edit Stop Name", stop.name);
                        if (name?.trim()) updateStop(stop.id, { name: name.trim() });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${stop.name}`}
                      className="text-destructive font-bold ml-1 hover:text-destructive/80"
                      onClick={() => {
                        if (window.confirm(`Delete ${stop.name} from the stop catalog and all routes?`)) {
                          deleteStop(stop.id);
                        }
                      }}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG: CREATE / EDIT SCHEDULE                                       */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" />
              {editingScheduleId ? "Edit Transport Schedule" : "Create Transport Schedule"}
            </DialogTitle>
            <DialogDescription>
              Configure operating times, service type, recurrence, and bus assignments. Any operating time (e.g. 2:00 PM, 5:00 PM, 10:30 PM, 11:30 PM) is supported.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSchedule} className="space-y-4">
            {/* Bus Conflict Alert */}
            {busConflictWarning && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{busConflictWarning}</span>
              </div>
            )}

            {/* Route & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-route">Route</Label>
                <Select
                  value={scheduleForm.routeId}
                  onValueChange={(v) => {
                    const selectedRoute = routes.find((r) => r.id === v);
                    handleScheduleBusOrTimeChange({
                      routeId: v,
                      busId: scheduleForm.busId || selectedRoute?.busId || "",
                      driverId: scheduleForm.driverId || selectedRoute?.driverId || "",
                      conductorId: scheduleForm.conductorId || selectedRoute?.conductorId || "",
                    });
                  }}
                >
                  <SelectTrigger id="modal-sch-route">
                    <SelectValue placeholder="Choose route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.shortName || r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-title">Schedule Title / Description</Label>
                <Input
                  id="modal-sch-title"
                  value={scheduleForm.title}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                  placeholder="e.g. Friday 2:00 PM City Shuttle"
                />
              </div>
            </div>

            {/* Service Type & Recurrence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-type">Service Type</Label>
                <Select
                  value={scheduleForm.serviceType}
                  onValueChange={(v) => {
                    let defaultTime = scheduleForm.departureTime;
                    let defaultRecurrence = scheduleForm.recurrence;
                    if (v === SCHEDULE_TYPES.REGULAR_RETURN) {
                      defaultTime = "5:00 PM";
                      defaultRecurrence = RECURRENCE_TYPES.WEEKDAYS;
                    } else if (v === SCHEDULE_TYPES.SPECIAL_SHUTTLE) {
                      defaultTime = "2:00 PM";
                      defaultRecurrence = RECURRENCE_TYPES.FRIDAY_ONLY;
                    } else if (v === SCHEDULE_TYPES.EVENT_SHUTTLE) {
                      defaultTime = "10:30 PM";
                      defaultRecurrence = RECURRENCE_TYPES.SPECIFIC_DATE;
                    }
                    handleScheduleBusOrTimeChange({
                      serviceType: v,
                      departureTime: defaultTime,
                      recurrence: defaultRecurrence,
                    });
                  }}
                >
                  <SelectTrigger id="modal-sch-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-recurrence">Recurrence / Applicability</Label>
                <Select
                  value={scheduleForm.recurrence}
                  onValueChange={(v) => handleScheduleBusOrTimeChange({ recurrence: v })}
                >
                  <SelectTrigger id="modal-sch-recurrence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date inputs when specific date or date range */}
            {(scheduleForm.recurrence === RECURRENCE_TYPES.SPECIFIC_DATE ||
              scheduleForm.recurrence === RECURRENCE_TYPES.EVENT) && (
              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-date">Specific Event / Service Date</Label>
                <Input
                  id="modal-sch-date"
                  type="date"
                  value={scheduleForm.specificDate}
                  onChange={(e) => handleScheduleBusOrTimeChange({ specificDate: e.target.value })}
                  required
                />
              </div>
            )}

            {scheduleForm.recurrence === RECURRENCE_TYPES.DATE_RANGE && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-sch-start">Start Date</Label>
                  <Input
                    id="modal-sch-start"
                    type="date"
                    value={scheduleForm.startDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-sch-end">End Date</Label>
                  <Input
                    id="modal-sch-end"
                    type="date"
                    value={scheduleForm.endDate}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Timings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-dep">Departure Time</Label>
                <Input
                  id="modal-sch-dep"
                  value={scheduleForm.departureTime}
                  onChange={(e) => handleScheduleBusOrTimeChange({ departureTime: e.target.value })}
                  placeholder="e.g. 7:15 AM, 2:00 PM, 5:00 PM, 11:30 PM"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-arr">Estimated Arrival Time</Label>
                <Input
                  id="modal-sch-arr"
                  value={scheduleForm.arrivalTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, arrivalTime: e.target.value })}
                  placeholder="e.g. 8:25 AM, 2:50 PM, 12:15 AM"
                />
              </div>
            </div>

            {/* Fleet Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-bus">Assigned Bus</Label>
                <Select
                  value={scheduleForm.busId}
                  onValueChange={(v) => handleScheduleBusOrTimeChange({ busId: v })}
                >
                  <SelectTrigger id="modal-sch-bus">
                    <SelectValue placeholder="Choose bus" />
                  </SelectTrigger>
                  <SelectContent>
                    {buses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.plate} ({b.capacity} seats) {b.status === "Under Maintenance" ? "⚠️ Maintenance" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-drv">Driver</Label>
                <Select
                  value={scheduleForm.driverId}
                  onValueChange={(v) => setScheduleForm({ ...scheduleForm, driverId: v })}
                >
                  <SelectTrigger id="modal-sch-drv">
                    <SelectValue placeholder="Choose driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({d.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal-sch-cnd">Conductor</Label>
                <Select
                  value={scheduleForm.conductorId}
                  onValueChange={(v) => setScheduleForm({ ...scheduleForm, conductorId: v })}
                >
                  <SelectTrigger id="modal-sch-cnd">
                    <SelectValue placeholder="Choose conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {conductors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="modal-sch-notes">Operational Notes</Label>
              <Input
                id="modal-sch-notes"
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                placeholder="e.g. Special shuttle for Jummah prayer or University Gala"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-secondary/20">
              <div>
                <Label className="font-semibold text-sm">Schedule Status</Label>
                <p className="text-xs text-muted-foreground">
                  Active schedules are immediately visible and bookable by students on eligible dates.
                </p>
              </div>
              <Switch
                checked={scheduleForm.status === "ACTIVE"}
                onCheckedChange={(checked) =>
                  setScheduleForm({ ...scheduleForm, status: checked ? "ACTIVE" : "INACTIVE" })
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingScheduleId ? "Update Schedule" : "Create Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG: CREATE ROUTE                                                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Dialog open={addRouteOpen} onOpenChange={setAddRouteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Baseline Route</DialogTitle>
            <DialogDescription>Define stops as a comma-separated list, in travel order.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRoute} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Route Name</Label>
              <Input
                required
                value={routeForm.name}
                onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                placeholder="Route 17 — New City Expressway"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Short Name</Label>
                <Input
                  value={routeForm.shortName}
                  onChange={(e) => setRouteForm({ ...routeForm, shortName: e.target.value })}
                  placeholder="Route 17"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Baseline Departure Time</Label>
                <Input
                  required
                  value={routeForm.departureTime}
                  onChange={(e) => setRouteForm({ ...routeForm, departureTime: e.target.value })}
                  placeholder="7:15 AM"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Stops (comma-separated, in order)</Label>
              <Input
                required
                value={routeForm.stopsText}
                onChange={(e) => setRouteForm({ ...routeForm, stopsText: e.target.value })}
                placeholder="Stop 1, Stop 2, FAST NUCES CFD Campus"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Create Route</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
