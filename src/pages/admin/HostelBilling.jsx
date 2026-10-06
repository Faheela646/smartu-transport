import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarRange,
  FileText,
  Receipt,
  RefreshCw,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudentStore } from "@/store/useStudentStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { useFleetStore } from "@/store/useFleetStore";
import { transportService } from "@/api/transportService";

const BILL_STATUS_VARIANT = {
  Pending: "warning",
  Paid: "success",
  Overdue: "destructive",
};

function formatMonth(billingMonth) {
  if (!billingMonth) return "";
  const [year, month] = billingMonth.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function HostelBilling() {
  const students = useStudentStore((state) => state.students);
  const hostelStudents = students.filter((s) => s.role === "HOSTELITE");
  const routes = useFleetStore((state) => state.routes);

  const hostelTransportLogs = useTransportWorkflowStore((state) => state.hostelTransportLogs);
  const hostelMonthlyBills = useTransportWorkflowStore((state) => state.hostelMonthlyBills);
  const generateHostelMonthlyBill = useTransportWorkflowStore((state) => state.generateHostelMonthlyBill);
  const updateHostelBillStatus = useTransportWorkflowStore((state) => state.updateHostelBillStatus);

  const [billFilterStudent, setBillFilterStudent] = useState("all");
  const [billFilterMonth, setBillFilterMonth] = useState("");
  const [logFilterStudent, setLogFilterStudent] = useState("all");
  const [logFilterMonth, setLogFilterMonth] = useState("");
  const [genStudentId, setGenStudentId] = useState("");
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);

  // All unique billing months from logs
  const allBillingMonths = useMemo(() => {
    const months = [...new Set((hostelTransportLogs || []).map((l) => l.billingMonth))].sort().reverse();
    return months;
  }, [hostelTransportLogs]);

  // Filtered transport logs
  const filteredLogs = useMemo(() => {
    const seen = new Set();
    return (hostelTransportLogs || [])
      .filter((log) => {
        if (logFilterStudent !== "all" && log.studentId !== logFilterStudent) return false;
        if (logFilterMonth && log.billingMonth !== logFilterMonth) return false;
        return true;
      })
      .filter((log) => {
        const key = log.bookingId || log.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [hostelTransportLogs, logFilterStudent, logFilterMonth]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return (hostelMonthlyBills || []).filter((bill) => {
      if (billFilterStudent !== "all" && bill.studentId !== billFilterStudent) return false;
      if (billFilterMonth && bill.billingMonth !== billFilterMonth) return false;
      return true;
    });
  }, [hostelMonthlyBills, billFilterStudent, billFilterMonth]);

  const handleGenerateBill = async () => {
    if (!genStudentId) {
      toast.error("Select a hostelite student.");
      return;
    }
    if (!genMonth) {
      toast.error("Select a billing month.");
      return;
    }
    setGenerating(true);
    try {
      const student = hostelStudents.find((s) => s.id === genStudentId);
      const result = await transportService.generateHostelMonthlyBill(genStudentId, genMonth, student);
      if (result.success) {
        toast.success(`Bill generated for ${student?.name} — ${formatMonth(genMonth)}.`);
      } else {
        toast.error(result.error || "Could not generate bill.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate bill.");
    } finally {
      setGenerating(false);
    }
  };

  const handleBillStatusUpdate = async (billId, status) => {
    await transportService.updateHostelBillStatus(billId, status);
    toast.success(`Bill status updated to ${status}.`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hostel Transport Billing</h1>
        <p className="text-sm text-muted-foreground">
          View transport logs, monthly bills, and billing breakdowns for hostelite students.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary opacity-80" />
              <div>
                <p className="text-xs text-muted-foreground">Hostelite Students</p>
                <p className="text-2xl font-bold">{hostelStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarRange className="h-8 w-8 text-primary opacity-80" />
              <div>
                <p className="text-xs text-muted-foreground">Approved Booking Logs</p>
                <p className="text-2xl font-bold">{(hostelTransportLogs || []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-primary opacity-80" />
              <div>
                <p className="text-xs text-muted-foreground">Monthly Bills Generated</p>
                <p className="text-2xl font-bold">{(hostelMonthlyBills || []).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Transport Logs</TabsTrigger>
          <TabsTrigger value="bills">Monthly Bills</TabsTrigger>
          <TabsTrigger value="generate">Generate Bill</TabsTrigger>
        </TabsList>

        {/* ── TRANSPORT LOGS ── */}
        <TabsContent value="logs" className="space-y-4 pt-4">
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="log-filter-student">Student</Label>
                <Select value={logFilterStudent} onValueChange={setLogFilterStudent}>
                  <SelectTrigger id="log-filter-student">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All hostelites</SelectItem>
                    {hostelStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.rollNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="log-filter-month">Billing month</Label>
                <Select value={logFilterMonth} onValueChange={setLogFilterMonth}>
                  <SelectTrigger id="log-filter-month">
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All months</SelectItem>
                    {allBillingMonths.map((m) => (
                      <SelectItem key={m} value={m}>
                        {formatMonth(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No approved transport logs match the selected filters.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Booking ID</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Student</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Route</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Bus</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Trip Type</th>
                    <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Fare</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Billing Month</th>
                    <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Approved At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-secondary/20">
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{log.bookingId}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{log.studentName}</p>
                        <p className="text-xs text-muted-foreground">{log.identifier}</p>
                      </td>
                      <td className="px-3 py-2">{log.date}</td>
                      <td className="px-3 py-2">{log.routeName || log.routeId}</td>
                      <td className="px-3 py-2 text-muted-foreground">{log.busPlate || log.busId || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={log.tripType === "Two Way" ? "accent" : "secondary"} className="text-xs">
                          {log.tripType}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">Rs. {(log.fare || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-xs">{formatMonth(log.billingMonth)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {log.approvedAt ? new Date(log.approvedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Each row represents a unique admin-approved booking. Duplicate booking IDs cannot appear — the
            system prevents double-counting.
          </p>
        </TabsContent>

        {/* ── MONTHLY BILLS ── */}
        <TabsContent value="bills" className="space-y-4 pt-4">
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="bill-filter-student">Student</Label>
                <Select value={billFilterStudent} onValueChange={setBillFilterStudent}>
                  <SelectTrigger id="bill-filter-student">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All hostelites</SelectItem>
                    {hostelStudents.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.rollNo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bill-filter-month">Billing month</Label>
                <Select value={billFilterMonth} onValueChange={setBillFilterMonth}>
                  <SelectTrigger id="bill-filter-month">
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All months</SelectItem>
                    {allBillingMonths.map((m) => (
                      <SelectItem key={m} value={m}>
                        {formatMonth(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredBills.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No monthly bills found. Use the "Generate Bill" tab to create bills.
              </CardContent>
            </Card>
          ) : (
            filteredBills.map((bill) => {
              const student = students.find((s) => s.id === bill.studentId);
              const billLogs = (hostelTransportLogs || []).filter((log) =>
                (bill.bookingIds || []).includes(log.bookingId),
              );
              return (
                <Card key={bill.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {bill.studentName}
                          <span className="font-normal text-muted-foreground text-sm">
                            ({bill.rollNo})
                          </span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {bill.monthLabel} · Generated{" "}
                          {bill.generatedAt ? new Date(bill.generatedAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <Badge variant={BILL_STATUS_VARIANT[bill.status] || "secondary"}>
                        {bill.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Billing breakdown */}
                    <div className="rounded-md bg-secondary/30 p-3 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          One Way trips ({bill.oneWayCount} × Rs. {bill.oneWayRate})
                        </span>
                        <span className="font-medium">Rs. {bill.oneWaySubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Two Way trips ({bill.twoWayCount} × Rs. {bill.twoWayRate})
                        </span>
                        <span className="font-medium">Rs. {bill.twoWaySubtotal.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-border pt-1.5 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-primary">Rs. {bill.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Trip breakdown */}
                    {billLogs.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Approved trips:</p>
                        <div className="overflow-x-auto rounded border border-border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border bg-secondary/30">
                                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Booking ID</th>
                                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Date</th>
                                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Route</th>
                                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Type</th>
                                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Fare</th>
                              </tr>
                            </thead>
                            <tbody>
                              {billLogs.map((log) => (
                                <tr key={log.id} className="border-b border-border last:border-0">
                                  <td className="px-2 py-1.5 font-mono text-muted-foreground">{log.bookingId}</td>
                                  <td className="px-2 py-1.5">{log.date}</td>
                                  <td className="px-2 py-1.5">{log.routeName || log.routeId}</td>
                                  <td className="px-2 py-1.5">
                                    <Badge
                                      variant={log.tripType === "Two Way" ? "accent" : "secondary"}
                                      className="text-xs"
                                    >
                                      {log.tripType}
                                    </Badge>
                                  </td>
                                  <td className="px-2 py-1.5 text-right">Rs. {(log.fare || 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Status actions */}
                    {bill.status === "Pending" && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleBillStatusUpdate(bill.id, "Paid")}
                        >
                          Mark as Paid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBillStatusUpdate(bill.id, "Overdue")}
                        >
                          Mark Overdue
                        </Button>
                      </div>
                    )}
                    {bill.status === "Overdue" && (
                      <Button
                        size="sm"
                        onClick={() => handleBillStatusUpdate(bill.id, "Paid")}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── GENERATE BILL ── */}
        <TabsContent value="generate" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate Monthly Transport Bill</CardTitle>
              <p className="text-xs text-muted-foreground">
                Select a hostelite student and a billing month to generate their monthly transport bill based
                on admin-approved booking logs for that month.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="gen-student">Student</Label>
                  <Select value={genStudentId} onValueChange={setGenStudentId}>
                    <SelectTrigger id="gen-student">
                      <SelectValue placeholder="Select hostelite" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostelStudents.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.rollNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gen-month">Billing Month</Label>
                  <Input
                    id="gen-month"
                    type="month"
                    value={genMonth}
                    onChange={(e) => setGenMonth(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview */}
              {genStudentId && genMonth && (
                <div className="rounded-md bg-secondary/30 p-4 space-y-2 text-sm">
                  <p className="font-medium">Preview for {hostelStudents.find((s) => s.id === genStudentId)?.name} — {formatMonth(genMonth)}:</p>
                  {(() => {
                    const logs = (hostelTransportLogs || []).filter(
                      (log) => log.studentId === genStudentId && log.billingMonth === genMonth,
                    );
                    // Deduplicate
                    const seen = new Set();
                    const dedupedLogs = logs.filter((log) => {
                      const key = log.bookingId || log.id;
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    });
                    const oneWay = dedupedLogs.filter((l) => (l.tripType || "").toLowerCase() === "one way").length;
                    const twoWay = dedupedLogs.filter((l) => (l.tripType || "").toLowerCase() === "two way").length;
                    const total = oneWay * 250 + twoWay * 400;
                    const existingBill = (hostelMonthlyBills || []).find(
                      (b) => b.studentId === genStudentId && b.billingMonth === genMonth,
                    );
                    if (existingBill) {
                      return (
                        <p className="text-amber-600 text-sm font-medium">
                          A bill already exists for this student and month (Rs. {existingBill.totalAmount.toLocaleString()}).
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">{dedupedLogs.length} approved trip(s) found</p>
                        <p>One Way: {oneWay} × Rs. 250 = Rs. {(oneWay * 250).toLocaleString()}</p>
                        <p>Two Way: {twoWay} × Rs. 400 = Rs. {(twoWay * 400).toLocaleString()}</p>
                        <p className="font-bold text-primary pt-1">Total: Rs. {total.toLocaleString()}</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <Button
                onClick={handleGenerateBill}
                disabled={!genStudentId || !genMonth || generating}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generating…" : "Generate Bill"}
              </Button>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Bills are calculated from the hostel transport log. The same approved booking will never be
            counted twice (duplicate-prevention is enforced by the unique bookingId).
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
