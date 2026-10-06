import { Link } from "react-router-dom";
import { ArrowRight, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";

const STATUS_VARIANT = {
  Pending: "warning",
  Approved: "success",
  Rejected: "destructive",
  Active: "success",
  HalfRedeemed: "accent",
  Redeemed: "secondary",
  Resolved: "success",
  Unpaid: "destructive",
  "Pending Verification": "warning",
};

export default function Payments() {
  const user = useAuthStore((state) => state.user);
  const { semesterPayments, tickets, violations } = useTransportWorkflowStore();
  const isHostelite = user?.role === "HOSTELITE";
  const records = isHostelite
    ? tickets.filter((ticket) => ticket.userId === user?.id)
    : semesterPayments.filter((payment) => payment.userId === user?.id);
  const fines = violations.flatMap((violation) =>
    violation.users
      .filter((record) => record.userId === user?.id)
      .map((record) => ({ ...record, violationId: violation.id }))
  );
  const applyPath = isHostelite ? "/student/tickets" : "/student/semester";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <CreditCard className="h-6 w-6 text-primary" /> Payment Status
        </h1>
        <p className="text-sm text-muted-foreground">
          Review your saved semester applications, ticket requests, and violation fines.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">{isHostelite ? "My ticket requests" : "My semester applications"}</CardTitle>
          <Button asChild size="sm">
            <Link to={applyPath}>{isHostelite ? "Request ticket" : "Apply for semester"}<ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {records.length === 0 && <p className="text-sm text-muted-foreground">No payment requests have been submitted.</p>}
          {records.map((record) => (
            <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <p className="font-medium">{isHostelite ? `${record.ticketType === "OneWay" ? "One-way" : "Two-way"} ticket` : record.semester}</p>
                <p className="text-xs text-muted-foreground">
                  {record.identifier} · {record.routeId} · {record.stopId} · Rs. {Number(record.amount).toLocaleString()}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[record.status] || "secondary"}>{record.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Violation fines</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {fines.length === 0 && <p className="text-sm text-muted-foreground">No violation fines are associated with your account.</p>}
          {fines.map((fine) => (
            <div key={`${fine.violationId}-${fine.userId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <p className="font-medium">{fine.violationId} · Strike {fine.strike}</p>
                <p className="text-xs text-muted-foreground">Rs. {Number(fine.fine).toLocaleString()}</p>
              </div>
              <Badge variant={STATUS_VARIANT[fine.paymentStatus] || "secondary"}>{fine.paymentStatus}</Badge>
            </div>
          ))}
          <Button asChild variant="outline" size="sm">
            <Link to="/student/violations">Upload fine payment evidence</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">Payment requests and statuses are stored only in this browser demo. No fee is charged or verified by this frontend.</p>
    </div>
  );
}
