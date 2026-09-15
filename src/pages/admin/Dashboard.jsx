import { Bus, Users, Receipt, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFleetStore } from "@/store/useFleetStore";
import { useFineStore } from "@/store/useFineStore";
import { useBookingStore } from "@/store/useBookingStore";
import { STUDENTS } from "@/data/mockData";

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
  const fines = useFineStore((s) => s.fines);
  const { seatsBookedFor, capacityFor } = useBookingStore();

  const activeBuses = buses.filter((b) => b.status === "Active").length;
  const todaysBoardings = 312; // simulated aggregate boarding count for today
  const pendingFees = fines.filter((f) => f.status === "Pending Approval" || STUDENTS.find((s) => s.rollNo === f.rollNo && s.feeStatus === "Pending")).length + STUDENTS.filter((s) => s.feeStatus === "Pending").length;
  const activeAlerts = buses.filter((b) => b.status === "Under Maintenance").length + fines.filter((f) => f.status === "Unpaid").length;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of today's transport operations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Bus} label="Total Active Buses" value={activeBuses} accent="#fef9cd" />
        <KpiCard icon={Users} label="Today's Total Boardings" value={todaysBoardings} accent="#fef9cd" />
        <KpiCard icon={Receipt} label="Pending Fee Submissions" value={pendingFees} accent="#fef9cd" />
        <KpiCard icon={AlertTriangle} label="Active Alerts" value={activeAlerts} accent="#fef9cd" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route occupancy — today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {routes.map((route) => {
            const cap = capacityFor(route.id);
            const booked = seatsBookedFor(route.id, today);
            const pct = Math.min(100, Math.round((booked / cap) * 100));
            return (
              <div key={route.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{route.name}</span>
                  <span className="text-muted-foreground">{booked} / {cap} seats</span>
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
