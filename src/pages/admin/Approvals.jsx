import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, FileImage, UserRoundPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFleetStore } from "@/store/useFleetStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";

const statusVariant = { Pending: "warning", Approved: "success", Active: "success", Rejected: "destructive", HalfRedeemed: "accent", Redeemed: "secondary", Resolved: "success", "Pending Verification": "warning", Unpaid: "destructive" };

function EvidenceLink({ data, name }) {
  if (!data) return <span className="text-xs text-muted-foreground">No evidence attached</span>;
  return <a className="inline-flex items-center gap-1 text-xs font-medium text-primary underline" href={data} target="_blank" rel="noreferrer"><FileImage className="h-3.5 w-3.5" />View {name || "evidence"}</a>;
}

export default function Approvals() {
  const students = useStudentStore((state) => state.students);
  const approveSemester = useStudentStore((state) => state.approveSemester);
  const updateAccountStatus = useStudentStore((state) => state.updateAccountStatus);
  const routes = useFleetStore((state) => state.routes);
  const {
    feeSchedule, updateFeeSchedule, fineSchedule, updateFineSchedule, semesterPayments, updateSemesterPayment,
    tickets, updateTicketStatus, violations, resolveViolationForUser,
    attachViolationUser,
  } = useTransportWorkflowStore();
  const [seatValues, setSeatValues] = useState({});
  const [feeValues, setFeeValues] = useState(feeSchedule);
  const [fineValues, setFineValues] = useState(fineSchedule);
  const [userToAttach, setUserToAttach] = useState({});

  const saveFees = () => {
    const nextFees = Object.fromEntries(Object.entries(feeValues).map(([key, value]) => [key, value === "" || value == null ? null : Number(value)]));
    if (Object.values(nextFees).some((value) => value != null && (!Number.isFinite(value) || value < 0))) {
      toast.error("Fees must be zero or a positive amount.");
      return;
    }
    updateFeeSchedule(nextFees);
    toast.success("Fee schedule saved for this browser.");
  };

  const saveFines = () => {
    const nextFines = Object.fromEntries(Object.entries(fineValues).map(([key, value]) => [key, Number(value)]));
    if (Object.values(fineValues).some((value) => value === "" || value == null)
      || Object.values(nextFines).some((value) => !Number.isFinite(value) || value < 0)) {
      toast.error("Fine amounts must be zero or a positive amount.");
      return;
    }
    updateFineSchedule(nextFines);
    toast.success("Fine schedule saved for this browser.");
  };

  const approvePayment = (payment) => {
    const rawSeat = seatValues[payment.id] ?? "";
    const seatNo = rawSeat === "" || rawSeat === "unassigned" ? null : Number(rawSeat);
    if (seatNo !== null && (!Number.isInteger(seatNo) || seatNo < 0)) {
      toast.error("Seat must be a positive whole number, 0 for standing, or left blank for unassigned.");
      return;
    }
    approveSemester(payment.userId, {
      seatNo,
      routeId: payment.routeId,
      pickupStop: payment.stopId,
      semester: payment.semester,
    });
    updateSemesterPayment(payment.id, "Approved");
    toast.success(seatNo === 0 ? "Payment approved; standing allocation recorded." : "Payment approved and account activated.");
  };

  const rejectPayment = (payment) => {
    updateSemesterPayment(payment.id, "Rejected", "Please contact the Transport Office and reapply with valid evidence.");
    updateAccountStatus(payment.userId, "Rejected");
    toast.success("Semester application rejected.");
  };

  const resolveFine = (violationId, userId) => {
    resolveViolationForUser(violationId, userId);
    toast.success("Payment verified and fine resolved.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transport Approvals</h1>
        <p className="text-sm text-muted-foreground">Review semester payments, ticket applications and violation evidence.</p>
      </div>
      <Tabs defaultValue="semester">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="semester">Semester ({semesterPayments.filter((record) => record.status === "Pending").length})</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.filter((record) => record.status === "Pending").length})</TabsTrigger>
          <TabsTrigger value="violations">Violations ({violations.filter((record) => record.status !== "Resolved").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="semester" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Semester fee schedule (Rs.)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["FEE_DAY_SCHOLAR", "Student before deadline"],
                  ["FEE_DAY_SCHOLAR_LATE", "Student after deadline"],
                  ["FEE_FACULTY", "Faculty fee"],
                ].map(([key, label]) => (
                  <div className="space-y-1.5" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input id={key} type="number" min="0" value={feeValues[key] ?? ""} placeholder="Set amount" onChange={(event) => setFeeValues((current) => ({ ...current, [key]: event.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["TICKET_ONE_WAY", "Hostelite one-way ticket"],
                  ["TICKET_TWO_WAY", "Hostelite two-way ticket"],
                ].map(([key, label]) => (
                  <div className="space-y-1.5" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input id={key} type="number" min="0" value={feeValues[key] ?? ""} placeholder="Set amount" onChange={(event) => setFeeValues((current) => ({ ...current, [key]: event.target.value }))} />
                  </div>
                ))}
              </div>
              <Button size="sm" onClick={saveFees}>Save fee schedule</Button>
            </CardContent>
          </Card>
          {semesterPayments.length === 0 && <Empty>No semester applications received.</Empty>}
          {semesterPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{payment.name}</strong>
                  <Badge variant={statusVariant[payment.status] || "secondary"}>{payment.status}</Badge>
                  <Badge variant="outline">{payment.userType}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{payment.identifier} · {payment.semester} · {routes.find((route) => route.id === payment.routeId)?.shortName} · {payment.stopId} · Rs. {Number(payment.amount).toLocaleString()}</p>
                <EvidenceLink data={payment.evidenceDataUrl} name={payment.evidenceName} />
                {payment.status === "Pending" && (
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-48 space-y-1">
                      <Label htmlFor={`seat-${payment.id}`}>Seat (0 standing, blank unassigned)</Label>
                      <Input id={`seat-${payment.id}`} type="number" min="0" placeholder="e.g. 12 or 0" value={seatValues[payment.id] ?? ""} onChange={(event) => setSeatValues((current) => ({ ...current, [payment.id]: event.target.value }))} />
                    </div>
                    <Button size="sm" onClick={() => approvePayment(payment)}><BadgeCheck className="mr-1 h-4 w-4" />Approve & assign</Button>
                    <Button size="sm" variant="outline" onClick={() => rejectPayment(payment)}>Reject</Button>
                  </div>
                )}
                {payment.reviewNote && <p className="text-xs text-muted-foreground">{payment.reviewNote}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="tickets" className="space-y-3 pt-4">
          {tickets.length === 0 && <Empty>No ticket requests received.</Empty>}
          {tickets.map((ticket) => (
            <Card key={ticket.id}><CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2"><strong>{ticket.userName}</strong><Badge variant={statusVariant[ticket.status] || "secondary"}>{ticket.status}</Badge><span className="text-sm">{ticket.ticketType === "OneWay" ? "One-way" : "Two-way"} · Rs. {Number(ticket.amount).toLocaleString()}</span></div>
              <p className="text-xs text-muted-foreground">{ticket.identifier} · {routes.find((route) => route.id === ticket.routeId)?.shortName} · {ticket.stopId}</p>
              <EvidenceLink data={ticket.evidenceDataUrl} name={ticket.evidenceName} />
              {ticket.status === "Pending" && <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => { updateTicketStatus(ticket.id, "Active"); toast.success("Ticket approved and QR token issued."); }}>Approve & issue QR</Button>
                <Button size="sm" variant="outline" onClick={() => { updateTicketStatus(ticket.id, "Rejected"); toast.success("Ticket request rejected."); }}>Reject</Button>
              </div>}
              {ticket.scans?.length > 0 && <p className="text-xs text-muted-foreground">Scanned {ticket.scans.length} of {ticket.ticketType === "OneWay" ? 1 : 2} times.</p>}
            </CardContent></Card>
          ))}
        </TabsContent>
        <TabsContent value="violations" className="space-y-3 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Fine schedule (Rs.)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["FINE_1ST", "First strike"],
                  ["FINE_2ND", "Second strike"],
                  ["FINE_3RD", "Third and later strikes"],
                ].map(([key, label]) => (
                  <div className="space-y-1.5" key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input id={key} type="number" min="0" value={fineValues[key] ?? ""} onChange={(event) => setFineValues((current) => ({ ...current, [key]: event.target.value }))} />
                  </div>
                ))}
              </div>
              <Button size="sm" onClick={saveFines}>Save fine schedule</Button>
              <p className="text-xs text-muted-foreground">Initial amounts are demo defaults; set the approved rates before using this prototype.</p>
            </CardContent>
          </Card>
          {violations.length === 0 && <Empty>No violations filed.</Empty>}
          {violations.map((violation) => (
            <Card key={violation.id}><CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2"><strong>{violation.id}</strong><Badge variant={statusVariant[violation.status] || "secondary"}>{violation.status}</Badge></div>
              <p className="text-sm">{violation.description}</p>
              {violation.unregisteredNote && <p className="text-xs text-muted-foreground">Unregistered report: {violation.unregisteredNote}</p>}
              <EvidenceLink data={violation.evidenceDataUrl} name={violation.evidenceName} />
              {violation.users.map((record) => {
                const student = students.find((item) => item.id === record.userId);
                return <div key={record.userId} className="flex flex-wrap items-center gap-2 rounded-md bg-secondary/40 p-2">
                  <span className="text-xs">{student?.name || record.userId} · Strike {record.strike} · Rs. {Number(record.fine).toLocaleString()}</span>
                  <Badge variant={statusVariant[record.paymentStatus] || "secondary"}>{record.paymentStatus}</Badge>
                  <EvidenceLink data={record.paymentEvidence?.dataUrl} name={record.paymentEvidence?.name} />
                  {record.paymentStatus === "Pending Verification" && <Button size="sm" onClick={() => resolveFine(violation.id, record.userId)}>Verify & resolve</Button>}
                </div>;
              })}
              {violation.unregisteredNote && (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-52 flex-1 space-y-1">
                    <Label htmlFor={`attach-${violation.id}`}>Attach later-created user</Label>
                    <select id={`attach-${violation.id}`} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={userToAttach[violation.id] || ""} onChange={(event) => setUserToAttach((current) => ({ ...current, [violation.id]: event.target.value }))}>
                      <option value="">Select user</option>
                      {students.filter((item) => !violation.userIds.includes(item.id)).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.rollNo}</option>)}
                    </select>
                  </div>
                  <Button size="sm" variant="outline" disabled={!userToAttach[violation.id]} onClick={() => { attachViolationUser(violation.id, userToAttach[violation.id]); setUserToAttach((current) => ({ ...current, [violation.id]: "" })); toast.success("User attached to violation."); }}><UserRoundPlus className="mr-1 h-4 w-4" />Attach</Button>
                </div>
              )}
            </CardContent></Card>
          ))}
          <p className="text-xs text-muted-foreground">Fine defaults: first Rs. {fineSchedule.FINE_1ST}, second Rs. {fineSchedule.FINE_2ND}, third+ Rs. {fineSchedule.FINE_3RD}. This is demo data only.</p>
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground">Approval state and uploaded evidence are browser-local in this frontend demo.</p>
    </div>
  );
}

function Empty({ children }) {
  return <Card><CardContent className="p-6 text-sm text-muted-foreground">{children}</CardContent></Card>;
}
