import { useState } from "react";
import { toast } from "sonner";
import { Repeat2, Plus, Trash2, Phone, UserCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useFleetStore } from "@/store/useFleetStore";
import { useSocketStore } from "@/store/useSocketStore";

const STATUS_VARIANT = { Active: "success", "On Leave": "warning", Reserve: "secondary", Suspended: "destructive" };

function StaffTable({ rows, buses, onReassign, onStatusChange, onDelete }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Staff ID</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Assigned Bus</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium text-foreground">
              {r.name}
            </TableCell>
            <TableCell className="font-mono text-xs">{r.id}</TableCell>
            <TableCell className="text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {r.phone || "—"}
              </span>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {buses.find((b) => b.id === r.assignedBusId)?.plate || "Unassigned"}
            </TableCell>
            <TableCell>
              <Select value={r.status} onValueChange={(val) => onStatusChange(r.id, val)}>
                <SelectTrigger className="h-7 text-xs w-32 border-none bg-transparent p-0">
                  <Badge variant={STATUS_VARIANT[r.status] || "secondary"} className="cursor-pointer">
                    {r.status}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Reserve">Reserve</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-right space-x-2">
              {r.status === "Active" ? (
                <Button variant="outline" size="sm" onClick={() => onReassign(r)}>
                  <Repeat2 className="h-3.5 w-3.5 mr-1" /> Reassign
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground mr-2">Reserve Pool</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(r.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
              No staff members found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function Staff() {
  const {
    drivers,
    conductors,
    buses,
    routes,
    addDriver,
    addConductor,
    updateDriver,
    updateConductor,
    deleteDriver,
    deleteConductor,
    reassignDriver,
    reassignConductor,
  } = useFleetStore();
  const triggerEvent = useSocketStore((s) => s.triggerEvent);

  const [activeTab, setActiveTab] = useState("drivers");
  const [reassignTarget, setReassignTarget] = useState(null); // { kind: 'driver'|'conductor', staff }
  const [replacementId, setReplacementId] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", kind: "driver", loginId: "" });
  const [createdStaff, setCreatedStaff] = useState(null);

  const openReassign = (kind, staff) => {
    setReassignTarget({ kind, staff });
    setReplacementId("");
  };

  const pool =
    reassignTarget?.kind === "driver"
      ? drivers.filter((d) => d.status !== "Active" && d.id !== reassignTarget.staff.id)
      : conductors.filter((c) => c.status !== "Active" && c.id !== reassignTarget.staff.id);

  const route = routes.find((r) =>
    reassignTarget?.kind === "driver"
      ? r.driverId === reassignTarget?.staff?.id || r.busId === reassignTarget?.staff?.assignedBusId
      : r.conductorId === reassignTarget?.staff?.id || r.busId === reassignTarget?.staff?.assignedBusId
  );

  const confirmReassign = () => {
    if (!replacementId || !reassignTarget) return;

    const replacementStaff = pool.find((p) => p.id === replacementId);
    const targetStaff = reassignTarget.staff;

    if (route) {
      if (reassignTarget.kind === "driver") {
        reassignDriver(route.id, replacementId);
      } else {
        reassignConductor(route.id, replacementId);
      }
    } else {
      // Direct bus swap fallback if route isn't explicitly tied
      const busId = targetStaff.assignedBusId;
      if (reassignTarget.kind === "driver") {
        updateDriver(targetStaff.id, { status: "Reserve", assignedBusId: null });
        updateDriver(replacementId, { status: "Active", assignedBusId: busId });
      } else {
        updateConductor(targetStaff.id, { status: "Reserve", assignedBusId: null });
        updateConductor(replacementId, { status: "Active", assignedBusId: busId });
      }
    }

    const kindLabel = reassignTarget.kind === "driver" ? "Driver" : "Conductor";
    const routeName = route ? route.name : "Assigned Bus";

    triggerEvent("REASSIGNMENT", {
      message: `${routeName}: ${targetStaff.name} has been replaced by ${replacementStaff?.name}.`,
      audienceLabel: route?.shortName || "Staff Reassignment",
    });

    toast.success(`${kindLabel} successfully reassigned and notified.`);
    setReassignTarget(null);
  };

  const handleStatusChange = (kind, id, newStatus) => {
    if (kind === "driver") {
      updateDriver(id, { status: newStatus });
    } else {
      updateConductor(id, { status: newStatus });
    }
    toast.success(`Staff status updated to ${newStatus}.`);
  };

  const handleDelete = (kind, id) => {
    if (kind === "driver") {
      deleteDriver(id);
    } else {
      deleteConductor(id);
    }
    toast.success("Staff record removed.");
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Enter the staff member's name.");
      return;
    }
    const records = [...drivers, ...conductors];
    const prefix = addForm.kind === "driver" ? "driver" : "conductor";
    let suffix = 1;
    while (records.some((record) => record.loginId?.toLowerCase() === `${prefix}_${suffix}`)) suffix += 1;
    const loginId = addForm.loginId.trim() || `${prefix}_${suffix}`;
    if (records.some((record) => record.loginId?.toLowerCase() === loginId.toLowerCase())) {
      toast.error("That login username is already in use.");
      return;
    }
    const password = `${prefix}123`;

    if (addForm.kind === "driver") {
      addDriver({
        name: addForm.name,
        phone: addForm.phone || "0300-0000000",
        loginId,
        password,
      });
      toast.success(`Driver ${addForm.name} added successfully.`);
    } else {
      addConductor({
        name: addForm.name,
        phone: addForm.phone || "0300-0000000",
        loginId,
        password,
      });
      toast.success(`Conductor ${addForm.name} added successfully.`);
    }

    const credentials = { name: addForm.name, loginId, password, role: addForm.kind };
    setCreatedStaff(credentials);
    console.info("Development temporary staff credentials:", credentials);
    setAddOpen(false);
    setAddForm({ name: "", phone: "", kind: "driver", loginId: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Manage drivers, conductors, and handle emergency shift reassignments.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Staff Member
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="drivers" className="gap-2">
                <UserCheck className="h-4 w-4" /> Drivers ({drivers.length})
              </TabsTrigger>
              <TabsTrigger value="conductors" className="gap-2">
                <UserCheck className="h-4 w-4" /> Conductors ({conductors.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="drivers">
              <StaffTable
                rows={drivers}
                buses={buses}
                onReassign={(s) => openReassign("driver", s)}
                onStatusChange={(id, val) => handleStatusChange("driver", id, val)}
                onDelete={(id) => handleDelete("driver", id)}
              />
            </TabsContent>
            <TabsContent value="conductors">
              <StaffTable
                rows={conductors}
                buses={buses}
                onReassign={(s) => openReassign("conductor", s)}
                onStatusChange={(id, val) => handleStatusChange("conductor", id, val)}
                onDelete={(id) => handleDelete("conductor", id)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Emergency Reassignment Modal */}
      <Dialog open={!!reassignTarget} onOpenChange={(o) => !o && setReassignTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Emergency Reassignment Flow
            </DialogTitle>
            <DialogDescription>
              {reassignTarget?.staff.name} is calling in sick or unavailable for{" "}
              <span className="font-semibold text-foreground">{route ? route.name : "their assigned route"}</span>. Select a reserve/available {reassignTarget?.kind} to swap immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border p-3 bg-secondary/30 text-xs space-y-1">
              <p><span className="font-semibold">Unavailable Staff:</span> {reassignTarget?.staff.name} ({reassignTarget?.staff.id})</p>
              <p><span className="font-semibold">Current Bus:</span> {buses.find(b => b.id === reassignTarget?.staff.assignedBusId)?.plate || "Unassigned"}</p>
            </div>

            <div className="space-y-1.5">
              <Label>Select Replacement {reassignTarget?.kind === "driver" ? "Driver" : "Conductor"}</Label>
              <Select value={replacementId} onValueChange={setReplacementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reserve / available staff" />
                </SelectTrigger>
                <SelectContent>
                  {pool.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.id}) — Status: {p.status}
                    </SelectItem>
                  ))}
                  {pool.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No reserve staff available in pool.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignTarget(null)}>Cancel</Button>
            <Button disabled={!replacementId} onClick={confirmReassign}>
              Confirm & Swap Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Staff Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Add a new driver or conductor to the transport fleet pool.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Staff Role</Label>
              <Select value={addForm.kind} onValueChange={(val) => setAddForm({ ...addForm, kind: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="conductor">Conductor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                required
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g. Tariq Mahmood"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="0300-1234567"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Login Username</Label>
                <Input
                  value={addForm.loginId}
                  onChange={(e) => setAddForm({ ...addForm, loginId: e.target.value })}
                  placeholder="driver_new"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Staff</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!createdStaff} onOpenChange={(open) => !open && setCreatedStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary staff credentials</DialogTitle>
            <DialogDescription>Share these credentials through the Transport Office. Email delivery is not configured in this frontend demo.</DialogDescription>
          </DialogHeader>
          {createdStaff && <div className="space-y-2 rounded-md border border-border p-4 text-sm">
            <p><strong>{createdStaff.name}</strong> · {createdStaff.role}</p>
            <p>Username: <code>{createdStaff.loginId}</code></p>
            <p>Temporary password: <code>{createdStaff.password}</code></p>
          </div>}
          <DialogFooter><Button onClick={() => setCreatedStaff(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
