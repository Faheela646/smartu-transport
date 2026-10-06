import { useState } from "react";
import { BarChart3, DollarSign, Download, Calendar, Users, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";

function downloadCsv(filename, columns, rows) {
  const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const content = [columns.map(([, label]) => escapeCell(label)).join(","),
    ...rows.map((row) => columns.map(([key]) => escapeCell(row[key])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState("financial");
  const students = useStudentStore((state) => state.students);
  const { routes, buses, drivers, conductors } = useFleetStore();
  const attendance = useAttendanceStore((state) => state.attendanceHistory);
  const { semesterPayments, tickets, violations } = useTransportWorkflowStore();
  const approvedPayments = semesterPayments.filter((record) => record.status === "Approved");
  const activeTickets = tickets.filter((record) => ["Active", "HalfRedeemed"].includes(record.status));
  const activeStudents = students.filter((student) =>
    student.role !== "HOSTELITE" && student.accountStatus === "Approved"
  );
  const verifiedFines = violations.flatMap((violation) =>
    violation.users.filter((record) => record.paymentStatus === "Resolved").map((record) => ({ ...record, violationId: violation.id }))
  );
  const revenue = approvedPayments.reduce((sum, record) => sum + Number(record.amount || 0), 0)
    + tickets.filter((record) => ["Active", "HalfRedeemed", "Redeemed"].includes(record.status)).reduce((sum, record) => sum + Number(record.amount || 0), 0)
    + verifiedFines.reduce((sum, record) => sum + Number(record.fine || 0), 0);
  const routeCounts = routes.map((route) => ({
    route,
    count: activeStudents.filter((student) => student.routeId === route.id).length
      + activeTickets.filter((ticket) => ticket.routeId === route.id).length,
  })).sort((a, b) => b.count - a.count);
  const activePasses = activeStudents.length + activeTickets.length;
  const reportData = {
    semester: {
      columns: [["identifier", "User ID"], ["semester", "Semester"], ["status", "Status"], ["amount", "Amount"], ["routeId", "Route"], ["stopId", "Stop"]],
      rows: semesterPayments,
    },
    fines: {
      columns: [["violationId", "Violation"], ["userId", "User ID"], ["strike", "Strike"], ["fine", "Fine"], ["paymentStatus", "Status"]],
      rows: violations.flatMap((violation) => violation.users.map((record) => ({ ...record, violationId: violation.id }))),
    },
    dues: {
      columns: [["identifier", "User ID"], ["semester", "Semester"], ["status", "Status"], ["amount", "Amount"]],
      rows: semesterPayments.filter((record) => record.status !== "Approved"),
    },
    attendance: {
      columns: [["rollNo", "User ID"], ["adate", "Date"], ["routeId", "Route"], ["busId", "Bus"], ["time", "Time"], ["method", "Method"], ["stop", "Stop"]],
      rows: attendance.map((record) => ({ ...record, adate: record.adate || record.date })),
    },
    fleet: {
      columns: [["id", "Bus ID"], ["plate", "Registration"], ["status", "Status"], ["routeId", "Route"], ["capacity", "Capacity"]],
      rows: buses,
    },
    staff: {
      columns: [["id", "Staff ID"], ["name", "Name"], ["loginId", "Login ID"], ["status", "Status"], ["assignedBusId", "Bus"]],
      rows: [...drivers, ...conductors],
    },
  };
  const exportNamedReport = (name) => {
    const key = name.includes("Semester Collection") ? "semester"
      : name.includes("Fine Collection") ? "fines"
      : name.includes("Outstanding") ? "dues"
      : name.includes("Attendance") ? "attendance"
      : name.includes("Maintenance") ? "fleet" : "staff";
    const report = reportData[key];
    downloadCsv(`${key}-report.csv`, report.columns, report.rows);
  };
  const exportSummary = () => downloadCsv("smartu-transport-summary.csv",
    [["metric", "Metric"], ["value", "Value"]],
    [
      { metric: "Approved semester payments (Rs.)", value: approvedPayments.reduce((sum, record) => sum + Number(record.amount || 0), 0) },
      { metric: "Approved/active tickets (Rs.)", value: tickets.filter((record) => ["Active", "HalfRedeemed", "Redeemed"].includes(record.status)).reduce((sum, record) => sum + Number(record.amount || 0), 0) },
      { metric: "Verified violation fines (Rs.)", value: verifiedFines.reduce((sum, record) => sum + Number(record.fine || 0), 0) },
      { metric: "Active passes", value: activePasses },
      { metric: "Attendance records", value: attendance.length },
    ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Reports &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Download comprehensive system data and analytics.</p>
        </div>
        <Button className="gap-2 bg-primary" onClick={exportSummary}>
          <Download className="h-4 w-4" /> Export Summary (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> Current Semester Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">Rs. {revenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Approved semester, ticket and fine payments saved in this browser</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Active Bus Passes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">{activePasses}</p>
            <p className="text-xs text-muted-foreground mt-1">Students using transport</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Route className="h-4 w-4 text-amber-500" /> Most Active Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">{routeCounts[0]?.route.shortName || "No active route"}</p>
            <p className="text-xs text-muted-foreground mt-1">{routeCounts[0]?.count || 0} approved users assigned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="usage">Usage &amp; Operations</TabsTrigger>
        </TabsList>
        <TabsContent value="financial" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Download Financial Statements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Fall 2026 Semester Collection Report", date: "Sep 2026" },
                { name: "Fine Collection History", date: "All Time" },
                { name: "Outstanding Dues & Defaulters", date: "Current" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Period: {r.date}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => exportNamedReport(r.name)}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operational Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Daily Boarding / Attendance Logs", date: "Sep 2026" },
                { name: "Fleet Maintenance & Servicing History", date: "All Time" },
                { name: "Driver / Conductor Shift Logs", date: "Sep 2026" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Period: {r.date}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => exportNamedReport(r.name)}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
