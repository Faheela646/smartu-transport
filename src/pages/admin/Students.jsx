import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, CheckCircle2, Mail, Key, Copy, Check, Sparkles, ShieldCheck, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useStudentStore } from "@/store/useStudentStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { ROLL_NO_REGEX, generateStudentEmail, generateStudentPassword } from "@/data/mockData";
import { useFleetStore as useFleet } from "@/store/useFleetStore";

export default function Students() {
  const { students, addStudent, bulkCreateStudents, updateStudent, deleteStudent } = useStudentStore();
  const semesterPayments = useTransportWorkflowStore((state) => state.semesterPayments);
  const { routes } = useFleet();

  const [tab, setTab] = useState("ALL");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [form, setForm] = useState({ name: "", rollNo: "", role: "DAY_SCHOLAR" });
  const [formError, setFormError] = useState("");
  const [createdAccount, setCreatedAccount] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCsv, setBulkCsv] = useState("");
  const [bulkAccounts, setBulkAccounts] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkRouteId, setBulkRouteId] = useState("");

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesTab = tab === "ALL" || s.role === tab;
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(query.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(query.toLowerCase()));
      return matchesTab && matchesQuery;
    });
  }, [students, tab, query]);

  const liveEmail = useMemo(() => generateStudentEmail(form.rollNo), [form.rollNo]);
  const livePassword = useMemo(() => generateStudentPassword(form.rollNo), [form.rollNo]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!ROLL_NO_REGEX.test(form.rollNo.trim())) {
      setFormError("Roll number must look like 22F-3284 or 24CFD-1021.");
      return;
    }
    if (students.some((s) => s.rollNo.toLowerCase() === form.rollNo.trim().toLowerCase())) {
      setFormError("A student with this roll number already exists.");
      return;
    }
    const result = addStudent({ ...form, routeId: null, accountStatus: "N/A", seatNo: null });
    setAddOpen(false);
    setCreatedAccount({
      name: form.name,
      rollNo: form.rollNo.toUpperCase(),
      email: result.email,
      password: result.password,
    });
    setForm({ name: "", rollNo: "", role: "DAY_SCHOLAR" });
    setFormError("");
    toast.success(`Student registered! Email: ${result.email} | Password: ${result.password}`);
  };

  const handleBulkCreate = (event) => {
    event.preventDefault();
    const rows = bulkCsv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (rows.length === 0) {
      toast.error("Paste at least one user row.");
      return;
    }
    let parsed;
    try {
      parsed = rows.map((line, index) => {
        const [name, identifier, email, rawUserType, rawCategory] = line.split(",").map((value) => value.trim());
        const userType = rawUserType?.toLowerCase();
        const category = rawCategory?.toUpperCase();
        if (!name || !identifier || !email || !["student", "faculty"].includes(userType)) {
          throw new Error(`Row ${index + 1}: provide name, ID, email and user_type (student/faculty).`);
        }
        if (userType === "student" && !["DAY_SCHOLAR", "HOSTELITE"].includes(category)) {
          throw new Error(`Row ${index + 1}: student category must be DAY_SCHOLAR or HOSTELITE.`);
        }
        const normalizedId = identifier.toUpperCase();
        const duplicate = students.some((student) =>
          student.rollNo?.toUpperCase() === normalizedId || student.email?.toLowerCase() === email.toLowerCase()
        );
        if (duplicate) throw new Error(`Row ${index + 1}: ID or email already exists.`);
        const role = userType === "faculty" ? "FACULTY" : category;
        return {
          name,
          rollNo: normalizedId,
          email: email.toLowerCase(),
          userType,
          role,
          routeId: null,
          password: generateStudentPassword(normalizedId),
          accountStatus: "N/A",
          seatNo: null,
        };
      });
    } catch (error) {
      toast.error(error.message || "Unable to read the pasted account list.");
      return;
    }
    const identifiers = new Set(parsed.map((record) => record.rollNo));
    const emails = new Set(parsed.map((record) => record.email));
    if (identifiers.size !== parsed.length || emails.size !== parsed.length) {
      toast.error("The pasted list contains duplicate IDs or email addresses.");
      return;
    }
    const created = bulkCreateStudents(parsed).map(({ student, password }) => ({
      name: student.name, identifier: student.rollNo, email: student.email, password,
    }));
    setBulkAccounts(created);
    console.info("Development temporary account credentials:", created);
    toast.success(`${created.length} accounts created with N/A status. Temporary credentials printed to the development console.`);
    setBulkCsv("");
    setBulkOpen(false);
  };

  const toggleStudentSelection = (id) => setSelectedStudentIds((current) =>
    current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
  );
  const filteredIds = filtered.map((student) => student.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedStudentIds.includes(id));

  const updateSelectedRoutes = () => {
    if (!bulkRouteId || selectedStudentIds.length === 0) {
      toast.error("Select a route and at least one account.");
      return;
    }
    selectedStudentIds.forEach((id) => updateStudent(id, { routeId: bulkRouteId, pickupStop: null }));
    toast.success(`Updated the route for ${selectedStudentIds.length} account(s).`);
    setSelectedStudentIds([]);
    setBulkRouteId("");
  };

  const deleteSelectedStudents = () => {
    if (!window.confirm(`Permanently remove ${selectedStudentIds.length} selected account(s) from this browser demo?`)) return;
    selectedStudentIds.forEach(deleteStudent);
    toast.success(`${selectedStudentIds.length} account(s) removed.`);
    setSelectedStudentIds([]);
  };

  const studentApplications = selectedStudent
    ? semesterPayments.filter((payment) => payment.userId === selectedStudent.id)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">Provision user accounts, track semester status and assign seats.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Users className="mr-1.5 h-4 w-4" /> Bulk create
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Student
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="DAY_SCHOLAR">Day Scholar</TabsTrigger>
                <TabsTrigger value="HOSTELITE">Hostelite</TabsTrigger>
                <TabsTrigger value="FACULTY">Faculty</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative sm:w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, roll no. or email..."
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {selectedStudentIds.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-border bg-secondary/30 p-3">
              <span className="mr-2 text-sm font-medium">{selectedStudentIds.length} selected</span>
              <select aria-label="Set route for selected accounts" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={bulkRouteId} onChange={(event) => setBulkRouteId(event.target.value)}>
                <option value="">Set route…</option>
                {routes.map((route) => <option key={route.id} value={route.id}>{route.shortName || route.name}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={updateSelectedRoutes}>Update route</Button>
              <Button variant="destructive" size="sm" onClick={deleteSelectedStudents}><Trash2 className="mr-1 h-4 w-4" />Delete selected</Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <input
                    type="checkbox"
                    aria-label="Select all filtered users"
                    checked={allFilteredSelected}
                    onChange={() => setSelectedStudentIds((current) => allFilteredSelected
                      ? current.filter((id) => !filteredIds.includes(id))
                      : [...new Set([...current, ...filteredIds])])}
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Allocated Email</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>User type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Latest application</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const sEmail = s.email || generateStudentEmail(s.rollNo);
                const sPassword = s.password || generateStudentPassword(s.rollNo);
                const latestApplication = semesterPayments.find((payment) => payment.userId === s.id);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <input type="checkbox" aria-label={`Select ${s.name}`} checked={selectedStudentIds.includes(s.id)} onChange={() => toggleStudentSelection(s.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{s.rollNo}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-primary/70" />
                        {sEmail}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Key className="h-3 w-3 text-emerald-600" />
                        {sPassword}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.userType === "faculty" || s.role === "HOSTELITE" ? "accent" : "secondary"}>
                        {s.userType === "faculty" ? "Faculty" : s.role === "HOSTELITE" ? "Hostelite" : "Day Scholar"}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant={s.accountStatus === "Approved" ? "success" : s.accountStatus === "Pending" ? "warning" : "secondary"}>{s.accountStatus || "N/A"}</Badge></TableCell>
                    <TableCell className="text-xs">{s.seatNo === 0 ? "Standing" : s.seatNo ?? "Unassigned"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {routes.find((r) => r.id === s.routeId)?.shortName || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={latestApplication ? (latestApplication.status === "Approved" ? "success" : latestApplication.status === "Rejected" ? "destructive" : "warning") : "secondary"}>
                        {latestApplication?.status || "Not applied"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedStudentId(s.id)}>Account details</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                    No students match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk create accounts</DialogTitle>
            <DialogDescription>Paste CSV rows in this order: name, ID, email, user_type, student_category. Routes and pickup stops are selected by the user when they apply. Leave the faculty category blank.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleBulkCreate}>
            <div className="rounded-md bg-secondary/50 p-3 font-mono text-xs">
              Ahmed Raza,22F-7001,ahmed@nu.edu.pk,student,DAY_SCHOLAR<br />
              Sana Ali,EMP-12,sana@nu.edu.pk,faculty,
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bulk-users">Account rows (no header)</Label>
              <textarea id="bulk-users" className="min-h-40 w-full rounded-md border border-input bg-background p-3 font-mono text-xs" value={bulkCsv} onChange={(event) => setBulkCsv(event.target.value)} placeholder="name,ID,email,student,DAY_SCHOLAR" />
            </div>
            <p className="text-xs text-muted-foreground">Accounts are created with N/A status and an initial ID-based password. This UI does not send email; credentials are displayed after creation and printed to the dev console.</p>
            <DialogFooter><Button type="submit">Create accounts</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAccounts.length > 0} onOpenChange={(open) => !open && setBulkAccounts([])}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Temporary credentials</DialogTitle><DialogDescription>Share these with users through the Transport Office. Every account starts with N/A status.</DialogDescription></DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {bulkAccounts.map((account) => <div key={account.identifier} className="grid gap-1 rounded-md border border-border p-3 text-xs sm:grid-cols-4"><strong>{account.name}</strong><span>{account.identifier}</span><span>{account.email}</span><code>{account.password}</code></div>)}
          </div>
          <DialogFooter><Button onClick={() => setBulkAccounts([])}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Register New Student
            </DialogTitle>
            <DialogDescription>
              Enter student details. Email & login password will be generated automatically based on the Roll Number.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Faheela"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Roll Number</Label>
              <Input
                required
                value={form.rollNo}
                onChange={(e) => setForm({ ...form, rollNo: e.target.value.toUpperCase() })}
                placeholder="e.g. 22F-3284"
              />
              <p className="text-[11px] text-muted-foreground">
                Format: 22F-3284 (Generates email <code className="text-primary font-semibold">f223284@cfd.nu.edu.pk</code> and password <code className="text-emerald-600 font-semibold">3284@fast</code>)
              </p>
            </div>

            {/* Live credentials preview */}
            {form.rollNo.trim() && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-primary">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Allocated Student Account Credentials:
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-foreground">
                  <div className="bg-background/80 p-2 rounded border border-border space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Generated Email
                    </p>
                    <p className="font-mono font-bold text-xs truncate">{liveEmail}</p>
                  </div>
                  <div className="bg-background/80 p-2 rounded border border-border space-y-0.5">
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Key className="h-3 w-3 text-emerald-600" /> Allocated Password
                    </p>
                    <p className="font-mono font-bold text-xs text-emerald-600 truncate">{livePassword}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Student category</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
                  <SelectItem value="HOSTELITE">Hostelite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">
                Register & Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Created Success Confirmation Modal */}
      <Dialog open={!!createdAccount} onOpenChange={(open) => !open && setCreatedAccount(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              Student Account Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Account created with N/A status. Share these temporary credentials; the user must apply for semester transport before approval.
            </DialogDescription>
          </DialogHeader>
          {createdAccount && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-border bg-secondary/20 p-3 text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-xs">Student Name:</span>
                  <span className="font-semibold text-foreground">{createdAccount.name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground text-xs">Roll Number:</span>
                  <span className="font-mono font-semibold text-primary">{createdAccount.rollNo}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-primary" /> Generated Email:
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-foreground">
                    <span>{createdAccount.email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(createdAccount.email, "email")}
                    >
                      {copiedField === "email" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs flex items-center gap-1">
                    <Key className="h-3.5 w-3.5 text-emerald-600" /> Allocated Password:
                  </span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-emerald-600">
                    <span>{createdAccount.password}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(createdAccount.password, "password")}
                    >
                      {copiedField === "password" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedAccount(null)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine / fee side panel */}
      <Sheet open={!!selectedStudentId} onOpenChange={(o) => !o && setSelectedStudentId(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedStudent?.name}</SheetTitle>
            <SheetDescription>{selectedStudent?.rollNo} · Transport Profile & Credentials</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            {/* Account Credentials Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-2 text-xs">
                <p className="font-semibold text-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Allocated Student Login Account
                </p>
                <div className="flex justify-between items-center bg-background/80 p-2 rounded border border-border">
                  <span className="text-muted-foreground">Roll Number:</span>
                  <span className="font-mono font-bold text-foreground">{selectedStudent?.rollNo}</span>
                </div>
                <div className="flex justify-between items-center bg-background/80 p-2 rounded border border-border">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 text-primary" /> Generated Email:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedStudent ? (selectedStudent.email || generateStudentEmail(selectedStudent.rollNo)) : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-background/80 p-2 rounded border border-border">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Key className="h-3 w-3 text-emerald-600" /> Allocated Password:
                  </span>
                  <span className="font-mono font-bold text-emerald-600">
                    {selectedStudent ? (selectedStudent.password || generateStudentPassword(selectedStudent.rollNo)) : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="text-sm font-semibold">Semester applications</p>
                  <p className="text-xs text-muted-foreground">Payment and seat decisions are managed in Transport Approvals.</p>
                </div>
                {studentApplications.length === 0 && <p className="text-sm text-muted-foreground">No semester application submitted.</p>}
                {studentApplications.map((payment) => (
                  <div key={payment.id} className="space-y-1 rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{payment.semester}</span>
                      <Badge variant={payment.status === "Approved" ? "success" : payment.status === "Rejected" ? "destructive" : "warning"}>{payment.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{payment.routeId} · {payment.stopId} · Rs. {Number(payment.amount).toLocaleString()}</p>
                    {payment.evidenceDataUrl && <a className="text-xs font-medium text-primary underline" href={payment.evidenceDataUrl} target="_blank" rel="noreferrer">View payment evidence</a>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
