import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Send, CheckCircle2, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useIssueStore } from "@/store/useIssueStore";
import { useFleetStore } from "@/store/useFleetStore";

export default function ReportIssue() {
  const { issues, submitIssue } = useIssueStore();
  const { routes, buses } = useFleetStore();

  const [category, setCategory] = useState("Bus Delay");
  const [routeId, setRouteId] = useState(routes[0]?.id || "RT-01");
  const [busId, setBusId] = useState(buses[0]?.id || "BUS-101");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    submitIssue({
      category,
      routeId,
      busId,
      description: description.trim(),
    });

    toast.success("Issue report submitted successfully to Transport Office!");
    setDescription("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Report a Transport Issue</h1>
        <p className="text-sm text-muted-foreground">Submit feedback or report bus delays, RFID failures, or overcrowding directly to transport staff.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> New Issue Report Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Issue Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bus Delay">Bus Delay / Timing Issue</SelectItem>
                    <SelectItem value="QR Scanner">QR Scanner / Attendance Issue</SelectItem>
                    <SelectItem value="RFID Card">RFID Card Failure</SelectItem>
                    <SelectItem value="Staff Conduct">Driver / Conductor Conduct</SelectItem>
                    <SelectItem value="Overcrowding">Overcrowding / Seating Issue</SelectItem>
                    <SelectItem value="App Bug">App / Technical Issue</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Affected Route</Label>
                <Select value={routeId} onValueChange={setRouteId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.shortName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Bus Plate Number</Label>
                <Select value={busId} onValueChange={setBusId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {buses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.plate} ({b.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description of the Problem</Label>
              <Textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, including specific time, stop location, or details..."
              />
            </div>

            <Button type="submit" disabled={!description.trim()} className="gap-2">
              <Send className="h-4 w-4" /> Submit Report
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reported Issues History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Your Reported Issues History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {issues.map((iss) => (
            <div key={iss.id} className="rounded-xl border border-border p-4 bg-card/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-foreground">{iss.id}</span>
                  <Badge variant="outline">{iss.category}</Badge>
                </div>
                <Badge variant={iss.status === "Resolved" ? "success" : "warning"}>
                  {iss.status}
                </Badge>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{iss.description}</p>
              {iss.resolutionNote && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-md">
                  <strong>Resolution:</strong> {iss.resolutionNote}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
