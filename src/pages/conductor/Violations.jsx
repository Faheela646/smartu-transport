import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("Unable to read violation evidence."));
    reader.onerror = () => reject(new Error("Unable to read violation evidence."));
    reader.readAsDataURL(file);
  });
}

export default function ConductorViolations() {
  const user = useAuthStore((state) => state.user);
  const { conductors, buses, routes } = useFleetStore();
  const students = useStudentStore((state) => state.students);
  const violations = useTransportWorkflowStore((state) => state.violations);
  const fileViolation = useTransportWorkflowStore((state) => state.fileViolation);
  const conductor = conductors.find((record) => record.id === user?.id);
  const bus = buses.find((record) => record.id === conductor?.assignedBusId);
  const route = routes.find((record) => record.id === bus?.routeId);
  const usersOnRoute = useMemo(
    () => students.filter((student) => student.routeId === route?.id && student.accountStatus === "Approved"),
    [students, route?.id]
  );

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [description, setDescription] = useState("");
  const [unregisteredNote, setUnregisteredNote] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const myReports = violations.filter((record) => record.conductorId === user?.id);

  const toggleUser = (id) => setSelectedUsers((current) =>
    current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedUsers.length === 0 && !unregisteredNote.trim()) {
      toast.error("Select a registered user or describe an unregistered violator.");
      return;
    }
    if (description.trim().length < 5) {
      toast.error("Enter a clear description of the violation.");
      return;
    }
    if (evidenceFile && (!evidenceFile.type.startsWith("image/") || evidenceFile.size > 1024 * 1024)) {
      toast.error("Evidence must be an image no larger than 1 MB.");
      return;
    }

    setSubmitting(true);
    try {
      const evidenceDataUrl = evidenceFile ? await fileToDataUrl(evidenceFile) : null;
      fileViolation({
        userIds: selectedUsers,
        unregisteredNote,
        description: description.trim(),
        conductorId: user?.id,
        conductorName: user?.name,
        routeId: route?.id || null,
        busId: bus?.id || null,
        evidenceName: evidenceFile?.name || null,
        evidenceDataUrl,
      });
      toast.success("Violation report submitted to Admin.");
      setSelectedUsers([]);
      setDescription("");
      setUnregisteredNote("");
      setEvidenceFile(null);
    } catch (error) {
      toast.error(error.message || "Unable to file the report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold"><AlertTriangle className="h-5 w-5 text-amber-600" /> File Violation</h1>
        <p className="text-xs text-muted-foreground">{bus?.plate || "No bus assigned"} · {route?.shortName || "No route assigned"}</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Violation details</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Registered users involved</legend>
              {usersOnRoute.length === 0 && <p className="text-xs text-muted-foreground">No approved users are registered on this route.</p>}
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                {usersOnRoute.map((student) => (
                  <label key={student.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedUsers.includes(student.id)} onChange={() => toggleUser(student.id)} />
                    {student.name} <span className="text-xs text-muted-foreground">{student.rollNo}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="unregistered-note">Unregistered violator details (if applicable)</Label>
              <Input id="unregistered-note" value={unregisteredNote} onChange={(event) => setUnregisteredNote(event.target.value)} placeholder="Name, description, or other identifying details" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="violation-description">Violation description</Label>
              <textarea id="violation-description" className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="violation-evidence">Evidence image (optional)</Label>
              <Input id="violation-evidence" type="file" accept="image/*" onChange={(event) => setEvidenceFile(event.target.files?.[0] || null)} />
              {evidenceFile && <p className="text-xs text-muted-foreground"><Upload className="mr-1 inline h-3 w-3" />{evidenceFile.name}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit violation report"}</Button>
          </form>
        </CardContent>
      </Card>
      {myReports.map((report) => (
        <Card key={report.id}><CardContent className="space-y-1 p-3">
          <p className="font-mono text-xs font-semibold">{report.id} · {report.status}</p>
          <p className="text-sm">{report.description}</p>
          {report.users.map((record) => <p key={record.userId} className="text-xs text-muted-foreground">{students.find((student) => student.id === record.userId)?.name || record.userId}: strike {record.strike}, fine Rs. {record.fine} ({record.paymentStatus})</p>)}
        </CardContent></Card>
      ))}
      <p className="text-xs text-muted-foreground">Reports and evidence are stored in local browser demo state only.</p>
    </div>
  );
}
