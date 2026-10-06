import { useNavigate } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  QrCode,
  CreditCard,
  Megaphone,
  Users,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { ANNOUNCEMENTS } from "@/data/mockData";
import { initials, formatDate } from "@/lib/utils";

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const students = useStudentStore((s) => s.students);
  const { routes, buses, drivers, conductors } = useFleetStore();
  const attendanceHistory = useAttendanceStore((s) => s.attendanceHistory);
  const { semesterPayments, tickets, violations } = useTransportWorkflowStore();

  // Student profile lookup
  const student = students.find(
    (s) =>
      (user?.rollNo && s.rollNo.toLowerCase() === user.rollNo.toLowerCase()) ||
      (user?.email && s.email?.toLowerCase() === user.email.toLowerCase())
  ) || {
    name: user?.name || "Student",
    rollNo: user?.rollNo || user?.loginId || "",
    role: user?.role || "DAY_SCHOLAR",
    accountStatus: user?.accountStatus || "N/A",
    routeId: null,
  };
  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendanceHistory.find(
    (record) => record.rollNo === student.rollNo && record.date === today
  );

  const isHostelite = student.role === "HOSTELITE";
  const latestSemesterPayment = semesterPayments.find((record) => record.userId === student.id);
  const latestTicket = tickets.find((record) => record.userId === student.id);
  const activeTicket = tickets.find((record) =>
    record.userId === student.id && ["Active", "HalfRedeemed"].includes(record.status)
  );
  const hasTransportAccess = isHostelite ? Boolean(activeTicket) : student.accountStatus === "Approved";
  const transportRouteId = isHostelite ? activeTicket?.routeId : hasTransportAccess ? student.routeId : null;
  const studentRoute = routes.find((route) => route.id === transportRouteId);
  const assignedBus = buses.find((bus) => bus.id === studentRoute?.busId);
  const pickupStopName = isHostelite ? activeTicket?.stopId : student.pickupStop;
  const pickupStop = studentRoute?.stops.find((stop) => stop.name === pickupStopName);
  const assignedDriver = drivers.find((driver) => driver.id === studentRoute?.driverId);
  const assignedConductor = conductors.find((conductor) => conductor.id === studentRoute?.conductorId);
  const studentFines = violations.flatMap((violation) =>
    violation.users.filter((record) => record.userId === student.id && record.paymentStatus !== "Resolved")
  );
  const application = isHostelite ? latestTicket : latestSemesterPayment;
  const applyPath = isHostelite ? "/student/tickets" : "/student/semester";
  const accessLabel = isHostelite
    ? activeTicket?.status || latestTicket?.status || "No ticket"
    : student.accountStatus || "N/A";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-card p-5 border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
              {initials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {getGreeting()}, {student.name.split(" ")[0]}! 👋
              </h1>
              <Badge variant={student.role === "HOSTELITE" || student.role === "FACULTY" ? "accent" : "secondary"} className="text-[10px]">
                {student.role === "FACULTY" ? "Faculty" : student.role === "HOSTELITE" ? "Hostelite" : "Day Scholar"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Roll No: <span className="font-mono font-medium text-foreground">{student.rollNo}</span> • FAST CFD Campus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/student/attendance")}>
            <QrCode className="h-4 w-4 mr-1.5 text-primary" /> My QR
          </Button>
          <Button size="sm" onClick={() => navigate(hasTransportAccess ? "/student/transport" : applyPath)}>
            <Bus className="h-4 w-4 mr-1.5" /> {hasTransportAccess ? "Live Map" : isHostelite ? "Request Ticket" : "Apply for Transport"}
          </Button>
        </div>
      </div>

      {/* Main Card: Today's Transport */}
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Transport Application & Route</CardTitle>
                <p className="text-xs text-muted-foreground">{studentRoute?.name || "No active route assignment"}</p>
              </div>
            </div>
            <Badge variant={hasTransportAccess ? "success" : accessLabel === "Rejected" ? "destructive" : "warning"}>
              {accessLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-secondary/50 p-3.5 border border-border/40">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bus & Plate</p>
              <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                <Bus className="h-4 w-4 text-primary" /> {assignedBus ? `${assignedBus.model} (${assignedBus.plate})` : "Not assigned"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{assignedBus ? `Bus ID: ${assignedBus.id}` : "Available after approval and assignment"}</p>
            </div>

            <div className="rounded-xl bg-secondary/50 p-3.5 border border-border/40">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Your Pickup Stop</p>
              <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> {pickupStop?.name || "Not selected"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{pickupStop ? `Scheduled: ${pickupStop.eta}` : "Select a stop in your application"}</p>
            </div>

            <div className="rounded-xl bg-primary/10 p-3.5 border border-primary/20">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Departure</p>
              <p className="text-base font-bold text-primary mt-1 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {studentRoute?.departureTime || "Unavailable"}
              </p>
              <p className="text-xs text-primary/80 mt-0.5">Live location/ETA unavailable in this frontend demo.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>
                Conductor: {assignedConductor?.name || "Not assigned"} • Driver: {assignedDriver?.name || "Not assigned"}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-1" onClick={() => navigate(hasTransportAccess ? "/student/transport" : applyPath)}>
              {hasTransportAccess ? "View Route & Map" : "Continue application"} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate("/student/attendance")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-all text-center group shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-105 transition-transform mb-2">
              <QrCode className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">My Boarding QR</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Show to Conductor</span>
          </button>

          <button
            onClick={() => navigate(hasTransportAccess ? "/student/transport" : applyPath)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-all text-center group shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-105 transition-transform mb-2">
              <Bus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">{hasTransportAccess ? "Route & Tracking" : "Transport Access"}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{hasTransportAccess ? "Route details" : isHostelite ? "Request a ticket" : "Apply for semester"}</span>
          </button>

          <button
            onClick={() => navigate("/student/transport?tab=seats")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-all text-center group shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-105 transition-transform mb-2">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Seat Capacity</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Live Occupancy</span>
          </button>

          <button
            onClick={() => navigate("/student/payments")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-all text-center group shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 group-hover:scale-105 transition-transform mb-2">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Transport Fee</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Dues & Receipts</span>
          </button>

          <button
            onClick={() => navigate("/student/announcements")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-all text-center group shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-105 transition-transform mb-2">
              <Megaphone className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Announcements</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Campus Alerts</span>
          </button>

          <button
            onClick={() => navigate("/student/report-issue")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-all text-center group shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 group-hover:scale-105 transition-transform mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Report Issue</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Submit Feedback</span>
          </button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Today's Attendance</p>
              <p className="text-base font-bold text-foreground mt-0.5">
                {todayAttendance ? "Marked Present" : "Not Marked"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {todayAttendance
                  ? `Boarded at ${todayAttendance.time}`
                  : student.accountStatus === "Approved" || isHostelite && activeTicket
                    ? "Show your QR to the conductor"
                    : "Available after transport approval"}
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${todayAttendance ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              {todayAttendance ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{isHostelite ? "Ticket payment" : "Semester fee"}</p>
              <p className="text-base font-bold text-foreground mt-0.5">{application ? `Rs. ${Number(application.amount).toLocaleString()}` : "No request"}</p>
              <Badge variant={application ? (application.status === "Approved" || ["Active", "HalfRedeemed"].includes(application.status) ? "success" : application.status === "Rejected" ? "destructive" : "warning") : "secondary"} className="mt-1">
                {application?.status || "Not submitted"}
              </Badge>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Current Shuttle Status</p>
              <p className="text-base font-bold text-foreground mt-0.5">{hasTransportAccess ? (assignedBus ? "Pass approved" : "Bus not assigned") : "No active pass"}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{assignedBus ? `${assignedBus.id} (${assignedBus.plate})` : accessLabel}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Bus className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Alerts / Fines</p>
              <p className="text-base font-bold text-foreground mt-0.5">
                {studentFines.length > 0 ? `${studentFines.length} Unresolved Fine(s)` : "No unresolved fines"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">{ANNOUNCEMENTS.length} demo broadcast(s)</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <Megaphone className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Announcements Widget */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" /> Recent Transport Broadcasts
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/student/announcements")}>
            View All
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {ANNOUNCEMENTS.slice(0, 2).map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-3.5 bg-card/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="accent" className="text-[10px]">
                  {item.audienceLabel}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{formatDate(item.date)}</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{item.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
