import { useState } from "react";
import { toast } from "sonner";
import { Plus, Wrench, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const STATUS_VARIANT = { Active: "success", Reserve: "secondary", "Under Maintenance": "destructive" };

export default function Fleet() {
  const { buses, routes, updateBus, sendBusToMaintenance, addBus, deleteBus } = useFleetStore();
  const triggerEvent = useSocketStore((s) => s.triggerEvent);

  const [maintenanceTarget, setMaintenanceTarget] = useState(null);
  const [replacementId, setReplacementId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ plate: "", capacity: 50, model: "" });

  const reserveBuses = buses.filter((b) => b.status === "Reserve" && b.id !== maintenanceTarget?.id);

  const handleToggleMaintenance = (bus) => {
    if (bus.status === "Under Maintenance") {
      updateBus(bus.id, { status: "Reserve" });
      toast.success(`${bus.plate} marked back in service.`);
      return;
    }
    if (bus.routeId) {
      setMaintenanceTarget(bus);
      setReplacementId("");
    } else {
      updateBus(bus.id, { status: "Under Maintenance" });
      toast.success(`${bus.plate} marked under maintenance.`);
    }
  };

  const confirmMaintenance = () => {
    if (!replacementId) return;
    const route = routes.find((r) => r.id === maintenanceTarget.routeId);
    sendBusToMaintenance(maintenanceTarget.id, replacementId);
    const replacementPlate = buses.find((b) => b.id === replacementId)?.plate;
    triggerEvent("BUS_MAINTENANCE", {
      message: `${maintenanceTarget.plate} is under maintenance on ${route?.name}. Replacement bus ${replacementPlate} has taken over — no service disruption.`,
      audienceLabel: route?.shortName,
    });
    toast.success(`${maintenanceTarget.plate} sent for maintenance. ${replacementPlate} is now covering ${route?.shortName}.`);
    setMaintenanceTarget(null);
  };

  const handleAddBus = (e) => {
    e.preventDefault();
    addBus({ plate: form.plate.toUpperCase(), capacity: Number(form.capacity), model: form.model });
    toast.success("Bus added to fleet.");
    setAddOpen(false);
    setForm({ plate: "", capacity: 50, model: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fleet</h1>
          <p className="text-sm text-muted-foreground">Manage buses and maintenance status.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Bus
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Assigned Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buses.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm font-medium text-foreground">{b.plate}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.model}</TableCell>
                  <TableCell className="text-sm">{b.capacity} seats</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {routes.find((r) => r.id === b.routeId)?.shortName || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[b.status] || "secondary"}>{b.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleMaintenance(b)}>
                        <Wrench className="h-3.5 w-3.5" />
                        {b.status === "Under Maintenance" ? "Return to service" : "Under Maintenance"}
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete bus ${b.plate}`} className="text-destructive" onClick={() => {
                        if (window.confirm(`Delete ${b.plate}? Its route and staff assignments will be cleared.`)) {
                          deleteBus(b.id);
                          toast.success(`${b.plate} removed from the fleet.`);
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Forced replacement modal */}
      <Dialog open={!!maintenanceTarget} onOpenChange={(o) => !o && setMaintenanceTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a Replacement Bus</DialogTitle>
            <DialogDescription>
              {maintenanceTarget?.plate} is actively serving{" "}
              {routes.find((r) => r.id === maintenanceTarget?.routeId)?.name}. You must select a
              replacement bus before it can be taken offline.
            </DialogDescription>
          </DialogHeader>
          <Select value={replacementId} onValueChange={setReplacementId}>
            <SelectTrigger><SelectValue placeholder="Select a reserve bus" /></SelectTrigger>
            <SelectContent>
              {reserveBuses.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.plate} — {b.capacity} seats</SelectItem>
              ))}
              {reserveBuses.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No reserve buses available.</div>
              )}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button disabled={!replacementId} onClick={confirmMaintenance} className="w-full sm:w-auto">
              Confirm & Send to Maintenance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add bus modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bus</DialogTitle>
            <DialogDescription>New buses join the fleet in Reserve status.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddBus} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plate Number</Label>
              <Input required value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="FSD-1122" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Hino AK1J" />
              </div>
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input required type="number" min={10} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">Add Bus</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
