import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, Clock, FileImage, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { BANK_ACCOUNTS } from "@/data/bankAccounts";

const CURRENT_SEMESTER = "FALL-2026";
const DUE_DATE = "2026-08-05";
const LATE_FEE_APPLIES = Date.now() > new Date(`${DUE_DATE}T23:59:59`).getTime();
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

export default function SemesterRegistration() {
  const user = useAuthStore((state) => state.user);
  const students = useStudentStore((state) => state.students);
  const updateAccountStatus = useStudentStore((state) => state.updateAccountStatus);
  const routes = useFleetStore((state) => state.routes);
  const feeSchedule = useTransportWorkflowStore((state) => state.feeSchedule);
  const payments = useTransportWorkflowStore((state) => state.semesterPayments);
  const submitSemesterPayment = useTransportWorkflowStore((state) => state.submitSemesterPayment);
  const student = students.find((record) => record.id === user?.id);
  const [routeId, setRouteId] = useState(student?.routeId || "");
  const [stopId, setStopId] = useState(student?.pickupStop || "");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedRoute = routes.find((route) => route.id === routeId);
  const stops = selectedRoute?.stops || [];
  const activePayment = useMemo(
    () => payments.find((payment) =>
      payment.userId === user?.id &&
      payment.semester === CURRENT_SEMESTER &&
      payment.status !== "Rejected"
    ),
    [payments, user?.id]
  );
  const lateFee = LATE_FEE_APPLIES;
  const feeKey = user?.userType === "faculty"
    ? "FEE_FACULTY"
    : lateFee ? "FEE_DAY_SCHOLAR_LATE" : "FEE_DAY_SCHOLAR";
  const amount = feeSchedule[feeKey];

  if (user?.role === "HOSTELITE") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="font-semibold">Semester registration is for Day Scholars and Faculty</p>
          <p className="mt-1 text-sm text-muted-foreground">Hostelites can request one-way or two-way tickets instead.</p>
          <Button asChild className="mt-4"><Link to="/student/tickets">Go to ticket requests</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!routeId || !stopId || !file) {
      toast.error("Select a route and stop and upload your fee evidence.");
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
      toast.error("Upload a payment slip image no larger than 1 MB.");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("The faculty semester fee has not been configured by Admin yet.");
      return;
    }
    setSubmitting(true);
    try {
      const evidenceDataUrl = await fileToDataUrl(file);
      const record = submitSemesterPayment({
        userId: user.id,
        userType: user.userType || "student",
        name: student?.name || user.name,
        identifier: user.rollNo || user.loginId,
        semester: CURRENT_SEMESTER,
        routeId,
        stopId,
        amount,
        lateFee,
        evidenceName: file.name,
        evidenceDataUrl,
      });
      updateAccountStatus(user.id, "Pending");
      toast.success(`Semester application submitted for ${record.status.toLowerCase()} review.`);
      setFile(null);
    } catch (error) {
      toast.error(error.message || "Could not submit your semester application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Semester Transport Registration</h1>
        <p className="text-sm text-muted-foreground">Apply for your semester route and seat by submitting payment evidence.</p>
      </div>

      {activePayment ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            {activePayment.status === "Approved"
              ? <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              : <Clock className="h-8 w-8 text-amber-600" />}
            <div className="flex-1">
              <p className="font-semibold">{CURRENT_SEMESTER} application</p>
              <p className="text-sm text-muted-foreground">
                {routes.find((route) => route.id === activePayment.routeId)?.shortName} · {activePayment.stopId} · Rs. {Number(activePayment.amount).toLocaleString()}
              </p>
              {activePayment.reviewNote && <p className="mt-1 text-xs text-muted-foreground">{activePayment.reviewNote}</p>}
              {activePayment.status === "Approved" && (
                <p className="mt-1 text-sm text-emerald-700">Seat: {student?.seatNo === 0 ? "Standing" : student?.seatNo ?? "Unassigned"}</p>
              )}
            </div>
            <Badge variant={activePayment.status === "Approved" ? "success" : activePayment.status === "Rejected" ? "destructive" : "warning"}>
              {activePayment.status}
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bank transfer details</CardTitle>
            <p className="text-xs text-muted-foreground">Pay the semester fee to one of the listed accounts, then upload the bank slip or payment screenshot below.</p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {BANK_ACCOUNTS.map((account) => (
              <div key={account.bank} className="space-y-1 rounded-md border border-border p-3 text-xs">
                <p className="font-semibold">{account.bank}</p>
                <p>Account title: {account.title}</p>
                <p>Account number: <strong>{account.account}</strong></p>
                <p>IBAN: <strong>{account.iban}</strong></p>
                <p>Branch: {account.branch}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground sm:col-span-2">Payment transfer is not processed or verified by this frontend demo. Contact the Transport Office if account details or the applicable fee need confirmation.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-5 w-5 text-primary" /> {CURRENT_SEMESTER}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary/50 p-4 text-sm">
              <p>Fee amount: <strong>{amount ? `Rs. ${Number(amount).toLocaleString()}/-` : "Not configured"}</strong></p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lateFee ? "Late fee rate applies after 05 Aug 2026." : "Standard rate applies through 05 Aug 2026."} {user?.userType === "faculty" && "Faculty rates are set by Admin."}
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="semester-route">Requested route</Label>
                  <select id="semester-route" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required value={routeId} onChange={(event) => { setRouteId(event.target.value); setStopId(""); }}>
                    <option value="">Select route</option>
                    {routes.map((route) => <option key={route.id} value={route.id}>{route.shortName || route.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="semester-stop">Pickup stop</Label>
                  <select id="semester-stop" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" required disabled={!selectedRoute} value={stopId} onChange={(event) => setStopId(event.target.value)}>
                    <option value="">Select stop</option>
                    {stops.map((stop, index) => <option key={`${selectedRoute?.id}-${index}`} value={stop.name}>{stop.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="semester-evidence">Fee payment screenshot / bank slip</Label>
                <Input id="semester-evidence" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} required />
                <p className="text-xs text-muted-foreground"><FileImage className="mr-1 inline h-3.5 w-3.5" />Image file, max 1 MB. The admin will review it before assigning a seat.</p>
              </div>
              <Button type="submit" disabled={submitting || !amount}>{submitting ? "Submitting..." : "Submit for approval"}</Button>
            </form>
          </CardContent>
        </Card>
        </>
      )}
      <p className="text-xs text-muted-foreground">This frontend demo stores payment evidence in this browser only; it is not a real payment or secure document-storage service.</p>
    </div>
  );
}
