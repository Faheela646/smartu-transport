import { Bus, Users, Receipt, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFleetStore } from "@/store/useFleetStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";

function KpiCard({ icon: Icon, label, value, accent }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: accent }}
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { buses, routes } = useFleetStore();
  const students = useStudentStore((state) => state.students);
  const attendanceHistory = useAttendanceStore((state) => state.attendanceHistory);
  const semesterPayments = useTransportWorkflowStore((state) => state.semesterPayments);
  const tickets = useTransportWorkflowStore((state) => state.tickets);
  const violations = useTransportWorkflowStore((state) => state.violations);

  const activeBuses = buses.filter((b) => b.status === "Active").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaysBoardings = attendanceHistory.filter((record) => (record.adate || record.date) === today).length;
  const pendingReviews = semesterPayments.filter((record) => record.status === "Pending").length
    + tickets.filter((record) => record.status === "Pending").length;
  const unresolvedViolationFines = violations.reduce((count, violation) =>
    count + violation.users.filter((record) => record.paymentStatus !== "Resolved").length, 0);
  const activeAlerts = buses.filter((bus) => bus.status === "Under Maintenance").length
    + unresolvedViolationFines;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of today's transport operations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Bus} label="Total Active Buses" value={activeBuses} accent="#fef9cd" />
        <KpiCard icon={Users} label="Today's Total Boardings" value={todaysBoardings} accent="#fef9cd" />
        <KpiCard icon={Receipt} label="Pending Applications & Tickets" value={pendingReviews} accent="#fef9cd" />
        <KpiCard icon={AlertTriangle} label="Active Alerts" value={activeAlerts} accent="#fef9cd" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approved users by route</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {routes.map((route) => {
            const cap = buses.find((bus) => bus.id === route.busId)?.capacity || 0;
            const bookedStudents = students.filter((student) =>
              student.role !== "HOSTELITE" &&
              student.routeId === route.id &&
              student.accountStatus === "Approved"
            ).length;
            const bookedTickets = tickets.filter((ticket) =>
              ticket.routeId === route.id && ["Active", "HalfRedeemed"].includes(ticket.status)
            ).length;
            const booked = bookedStudents + bookedTickets;
            const pct = cap ? Math.min(100, Math.round((booked / cap) * 100)) : 0;
            return (
              <div key={route.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{route.name}</span>
                  <span className="text-muted-foreground">{booked} approved / {cap} capacity</span>
                </div>
                <Progress value={pct} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
