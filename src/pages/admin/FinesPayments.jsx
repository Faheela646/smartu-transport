import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Bell,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STUDENTS, FINES } from "@/data/mockData";
import { useFineStore } from "@/store/useFineStore";
import { useSocketStore } from "@/store/useSocketStore";

// ─── helpers ────────────────────────────────────────────────────────────────
const STATUS_META = {
  Unpaid: {
    label: "Unpaid",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: Ban,
  },
  "Pending Approval": {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
  },
  Cleared: {
    label: "Cleared",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircle2,
  },
  Paid: {
    label: "Paid",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: BadgeCheck,
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META["Unpaid"];
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.color}`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

const FINE_REASONS = [
  "Late Cancellation Penalty",
  "Missed Boarding — No Show",
  "Damaged Seat / Property",
  "Unpaid Semester Transport Fee",
  "Misconduct on Bus",
  "Unauthorized Route Change",
  "Other",
];

// Auto-detect the current semester from today's date
function detectSemester() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 8 || month === 1) {
    const startYear = month >= 8 ? year : year - 1;
    return {
      label: `Fall ${startYear}`,
      type: "FALL",
      startDate: `${startYear}-08-01`,
      endDate: `${startYear + 1}-01-31`,
    };
  }
  return {
    label: `Spring ${year}`,
    type: "SPRING",
    startDate: `${year}-02-01`,
    endDate: `${year}-06-30`,
  };
}

// ─── main component ──────────────────────────────────────────────────────────
export default function FinesPayments() {
  // ── stores ──
  const { addSemesterChallan, semesterChallans } = useFineStore();
  const triggerEvent = useSocketStore((s) => s.triggerEvent);

  // ── fines local state (uses useFineStore for add, but page keeps own list) ──
  const [fines, setFines] = useState(() => FINES.map((f) => ({ ...f })));

  // ── UI state ──
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChallanModal, setShowChallanModal] = useState(false);

  // ── challan form ──
  const detectedSem = detectSemester();
  const [challanForm, setChallanForm] = useState({
    semester: detectedSem.label,
    semesterType: detectedSem.type,
    amount: "",
    startDate: detectedSem.startDate,
    endDate: detectedSem.endDate,
    dueDate: "",
    note: "",
  });
  const [challanErr, setChallanErr] = useState({});

  // ── add-fine form ──
  const emptyForm = {
    rollNo: "",
    reason: FINE_REASONS[0],
    customReason: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  };
  const [form, setForm] = useState(emptyForm);
  const [formErr, setFormErr] = useState({});

  // ── student data ──
  const studentMap = useMemo(() => {
    const m = {};
    STUDENTS.forEach((s) => { m[s.rollNo] = s; });
    try {
      const raw = localStorage.getItem("smartu-students");
      if (raw) {
        const parsed = JSON.parse(raw);
        (parsed?.state?.students || []).forEach((s) => { m[s.rollNo] = s; });
      }
    } catch (_) {}
    return m;
  }, []);

  const allStudents = useMemo(() => Object.values(studentMap), [studentMap]);

  // ── filtered fines ──
  const filteredFines = useMemo(() => {
    const q = search.toLowerCase();
    return fines.filter((f) => {
      const stu = studentMap[f.rollNo];
      const matchQ =
        !q ||
        f.rollNo.toLowerCase().includes(q) ||
        (stu?.name || "").toLowerCase().includes(q) ||
        f.reason.toLowerCase().includes(q);
      const matchStatus = filterStatus === "All" || f.status === filterStatus;
      return matchQ && matchStatus;
    });
  }, [fines, search, filterStatus, studentMap]);

  // ── stats ──
  const stats = useMemo(() => {
    const total = fines.reduce((s, f) => s + Number(f.amount), 0);
    const unpaid = fines
      .filter((f) => f.status === "Unpaid")
      .reduce((s, f) => s + Number(f.amount), 0);
    const pending = fines.filter((f) => f.status === "Pending Approval").length;
    const cleared = fines.filter((f) => f.status === "Cleared").length;
    return { total, unpaid, pending, cleared };
  }, [fines]);

  // ── actions ──
  const updateStatus = (id, newStatus) => {
    setFines((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
    toast.success(`Fine status updated to "${newStatus}".`);
  };

  const deleteFine = (id) => {
    setFines((prev) => prev.filter((f) => f.id !== id));
    toast.success("Fine record removed.");
  };

  const validateFineForm = () => {
    const errs = {};
    if (!form.rollNo) errs.rollNo = "Select a student.";
    const amt = Number(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = "Enter a valid amount.";
    if (!form.date) errs.date = "Pick a date.";
    if (form.reason === "Other" && !form.customReason.trim())
      errs.customReason = "Provide a reason.";
    return errs;
  };

  const handleAddFine = () => {
    const errs = validateFineForm();
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    const newId = `FIN-${String(fines.length + 1).padStart(3, "0")}`;
    const reason = form.reason === "Other" ? form.customReason.trim() : form.reason;
    setFines((prev) => [
      ...prev,
      { id: newId, rollNo: form.rollNo, reason, amount: Number(form.amount), status: "Unpaid", date: form.date },
    ]);
    toast.success(`Fine issued to ${studentMap[form.rollNo]?.name || form.rollNo}.`);
    setForm(emptyForm);
    setFormErr({});
    setShowAddModal(false);
  };

  const validateChallanForm = () => {
    const errs = {};
    const amt = Number(challanForm.amount);
    if (!challanForm.amount || isNaN(amt) || amt <= 0) errs.amount = "Enter a valid fee amount.";
    if (!challanForm.startDate) errs.startDate = "Required.";
    if (!challanForm.endDate) errs.endDate = "Required.";
    if (!challanForm.dueDate) errs.dueDate = "Required.";
    if (challanForm.semester.trim() === "") errs.semester = "Enter semester name.";
    return errs;
  };

  const handleGenerateChallan = () => {
    const errs = validateChallanForm();
    if (Object.keys(errs).length) { setChallanErr(errs); return; }

    const challan = {
      semester: challanForm.semester.trim(),
      semesterType: challanForm.semesterType,
      amount: Number(challanForm.amount),
      startDate: challanForm.startDate,
      endDate: challanForm.endDate,
      dueDate: challanForm.dueDate,
      note: challanForm.note.trim(),
      studentCount: allStudents.length,
    };

    // Save to store (student Payments page reads this)
    addSemesterChallan(challan);

    // Push announcement notification to all students via socket store
    triggerEvent("ANNOUNCEMENT", {
      audienceLabel: "All Students — Fee Challan",
      message: `📢 Transport fee challan for ${challan.semester} has been generated. The fee is Rs. ${Number(challan.amount).toLocaleString()}/-. ${challan.note ? challan.note + " " : ""}Please pay by ${challan.dueDate} to avoid penalties.`,
    });

    toast.success(
      `Challans generated for ${allStudents.length} students. Announcement sent!`,
      { duration: 6000 }
    );

    setShowChallanModal(false);
    setChallanErr({});
  };

  // Semester quick-select helper
  const applySemesterPreset = (type) => {
    const now = new Date();
    const year = now.getFullYear();
    if (type === "FALL") {
      setChallanForm((p) => ({
        ...p,
        semester: `Fall ${year}`,
        semesterType: "FALL",
        startDate: `${year}-08-01`,
        endDate: `${year + 1}-01-31`,
      }));
    } else {
      setChallanForm((p) => ({
        ...p,
        semester: `Spring ${year}`,
        semesterType: "SPRING",
        startDate: `${year}-02-01`,
        endDate: `${year}-06-30`,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Fines &amp; Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student fines, grant clearances, and generate semester bus-fee challans.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setShowChallanModal(true)}
          >
            <FileText className="h-4 w-4" />
            Generate Bus Fee Challan
          </Button>
          <Button className="gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Issue Fine
          </Button>
        </div>
      </div>

      {/* ── Recent challan banner ── */}
      {semesterChallans.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Last Challan: {semesterChallans[0].semester}
              </p>
              <p className="text-xs text-muted-foreground">
                Rs. {Number(semesterChallans[0].amount).toLocaleString()}/- per student &bull; Due:{" "}
                {semesterChallans[0].dueDate} &bull; {semesterChallans[0].studentCount} students
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-3 w-3" /> Challan Sent
          </span>
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Fines Raised",
            value: `PKR ${stats.total.toLocaleString()}`,
            icon: DollarSign,
            color: "text-primary",
          },
          {
            label: "Outstanding (Unpaid)",
            value: `PKR ${stats.unpaid.toLocaleString()}`,
            icon: AlertTriangle,
            color: "text-red-500",
          },
          {
            label: "Pending Approval",
            value: stats.pending,
            icon: Clock,
            color: "text-amber-500",
          },
          {
            label: "Cleared / Resolved",
            value: stats.cleared,
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-secondary ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-2xl font-bold">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student name or roll no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "Unpaid", "Pending Approval", "Cleared", "Paid"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fines table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Fine ID</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Roll No</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Reason</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFines.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <Filter className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    No fines match your search.
                  </td>
                </tr>
              )}
              {filteredFines.map((fine) => {
                const stu = studentMap[fine.rollNo];
                return (
                  <tr key={fine.id} className="border-b border-border/60 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fine.id}</td>
                    <td className="px-4 py-3 font-medium">{stu?.name || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{fine.rollNo}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground" title={fine.reason}>
                      {fine.reason}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      PKR {Number(fine.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fine.date}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={fine.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => updateStatus(fine.id, "Paid")} className="text-blue-600">
                            <BadgeCheck className="mr-2 h-4 w-4" /> Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(fine.id, "Cleared")} className="text-emerald-600">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Grant Clearance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(fine.id, "Pending Approval")} className="text-amber-600">
                            <Clock className="mr-2 h-4 w-4" /> Set Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(fine.id, "Unpaid")} className="text-red-500">
                            <Ban className="mr-2 h-4 w-4" /> Mark Unpaid
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteFine(fine.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Fine
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredFines.length > 0 && (
          <div className="border-t border-border/60 bg-secondary/10 px-4 py-2 text-xs text-muted-foreground">
            Showing {filteredFines.length} of {fines.length} fine records
          </div>
        )}
      </div>

      {/* ── Challan history table ── */}
      {semesterChallans.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Semester Challan History
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Semester</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Period</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Fee / Student</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Students</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total Expected</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Generated At</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterChallans.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-semibold">{c.semester}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{c.startDate} → {c.endDate}</td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        Rs. {Number(c.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">{c.dueDate}</td>
                      <td className="px-4 py-3 text-right">{c.studentCount}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        Rs. {(c.studentCount * c.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(c.generatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL — Issue Fine
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Issue Fine
              </div>
              <button
                onClick={() => { setShowAddModal(false); setFormErr({}); setForm(emptyForm); }}
                className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Student *</label>
                <select
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form.rollNo}
                  onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))}
                >
                  <option value="">— Select student —</option>
                  {allStudents.map((s) => (
                    <option key={s.rollNo} value={s.rollNo}>
                      {s.name} ({s.rollNo})
                    </option>
                  ))}
                </select>
                {formErr.rollNo && <p className="mt-1 text-xs text-destructive">{formErr.rollNo}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Reason *</label>
                <select
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                >
                  {FINE_REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
              {form.reason === "Other" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Custom Reason *</label>
                  <Input
                    placeholder="Describe the reason…"
                    value={form.customReason}
                    onChange={(e) => setForm((p) => ({ ...p, customReason: e.target.value }))}
                  />
                  {formErr.customReason && <p className="mt-1 text-xs text-destructive">{formErr.customReason}</p>}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Amount (PKR) *</label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 500"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
                {formErr.amount && <p className="mt-1 text-xs text-destructive">{formErr.amount}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Fine Date *</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
                {formErr.date && <p className="mt-1 text-xs text-destructive">{formErr.date}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => { setShowAddModal(false); setFormErr({}); setForm(emptyForm); }}>
                Cancel
              </Button>
              <Button className="gap-2" onClick={handleAddFine}>
                <AlertTriangle className="h-4 w-4" /> Issue Fine
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL — Generate Semester Bus Fee Challan
      ═══════════════════════════════════════════════════════════════════ */}
      {showChallanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border px-6 py-4 bg-card">
              <div className="flex items-center gap-2 font-bold text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Generate Semester Bus Fee Challan
              </div>
              <button
                onClick={() => { setShowChallanModal(false); setChallanErr({}); }}
                className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Info banner */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Bulk Semester Challan</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Challans will be generated for all <strong>{allStudents.length}</strong> registered bus students in
                    one go. You set the semester, fee amount, and payment dates. An announcement notification
                    will be automatically sent to all students.
                  </p>
                </div>
              </div>

              {/* Semester quick-select */}
              <div>
                <label className="mb-2 block text-sm font-semibold">Semester *</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => applySemesterPreset("FALL")}
                    className={`flex-1 rounded-lg border py-2 px-3 text-sm font-medium transition-colors ${
                      challanForm.semesterType === "FALL"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-secondary/30 hover:bg-secondary"
                    }`}
                  >
                    🍂 Fall (Aug – Jan)
                  </button>
                  <button
                    type="button"
                    onClick={() => applySemesterPreset("SPRING")}
                    className={`flex-1 rounded-lg border py-2 px-3 text-sm font-medium transition-colors ${
                      challanForm.semesterType === "SPRING"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-secondary/30 hover:bg-secondary"
                    }`}
                  >
                    🌸 Spring (Feb – Jun)
                  </button>
                </div>
                <Input
                  placeholder="e.g. Fall 2026"
                  value={challanForm.semester}
                  onChange={(e) => setChallanForm((p) => ({ ...p, semester: e.target.value }))}
                />
                {challanErr.semester && <p className="mt-1 text-xs text-destructive">{challanErr.semester}</p>}
              </div>

              {/* Fee amount */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Transport Fee per Student (Rs.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Rs.</span>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 38500"
                    className="pl-10 font-semibold"
                    value={challanForm.amount}
                    onChange={(e) => setChallanForm((p) => ({ ...p, amount: e.target.value }))}
                  />
                </div>
                {challanErr.amount && <p className="mt-1 text-xs text-destructive">{challanErr.amount}</p>}
                {challanForm.amount && !isNaN(Number(challanForm.amount)) && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Total expected revenue:{" "}
                    <span className="font-bold text-primary">
                      Rs. {(allStudents.length * Number(challanForm.amount)).toLocaleString()}/-
                    </span>{" "}
                    ({allStudents.length} students)
                  </p>
                )}
              </div>

              {/* Semester dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold flex items-center gap-1.5">
                    <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" /> Semester Start Date *
                  </label>
                  <Input
                    type="date"
                    value={challanForm.startDate}
                    onChange={(e) => setChallanForm((p) => ({ ...p, startDate: e.target.value }))}
                  />
                  {challanErr.startDate && <p className="mt-1 text-xs text-destructive">{challanErr.startDate}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold flex items-center gap-1.5">
                    <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" /> Semester End Date *
                  </label>
                  <Input
                    type="date"
                    value={challanForm.endDate}
                    onChange={(e) => setChallanForm((p) => ({ ...p, endDate: e.target.value }))}
                  />
                  {challanErr.endDate && <p className="mt-1 text-xs text-destructive">{challanErr.endDate}</p>}
                </div>
              </div>

              {/* Due date */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold">Fee Payment Due Date *</label>
                <Input
                  type="date"
                  value={challanForm.dueDate}
                  onChange={(e) => setChallanForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
                {challanErr.dueDate && <p className="mt-1 text-xs text-destructive">{challanErr.dueDate}</p>}
              </div>

              {/* Custom note */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Custom Announcement Note <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. The transport fee for Fall 2026 has been revised to Rs. 38,500/-."
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  value={challanForm.note}
                  onChange={(e) => setChallanForm((p) => ({ ...p, note: e.target.value }))}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  This note will be included in the notification sent to all students.
                </p>
              </div>

              {/* Student preview */}
              <div>
                <p className="mb-2 text-sm font-semibold flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" /> Students Covered ({allStudents.length})
                </p>
                <div className="rounded-xl border border-border overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Roll No</th>
                        <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStudents.map((s) => (
                        <tr key={s.rollNo} className="border-t border-border/60 hover:bg-secondary/20">
                          <td className="px-3 py-1.5 font-medium">{s.name}</td>
                          <td className="px-3 py-1.5 font-mono text-muted-foreground">{s.rollNo}</td>
                          <td className="px-3 py-1.5 text-right font-semibold text-primary">
                            {challanForm.amount
                              ? `Rs. ${Number(challanForm.amount).toLocaleString()}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notification preview */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-1.5">
                  <Bell className="h-3.5 w-3.5" /> Notification Preview (sent to all students)
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  📢 Transport fee challan for{" "}
                  <strong>{challanForm.semester || "[Semester]"}</strong> has been generated. The fee is Rs.{" "}
                  <strong>
                    {challanForm.amount ? Number(challanForm.amount).toLocaleString() : "[Amount]"}/-
                  </strong>
                  .{" "}
                  {challanForm.note ? challanForm.note + " " : ""}
                  Please pay by{" "}
                  <strong>{challanForm.dueDate || "[Due Date]"}</strong> to avoid penalties.
                </p>
              </div>
            </div>

            {/* footer */}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border px-6 py-4 bg-card">
              <Button variant="outline" onClick={() => { setShowChallanModal(false); setChallanErr({}); }}>
                Cancel
              </Button>
              <Button className="gap-2" onClick={handleGenerateChallan}>
                <Download className="h-4 w-4" />
                Generate &amp; Notify All Students
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
