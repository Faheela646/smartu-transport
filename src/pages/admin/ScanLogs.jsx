import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";
import { isMockMode, transportService } from "@/api/transportService";

export default function ScanLogs() {
  const logs = useTransportWorkflowStore((state) => state.scanLogs);
  const students = useStudentStore((state) => state.students);
  const routes = useFleetStore((state) => state.routes);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    if (isMockMode) return undefined;
    let cancelled = false;
    transportService.listScanLogs().catch((error) => {
      if (!cancelled) setLoadError(error.response?.data?.message || error.message || "Could not load scan logs.");
    });
    return () => { cancelled = true; };
  }, []);
  const filtered = useMemo(() => logs.filter((log) => {
    const student = students.find((item) => item.id === log.studentId);
    const haystack = `${student?.name || ""} ${student?.rollNo || log.rollNo || ""} ${log.reason || ""} ${log.type || ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  }), [logs, students, search]);

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold tracking-tight">Scan Logs &amp; Attendance</h1><p className="text-sm text-muted-foreground">Live conductor scan results, including rejected attempts and offline conflicts.</p></div>
      {loadError && <Card className="border-destructive/40"><CardContent className="p-3 text-sm text-destructive">{loadError}</CardContent></Card>}
      <div className="max-w-md space-y-1.5"><Label htmlFor="scan-search">Search scan logs</Label><Input id="scan-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, roll number, result, reason" /></div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-secondary/40 text-muted-foreground"><tr>{["Student", "Type / Result", "Route / Trip", "Reason", "Conductor", "Timestamp"].map((title) => <th key={title} className="px-4 py-3 font-semibold">{title}</th>)}</tr></thead>
          <tbody>{filtered.map((log) => {
            const student = students.find((item) => item.id === log.studentId);
            return <tr key={log.id} className="border-t border-border/60">
              <td className="px-4 py-3">{student?.name || log.rollNo || "Unknown"}<span className="block font-mono text-xs text-muted-foreground">{student?.rollNo || log.rollNo || "—"}</span></td>
              <td className="px-4 py-3">{log.type || "QR"} · <span className={log.result === "GREEN" ? "text-emerald-600" : "text-destructive"}>{log.result}</span></td>
              <td className="px-4 py-3">{routes.find((route) => route.id === log.routeId)?.shortName || log.routeId || "—"}<span className="block text-xs text-muted-foreground">{log.tripId || "—"}</span></td>
              <td className="px-4 py-3">{log.reason || "—"}</td><td className="px-4 py-3">{log.conductorId || "—"}</td><td className="px-4 py-3">{new Date(log.timestamp).toLocaleString()}</td>
            </tr>;
          })}{!filtered.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{logs.length ? "No scan logs match this search." : "No conductor scans recorded yet."}</td></tr>}</tbody>
        </table>
      </div>
      <Card><CardContent className="p-3 text-xs text-muted-foreground">Displaying {filtered.length} of {logs.length} persisted scan records.</CardContent></Card>
    </div>
  );
}
