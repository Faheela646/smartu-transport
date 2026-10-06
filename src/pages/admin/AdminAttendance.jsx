import { useState } from "react";
import { UserCheck, Search, Calendar, MapPin, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";

export default function AdminAttendance() {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const attendanceHistory = useAttendanceStore((state) => state.attendanceHistory);
  const students = useStudentStore((state) => state.students);
  const routes = useFleetStore((state) => state.routes);
  const today = new Date().toISOString().slice(0, 10);
  const scannedAttendance = attendanceHistory
    .filter((record) => record.rollNo)
    .map((record) => ({
      id: record.id,
      name: students.find((student) => student.rollNo === record.rollNo)?.name || record.rollNo,
      rollNo: record.rollNo,
      route: routes.find((route) => route.id === record.routeId)?.shortName || record.routeId,
      stop: record.stop,
      time: record.time,
      date: (record.adate || record.date) === today ? "Today" : record.adate || record.date,
      type: record.method,
    }));
  const attendanceLogs = scannedAttendance;

  const filtered = attendanceLogs.filter(a =>
    (!selectedDate || (a.date === "Today" ? today : a.date) === selectedDate) &&
    (a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      a.route.toLowerCase().includes(search.toLowerCase()))
  );
  const exportCsv = () => {
    const columns = ["rollNo", "name", "date", "route", "stop", "time", "type"];
    const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const content = [
      columns.join(","),
      ...filtered.map((record) => columns.map((key) =>
        escapeCell(key === "date" && record.date === "Today" ? today : record[key])
      ).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Attendance &amp; Boarding Logs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor real-time student boarding scans across all routes.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by student or route..." 
            className="pl-9 bg-card" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-auto bg-card" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/40 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Route</th>
                <th className="px-4 py-3 font-semibold">Stop Location</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Verification</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-border/60 hover:bg-secondary/20">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{log.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{log.rollNo}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
                      {log.route}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {log.stop}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {log.time}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 font-medium">
                      {log.type}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No attendance records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
