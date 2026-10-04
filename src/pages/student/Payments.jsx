import { useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  BookOpen,
  Clock,
  FileText,
  ShieldAlert,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useFineStore } from "@/store/useFineStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Payments() {
  const user = useAuthStore((s) => s.user);
  const { fines, clearFine, semesterChallans } = useFineStore();

  const [activeTab, setActiveTab] = useState("fee");
  const [feePaid, setFeePaid] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("jazzcash");
  const [fineTarget, setFineTarget] = useState(null);

  // Active challan from admin (most recent)
  const activeChallan = semesterChallans[0] ?? null;

  const studentFines = user?.rollNo
    ? fines.filter((f) => f.rollNo === user.rollNo)
    : fines.slice(0, 2);

  const paymentHistory = [
    { semester: "Spring 2026", amount: activeChallan?.amount || 5000, date: "2026-02-05", status: "Paid", receiptId: "RCP-SPR-2026" },
    { semester: "Fall 2025", amount: 34000, date: "2025-08-08", status: "Paid", receiptId: "RCP-FALL-2025" },
  ];

  const handlePayFee = () => {
    setFeePaid(true);
    setPayModalOpen(false);
    toast.success(`Payment successful! Transport fee for ${activeChallan?.semester || "current semester"} recorded.`);
    setReceiptModalOpen(true);
  };

  const handlePayFine = () => {
    if (!fineTarget) return;
    clearFine(fineTarget.id);
    toast.success(`Fine #${fineTarget.id} paid successfully.`);
    setFineTarget(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Transport Fee &amp; Fines</h1>
        <p className="text-sm text-muted-foreground">
          View your semester transport fee challan, payment history, and fine clearances.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="fee">Semester Fee</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="fines">Fines &amp; Penalties</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: SEMESTER FEE CHALLAN ── */}
        <TabsContent value="fee" className="space-y-4 mt-4">
          {!activeChallan ? (
            <Card className="border-border">
              <CardContent className="py-16 text-center space-y-3">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="font-semibold text-foreground">No Fee Challan Generated Yet</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  The transport office has not generated a fee challan for the current semester yet.
                  You will receive a notification once it is issued.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {activeChallan.semester} — Semester Transport Fee
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Period: {activeChallan.startDate} to {activeChallan.endDate}
                    </p>
                    {activeChallan.note && (
                      <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {activeChallan.note}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={feePaid ? "success" : "destructive"}
                    className="w-fit text-xs shrink-0"
                  >
                    {feePaid ? "🟢 Paid" : "🔴 Payment Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-secondary/50 p-4 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Semester Fee</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">
                      Rs. {Number(activeChallan.amount).toLocaleString()}/-
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeChallan.semester} Rate
                    </p>
                  </div>

                  <div className="rounded-xl bg-secondary/50 p-4 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Due Date</p>
                    <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {activeChallan.dueDate}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pay before this date</p>
                  </div>

                  <div className="rounded-xl bg-secondary/50 p-4 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Payment Status</p>
                    <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
                      {feePaid ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Cleared
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Pending
                        </span>
                      )}
                    </p>
                    {feePaid && <p className="text-xs text-muted-foreground mt-0.5">Receipt: RCP-{activeChallan.id}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  {feePaid ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Your transport pass is active for {activeChallan.semester}.
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setReceiptModalOpen(true)}>
                        <Receipt className="h-4 w-4 mr-1.5" /> View Receipt
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        ⚠️ Please pay before {activeChallan.dueDate} to avoid transport suspension.
                      </div>
                      <Button onClick={() => setPayModalOpen(true)} className="w-full sm:w-auto">
                        <CreditCard className="h-4 w-4 mr-1.5" /> Pay Fee Now
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB 2: PAYMENT HISTORY ── */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Fee Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Semester</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-xs text-foreground">{item.semester}</TableCell>
                      <TableCell className="text-xs font-bold">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                      <TableCell className="text-xs font-mono text-primary">{item.receiptId}</TableCell>
                      <TableCell>
                        <Badge variant="success">{item.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setReceiptModalOpen(true)}>
                          <Download className="h-3.5 w-3.5 mr-1" /> Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: FINES ── */}
        <TabsContent value="fines" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <ShieldAlert className="h-5 w-5 text-amber-500" /> My Fines &amp; Violation Penalties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentFines.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No fine records found for your account. Maintain good transport discipline!
                </div>
              ) : (
                <div className="space-y-3">
                  {studentFines.map((fine) => (
                    <Card key={fine.id} className="border-border bg-card/60">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">Fine #{fine.id}</span>
                            <Badge variant={fine.status === "Cleared" ? "success" : "destructive"}>
                              {fine.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug">{fine.reason}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Issued: {formatDate(fine.date)} &bull; Roll No: {fine.rollNo}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold text-foreground">
                            {formatCurrency(fine.amount)}
                          </span>
                          {fine.status !== "Cleared" && (
                            <Button size="sm" onClick={() => setFineTarget(fine)}>
                              Pay Fine
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Pay Fee Modal ── */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Semester Transport Fee</DialogTitle>
            <DialogDescription>
              Select your payment method for{" "}
              {activeChallan?.semester || "current semester"} (Rs.{" "}
              {activeChallan ? Number(activeChallan.amount).toLocaleString() : "—"}/-).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Select Payment Method</label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jazzcash">JazzCash Mobile Wallet</SelectItem>
                  <SelectItem value="easypaisa">EasyPaisa Mobile Wallet</SelectItem>
                  <SelectItem value="card">Debit / Credit Card (Visa/Mastercard)</SelectItem>
                  <SelectItem value="bank">Direct Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border border-border p-3.5 bg-secondary/30 text-xs space-y-1">
              <p><span className="font-semibold">Student Name:</span> {user?.name || "—"}</p>
              <p><span className="font-semibold">Roll Number:</span> {user?.rollNo || "—"}</p>
              <p><span className="font-semibold">Semester:</span> {activeChallan?.semester || "—"}</p>
              <p>
                <span className="font-semibold">Total Payable:</span>{" "}
                Rs. {activeChallan ? Number(activeChallan.amount).toLocaleString() : "—"}/-
              </p>
              <p><span className="font-semibold">Due Date:</span> {activeChallan?.dueDate || "—"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>Cancel</Button>
            <Button onClick={handlePayFee}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pay Fine Modal ── */}
      <Dialog open={!!fineTarget} onOpenChange={(o) => !o && setFineTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Fine #{fineTarget?.id}</DialogTitle>
            <DialogDescription>Clear penalty fee for {fineTarget?.reason}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p><span className="font-semibold">Amount Due:</span> {formatCurrency(fineTarget?.amount || 0)}</p>
            <p><span className="font-semibold">Reason:</span> {fineTarget?.reason}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFineTarget(null)}>Cancel</Button>
            <Button onClick={handlePayFine}>Confirm Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Receipt Modal ── */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" /> Official Transport Fee Receipt
            </DialogTitle>
            <DialogDescription>FAST NUCES CFD Transport Office</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl border border-border p-4 bg-card text-xs">
            <div className="flex justify-between border-b border-border pb-2 font-bold">
              <span>Receipt ID: RCP-{activeChallan?.id || "2026"}</span>
              <span className="text-emerald-600">STATUS: PAID</span>
            </div>
            <div className="space-y-1 text-muted-foreground">
              <p><span className="font-semibold text-foreground">Student Name:</span> {user?.name || "—"}</p>
              <p><span className="font-semibold text-foreground">Roll No:</span> {user?.rollNo || "—"}</p>
              <p><span className="font-semibold text-foreground">Semester:</span> {activeChallan?.semester || "—"}</p>
              <p>
                <span className="font-semibold text-foreground">Amount Paid:</span>{" "}
                Rs. {activeChallan ? Number(activeChallan.amount).toLocaleString() : "—"}/-
              </p>
              <p><span className="font-semibold text-foreground">Payment Date:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { toast.success("Receipt downloaded as PDF."); setReceiptModalOpen(false); }}>
              <Download className="h-4 w-4 mr-1.5" /> Download PDF Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
