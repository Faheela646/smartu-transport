import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { VIOLATION_TYPES, ROLL_RE, formatRoll, penaltyFor } from "@/data/violations";
import { transportService } from "@/api/transportService";

export default function NotifyAdmin() {
  const conductor = useAuthStore((state) => state.user);
  const { conductors, buses, routes } = useFleetStore();
  const students = useStudentStore((state) => state.students);
  const trips = useTransportWorkflowStore((state) => state.trips);
  const violations = useTransportWorkflowStore((state) => state.violations);
  const staff = conductors.find((item) => item.id === conductor?.id);
  const bus = buses.find((item) => item.id === staff?.assignedBusId);
  const route = routes.find((item) => item.id === bus?.routeId);
  const trip = trips.find((item) => item.routeId === route?.id && item.status === "ACTIVE");
  const routeContact = conductors.find((item) => item.id === route?.conductorId) || staff;
  const [rollNo, setRollNo] = useState("");
  const [type, setType] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (!ROLL_RE.test(rollNo)) {
      toast.error("Enter a roll number in ##[A-Z]{1,4}-#### format.");
      return;
    }
    const student = students.find((item) => item.rollNo.toUpperCase() === rollNo);
    if (!student) {
      toast.error("No registered student matches that roll number.");
      return;
    }
    if (!type) {
      toast.error("Choose a violation type.");
      return;
    }
    if (!trip) {
      toast.error("Start your assigned trip before reporting a violation.");
      return;
    }
    setSubmitting(true);
    try {
      const record = await transportService.reportViolation({
        student,
        tripId: trip.id,
        routeId: route.id,
        type,
        conductor: { id: conductor.id, name: conductor.name },
        note,
      });
      const strike = Number(record.strike) || violations.filter((item) =>
        item.studentId === student.id || item.userIds?.includes(student.id)
      ).length;
      setResult({ student, record, strike, penalty: record.penalty || penaltyFor(strike) });
      toast.success("Admin notified and the student fine/notification has been recorded.");
      setRollNo("");
      setType("");
      setNote("");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Unable to notify Admin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <div><h1 className="text-xl font-bold">Notify Admin</h1><p className="text-sm text-muted-foreground">Submit a route-linked misbehaviour report and automatic penalty.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Assigned route contact</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{route?.shortName || route?.name || "No assigned route"}</p>
          <p>{routeContact?.name || "No authorised contact listed"} · {routeContact?.phone || "Phone unavailable"}</p>
          {routeContact?.phone && <a className="text-primary underline" href={`tel:${routeContact.phone.replaceAll("-", "")}`}>Call route contact</a>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Violation details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="violation-roll">Student roll number</Label><Input id="violation-roll" value={rollNo} onChange={(event) => setRollNo(formatRoll(event.target.value))} placeholder="22F-3091" maxLength={12} autoCapitalize="characters" required aria-describedby="roll-format" /><p id="roll-format" className="text-xs text-muted-foreground">Format: ##[A-Z]&#123;1,4&#125;-####</p></div>
            <div className="space-y-1.5"><Label htmlFor="violation-type">Violation type</Label><Select value={type} onValueChange={setType}><SelectTrigger id="violation-type"><SelectValue placeholder="Choose violation type" /></SelectTrigger><SelectContent>{VIOLATION_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="violation-note">Additional note (optional)</Label><Textarea id="violation-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} /></div>
            <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">Penalty ladder: first report Rs. 1,000 · second Rs. 5,000 · third and later referred to the Disciplinary Committee.</div>
            <Button type="submit" className="w-full" disabled={submitting || !route || !trip}>{submitting ? "Sending report…" : "Notify Admin"}</Button>
          </form>
        </CardContent>
      </Card>
      {result && <Card className="border-primary/30"><CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2"><Badge variant="success">Admin notified</Badge><span className="font-mono text-xs">{result.record.id}</span></div>
        <p className="text-sm">{result.student.name} · strike {result.strike}</p>
        <p className="font-semibold">{typeof result.penalty === "string" ? result.penalty : result.penalty.label}</p>
      </CardContent></Card>}
    </div>
  );
}
