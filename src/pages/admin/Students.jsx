import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, CheckCircle2, Mail, Key, Copy, Check, Sparkles, ShieldCheck } from "lucide-react";
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
import { useFineStore } from "@/store/useFineStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ROLL_NO_REGEX, generateStudentEmail, generateStudentPassword } from "@/data/mockData";
import { useFleetStore as useFleet } from "@/store/useFleetStore";

export default function Students() {
  const { students, addStudent, approveFeeChallan } = useStudentStore();
  const { fines, clearFine, approveChallan } = useFineStore();
  const { routes } = useFleet();

  const [tab, setTab] = useState("ALL");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [form, setForm] = useState({ name: "", rollNo: "", role: "DAY_SCHOLAR", routeId: routes[0]?.id || "" });
  const [formError, setFormError] = useState("");
  const [createdAccount, setCreatedAccount] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

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
    const result = addStudent(form);
    setAddOpen(false);
    setCreatedAccount({
      name: form.name,
      rollNo: form.rollNo.toUpperCase(),
      email: result.email,
      password: result.password,
    });
    setForm({ name: "", rollNo: "", role: "DAY_SCHOLAR", routeId: routes[0]?.id || "" });
    setFormError("");
    toast.success(`Student registered! Email: ${result.email} | Password: ${result.password}`);
  };

  const studentFines = selectedStudent ? fines.filter((f) => f.rollNo === selectedStudent.rollNo) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground">Manage day scholars, hostelites, and student login accounts.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Student
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="DAY_SCHOLAR">Day Scholar</TabsTrigger>
                <TabsTrigger value="HOSTELITE">Hostelite</TabsTrigger>
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Allocated Email</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const sEmail = s.email || generateStudentEmail(s.rollNo);
                const sPassword = s.password || generateStudentPassword(s.rollNo);
                return (
                  <TableRow key={s.id}>
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
                      <Badge variant={s.role === "HOSTELITE" ? "accent" : "secondary"}>
                        {s.role === "HOSTELITE" ? "Hostelite" : "Day Scholar"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {routes.find((r) => r.id === s.routeId)?.shortName || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.feeStatus === "Paid" ? "success" : "warning"}>{s.feeStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedStudentId(s.id)}>
                        Details & Fines
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No students match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY_SCHOLAR">Day Scholar</SelectItem>
                    <SelectItem value="HOSTELITE">Hostelite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Route</Label>
                <Select value={form.routeId} onValueChange={(v) => setForm({ ...form, routeId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {routes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.shortName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              Account has been registered and is ready for login. Share these credentials with the student.
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

            {/* Monthly Transport Fee Challan Section */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Monthly Transport Fee</p>
                    <p className="text-xs text-muted-foreground">Semester Route Subscription</p>
                  </div>
                  <Badge variant={selectedStudent?.feeStatus === "Paid" ? "success" : "warning"}>
                    {selectedStudent?.feeStatus}
                  </Badge>
                </div>
                {selectedStudent?.feeStatus === "Pending" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      approveFeeChallan(selectedStudent.id);
                      toast.success(`Approve Uploaded Fee Challan for ${selectedStudent.name}.`);
                    }}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve Uploaded Fee Challan
                  </Button>
                )}
              </CardContent>
            </Card>

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fine & Penalty Records</p>
              {studentFines.length === 0 && (
                <p className="text-sm text-muted-foreground">No fines on record for this student.</p>
              )}
              <div className="space-y-3">
                {studentFines.map((f) => (
                  <Card key={f.id}>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{f.reason}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(f.date)} · {formatCurrency(f.amount)}</p>
                        <Badge
                          className="mt-1.5"
                          variant={f.status === "Cleared" ? "success" : f.status === "Pending Approval" ? "warning" : "destructive"}
                        >
                          {f.status}
                        </Badge>
                      </div>
                      {f.status !== "Cleared" && (
                        <Button
                          size="sm"
                          variant={f.status === "Pending Approval" ? "default" : "outline"}
                          onClick={() => {
                            if (f.status === "Pending Approval") {
                              approveChallan(f.id);
                            } else {
                              clearFine(f.id);
                            }
                            toast.success(f.status === "Pending Approval" ? "Challan approved." : "Fine cleared.");
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          {f.status === "Pending Approval" ? "Approve Challan" : "Clear Fine"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
