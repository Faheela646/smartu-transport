import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("Unable to read payment evidence."));
    reader.onerror = () => reject(new Error("Unable to read payment evidence."));
    reader.readAsDataURL(file);
  });
}

export default function ViolationFines() {
  const user = useAuthStore((state) => state.user);
  const violations = useTransportWorkflowStore((state) => state.violations);
  const submitFinePayment = useTransportWorkflowStore((state) => state.submitFinePayment);
  const [files, setFiles] = useState({});
  const [busyId, setBusyId] = useState("");
  const records = violations.flatMap((violation) =>
    violation.users.filter((fine) => fine.userId === user?.id).map((fine) => ({ ...fine, violation }))
  );

  const uploadPayment = async (record) => {
    const file = files[record.violation.id];
    if (!file) {
      toast.error("Select your fine payment slip first.");
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
      toast.error("Upload an image no larger than 1 MB.");
      return;
    }
    setBusyId(record.violation.id);
    try {
      const dataUrl = await fileToDataUrl(file);
      submitFinePayment(record.violation.id, user.id, { name: file.name, dataUrl });
      setFiles((current) => ({ ...current, [record.violation.id]: null }));
      toast.success("Fine payment evidence submitted for Admin verification.");
    } catch (error) {
      toast.error(error.message || "Unable to submit fine evidence.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><AlertTriangle className="h-6 w-6 text-amber-600" /> My Violations & Fines</h1>
        <p className="text-sm text-muted-foreground">Upload fine payment evidence and follow its verification status.</p>
      </div>
      {records.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No violations have been assigned to your account.</CardContent></Card>}
      {records.map((record) => (
        <Card key={`${record.violation.id}-${user.id}`}>
          <CardHeader><CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {record.violation.id} · Fine Rs. {Number(record.fine).toLocaleString()}
            <Badge variant={record.paymentStatus === "Resolved" ? "success" : record.paymentStatus === "Unpaid" ? "destructive" : "warning"}>{record.paymentStatus}</Badge>
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{record.violation.description}</p>
            <p className="text-xs text-muted-foreground">Strike {record.strike} · {record.fineKey}</p>
            {record.paymentStatus === "Unpaid" && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input type="file" accept="image/*" onChange={(event) => setFiles((current) => ({ ...current, [record.violation.id]: event.target.files?.[0] || null }))} />
                <Button className="shrink-0" disabled={busyId === record.violation.id} onClick={() => uploadPayment(record)}>
                  <Upload className="mr-1 h-4 w-4" />{busyId === record.violation.id ? "Submitting..." : "Submit evidence"}
                </Button>
              </div>
            )}
            {record.paymentEvidence?.dataUrl && (
              <a className="text-xs font-medium text-primary underline" href={record.paymentEvidence.dataUrl} target="_blank" rel="noreferrer">View submitted fine payment evidence</a>
            )}
          </CardContent>
        </Card>
      ))}
      <p className="text-xs text-muted-foreground">Evidence is browser-local for this frontend demo. Payment and verification are simulated.</p>
    </div>
  );
}
