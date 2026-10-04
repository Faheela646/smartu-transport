import { useState } from "react";
import { UserCheck, Search, Calendar, MapPin, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOCK_ATTENDANCE = [
  { id: 1, name: "Ahmed Raza", rollNo: "22F-3082", route: "RT-01", stop: "D-Ground Chowk", time: "7:14 AM", date: "Today", status: "Boarded", type: "NFC Tap" },
  { id: 2, name: "Fatima Noor", rollNo: "22F-3091", route: "RT-02", stop: "Millat Town", time: "7:20 AM", date: "Today", status: "Boarded", type: "QR Scan" },
  { id: 3, name: "Usman Tariq", rollNo: "22K-1187", route: "RT-01", stop: "Susan Road", time: "7:39 AM", date: "Today", status: "Boarded", type: "NFC Tap" },
  { id: 4, name: "Hassan Ali", rollNo: "21F-2871", route: "RT-03", stop: "Jail Road", time: "7:25 AM", date: "Today", status: "Boarded", type: "Manual Entry" },
];

export default function AdminAttendance() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_ATTENDANCE.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.rollNo.toLowerCase().includes(search.toLowerCase()) ||
    a.route.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Attendance &amp; Boarding Logs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor real-time student boarding scans across all routes.</p>
        </div>
        <Button variant="outline" className="gap-2">
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
        <Input type="date" className="w-auto bg-card" />
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
