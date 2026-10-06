import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Ticket, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { BANK_ACCOUNTS } from "@/data/bankAccounts";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("Unable to read ticket payment evidence."));
    reader.onerror = () => reject(new Error("Unable to read ticket payment evidence."));
    reader.readAsDataURL(file);
  });
}

export default function Tickets() {
  const user = useAuthStore((state) => state.user);
  const routes = useFleetStore((state) => state.routes);
  const tickets = useTransportWorkflowStore((state) => state.tickets);
  const requestTicket = useTransportWorkflowStore((state) => state.requestTicket);
  const ticketFees = useTransportWorkflowStore((state) => state.feeSchedule);
  const myTickets = tickets.filter((ticket) => ticket.userId === user?.id);
  const [routeId, setRouteId] = useState("");
  const [stopId, setStopId] = useState("");
  const [ticketType, setTicketType] = useState("OneWay");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const route = routes.find((item) => item.id === routeId);
  const priceKey = ticketType === "OneWay" ? "TICKET_ONE_WAY" : "TICKET_TWO_WAY";
  const price = ticketFees[priceKey];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (user?.role !== "HOSTELITE") {
      toast.error("On-demand tickets are for Hostelites. Day Scholars use semester registration.");
      return;
    }
    if (!routeId || !stopId || !evidenceFile) {
      toast.error("Select a route and stop and attach payment evidence.");
      return;
    }
    if (!evidenceFile.type.startsWith("image/") || evidenceFile.size > 1024 * 1024) {
      toast.error("Upload a payment image no larger than 1 MB.");
      return;
    }
    if (!price || price <= 0) {
      toast.error("Ticket pricing is not configured by Admin yet.");
      return;
    }

    setSubmitting(true);
    try {
      const evidenceDataUrl = await fileToDataUrl(evidenceFile);
      requestTicket({
        userId: user.id,
        userName: user.name,
        identifier: user.rollNo || user.loginId,
        routeId,
        stopId,
        ticketType,
        amount: price,
        evidenceName: evidenceFile.name,
        evidenceDataUrl,
      });
      toast.success("Ticket request submitted for admin approval.");
      setEvidenceFile(null);
    } catch (error) {
      toast.error(error.message || "Unable to submit ticket request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== "HOSTELITE") {
    return <Card><CardContent className="p-8 text-center"><p className="font-semibold">On-demand tickets are for Hostelites</p><p className="mt-1 text-sm text-muted-foreground">Use semester transport registration for a day-scholar or faculty pass.</p></CardContent></Card>;
  }

  const statusVariant = { Active: "success", Pending: "warning", HalfRedeemed: "accent", Redeemed: "secondary", Rejected: "destructive", Cancelled: "secondary" };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hostelite Tickets</h1>
        <p className="text-sm text-muted-foreground">Request a one-way or two-way ticket, then show its QR to the conductor after approval.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bank transfer details</CardTitle>
          <p className="text-xs text-muted-foreground">Transfer the configured ticket fee to one of these accounts, then upload your payment evidence.</p>
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
          <p className="text-xs text-muted-foreground sm:col-span-2">Payment is not processed or verified by this frontend demo. Confirm the fee and account details with the Transport Office.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Request a ticket</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="ticket-route">Route</Label>
                <select id="ticket-route" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={routeId} onChange={(event) => { setRouteId(event.target.value); setStopId(""); }} required>
                  <option value="">Select route</option>
                  {routes.map((item) => <option key={item.id} value={item.id}>{item.shortName || item.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ticket-stop">Pickup stop</Label>
                <select id="ticket-stop" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={stopId} onChange={(event) => setStopId(event.target.value)} disabled={!route} required>
                  <option value="">Select stop</option>
                  {(route?.stops || []).map((stop, index) => <option key={`${routeId}-${index}`} value={stop.name}>{stop.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ticket-type">Ticket type</Label>
                <select id="ticket-type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={ticketType} onChange={(event) => setTicketType(event.target.value)}>
                  <option value="OneWay">One-way</option>
                  <option value="TwoWay">Two-way</option>
                </select>
              </div>
            </div>
            <p className="text-sm">Ticket fee: <strong>{price ? `Rs. ${Number(price).toLocaleString()}/-` : "Awaiting Admin configuration"}</strong></p>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-evidence">Payment evidence</Label>
              <Input id="ticket-evidence" type="file" accept="image/*" required onChange={(event) => setEvidenceFile(event.target.files?.[0] || null)} />
              {evidenceFile && <p className="text-xs text-muted-foreground"><Upload className="mr-1 inline h-3 w-3" />{evidenceFile.name}</p>}
              <p className="text-xs text-muted-foreground">Image only, max 1 MB. Admin approval is required before the QR ticket is issued.</p>
            </div>
            <Button type="submit" disabled={submitting || !price}>{submitting ? "Submitting..." : "Request ticket"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">My tickets</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {myTickets.length === 0 && <p className="text-sm text-muted-foreground">No tickets requested yet.</p>}
          {myTickets.map((ticket) => (
            <div key={ticket.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-primary" /><p className="font-semibold">{ticket.ticketType === "OneWay" ? "One-way" : "Two-way"} ticket</p><Badge variant={statusVariant[ticket.status] || "secondary"}>{ticket.status}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{routes.find((item) => item.id === ticket.routeId)?.shortName} · {ticket.stopId} · Rs. {Number(ticket.amount).toLocaleString()}</p>
                {ticket.status === "HalfRedeemed" && <p className="mt-1 text-xs text-amber-700">First leg scanned; one more scan remains.</p>}
              </div>
              {ticket.qrToken && ["Active", "HalfRedeemed"].includes(ticket.status) && (
                <div className="self-center rounded-md bg-white p-2">
                  <QRCodeSVG value={JSON.stringify({ type: "SMARTU_TICKET", token: ticket.qrToken })} size={112} />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Ticket records and evidence are stored locally in this browser for demo purposes.</p>
    </div>
  );
}
