import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { isMockMode, transportService } from "@/api/transportService";

export default function ViolationsCenter() {
  const reports = useTransportWorkflowStore((state) => state.violations);
  const [loadError, setLoadError] = useState("");
  const students = useStudentStore((state) => state.students);
  const routes = useFleetStore((state) => state.routes);

  useEffect(() => {
    if (isMockMode) return undefined;
    let cancelled = false;
    transportService.listViolations().catch((error) => {
      if (!cancelled) setLoadError(error.response?.data?.message || error.message || "Could not load violations.");
    });
    return () => { cancelled = true; };
  }, []);

  const changeStatus = async (id, status) => {
    try {
      await transportService.updateViolationStatus(id, status);
      toast.success(`Violation marked ${status.toLowerCase()}.`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not update violation.");
    }
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold tracking-tight">Violations</h1><p className="text-sm text-muted-foreground">Review conductor reports, penalties, and resolution status.</p></div>
      {loadError && <Card className="border-destructive/40"><CardContent className="p-3 text-sm text-destructive">{loadError}</CardContent></Card>}
      {!reports.length && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No violation reports have been filed.</CardContent></Card>}
      {reports.map((report) => {
        const student = students.find((item) => item.id === (report.studentId || report.userIds?.[0]));
        const route = routes.find((item) => item.id === report.routeId);
        return (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div><CardTitle className="text-base">{student?.name || report.studentName || report.rollNo || "Student"} · {report.rollNo || student?.rollNo}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{route?.shortName || route?.name || report.routeId} · {report.conductorName || "Conductor"} · {new Date(report.timestamp || report.createdAt).toLocaleString()}</p></div>
              <Badge variant={report.status === "OPEN" || report.status === "Pending" ? "warning" : report.status === "Escalated" ? "destructive" : "success"}>{report.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{report.description || report.type?.replaceAll("_", " ")}{report.note ? ` · ${report.note}` : ""}</p>
              {report.penalty && <p className="text-sm font-semibold text-primary">{report.penalty}</p>}
              {report.users?.map((entry) => <p key={entry.userId} className="text-xs text-muted-foreground">Strike {entry.strike} · {entry.fine ? `Rs. ${Number(entry.fine).toLocaleString()}` : "DDC referral"} · {entry.paymentStatus}</p>)}
              {(report.status === "OPEN" || report.status === "Pending") && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => changeStatus(report.id, "Resolved")}>Mark resolved</Button>
                  <Button size="sm" variant="outline" onClick={() => changeStatus(report.id, "Waived")}>Waive</Button>
                  <Button size="sm" variant="destructive" onClick={() => changeStatus(report.id, "Escalated")}>Escalate</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
