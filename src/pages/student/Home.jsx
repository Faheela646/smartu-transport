import { useNavigate } from "react-router-dom";
import {
  Bus,
  MapPin,
  Clock,
  QrCode,
  CreditCard,
  Megaphone,
  Bot,
  Users,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useFineStore } from "@/store/useFineStore";
import { ANNOUNCEMENTS } from "@/data/mockData";
import { initials, formatDate } from "@/lib/utils";

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const routes = useFleetStore((s) => s.routes);
  const buses = useFleetStore((s) => s.buses);
  const todayAttendance = useAttendanceStore((s) => s.todayAttendance);
  const fines = useFineStore((s) => s.fines);

  // Student's route & bus
  const studentRoute = routes.find((r) => r.id === "RT-01") || routes[0];
  const assignedBus = buses.find((b) => b.id === studentRoute?.busId) || buses[0];
  const pickupStop = studentRoute?.stops[1] || studentRoute?.stops[0];

  const studentFines = user?.rollNo ? fines.filter((f) => f.rollNo === user.rollNo && f.status !== "Cleared") : [];

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
              {initials(user?.name || "Ahmed Raza")}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {getGreeting()}, {user?.name?.split(" ")[0] || "Ahmed"}! 👋
              </h1>
              <Badge variant="accent" className="text-[10px]">
                Day Scholar
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Roll No: <span className="font-mono font-medium text-foreground">{user?.rollNo || "22F-3082"}</span> • FAST CFD Campus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/student/attendance")}>
            <QrCode className="h-4 w-4 mr-1.5 text-primary" /> Scan QR
          </Button>
          <Button size="sm" onClick={() => navigate("/student/transport")}>
            <Bus className="h-4 w-4 mr-1.5" /> Live Map
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
                <CardTitle className="text-base font-bold">Today's Shuttle Transport</CardTitle>
                <p className="text-xs text-muted-foreground">{studentRoute?.name}</p>
              </div>
            </div>
            <Badge variant="success" className="animate-pulse">
              <Radio className="h-3 w-3 mr-1" /> On Route
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-secondary/50 p-3.5 border border-border/40">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bus & Plate</p>
              <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                <Bus className="h-4 w-4 text-primary" /> {assignedBus?.model} ({assignedBus?.plate})
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Bus ID: {assignedBus?.id}</p>
            </div>

            <div className="rounded-xl bg-secondary/50 p-3.5 border border-border/40">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Your Pickup Stop</p>
              <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> {pickupStop?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Scheduled: {pickupStop?.eta}</p>
            </div>

            <div className="rounded-xl bg-primary/10 p-3.5 border border-primary/20">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">Expected Arrival</p>
              <p className="text-base font-bold text-primary mt-1 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Arriving in 7 mins
              </p>
              <p className="text-xs text-primary/80 mt-0.5">Live ETA • 2.1 km away</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Conductor: Aslam Chaudhry • Driver: M. Arshad</span>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-1" onClick={() => navigate("/student/transport")}>
              View Live Route & Map <ArrowRight className="h-3.5 w-3.5" />
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
            <span className="text-xs font-semibold text-foreground">QR Attendance</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Scan Boarding Code</span>
          </button>

          <button
            onClick={() => navigate("/student/transport")}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-all text-center group shadow-xs"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-105 transition-transform mb-2">
              <Bus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Live Tracking</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Shuttle Location</span>
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
                {todayAttendance.marked ? "Marked Present" : "Not Marked"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {todayAttendance.marked ? `Boarded at ${todayAttendance.time}` : "Scan bus QR code"}
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${todayAttendance.marked ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
              {todayAttendance.marked ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Transport Fee</p>
              <p className="text-base font-bold text-foreground mt-0.5">Rs. 5,000</p>
              <Badge variant="success" className="mt-1">Paid • Sept 2026</Badge>
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
              <p className="text-base font-bold text-foreground mt-0.5">On Route</p>
              <p className="text-[11px] text-muted-foreground mt-1">BUS-101 (FSD-2023)</p>
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
                {studentFines.length > 0 ? `${studentFines.length} Pending Fine` : "No Fines"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">1 Broadcast Notice</p>
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
