import { useState } from "react";
import { toast } from "sonner";
import { Plus, MapPin, Bus as BusIcon, UserCog, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

export default function AdminRoutes() {
  const { routes, buses, drivers, conductors, addRoute, updateRoute, deleteRoute } = useFleetStore();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", shortName: "", departureTime: "", stopsText: "" });

  const handleAdd = (e) => {
    e.preventDefault();
    const stops = form.stopsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name, i) => ({ name, lat: 31.45 + i * 0.01, lng: 73.08 - i * 0.01, eta: form.departureTime }));

    addRoute({
      name: form.name,
      shortName: form.shortName || form.name,
      departureTime: form.departureTime,
      busId: null,
      driverId: null,
      conductorId: null,
      stops,
    });
    toast.success("Route created.");
    setAddOpen(false);
    setForm({ name: "", shortName: "", departureTime: "", stopsText: "" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Routes & Schedule</h1>
          <p className="text-sm text-muted-foreground">Create routes and assign buses, drivers, and conductors.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Create Route
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {routes.map((route) => (
          <Card key={route.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{route.name}</CardTitle>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Departs {route.departureTime}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { deleteRoute(route.id); toast.success("Route removed."); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground"><BusIcon className="h-3 w-3" /> Bus</Label>
                  <Select value={route.busId || ""} onValueChange={(v) => updateRoute(route.id, { busId: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {buses.map((b) => <SelectItem key={b.id} value={b.id}>{b.plate}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground"><UserCog className="h-3 w-3" /> Driver</Label>
                  <Select value={route.driverId || ""} onValueChange={(v) => updateRoute(route.id, { driverId: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="flex items-center gap-1 text-xs text-muted-foreground"><UserCog className="h-3 w-3" /> Conductor</Label>
                  <Select value={route.conductorId || ""} onValueChange={(v) => updateRoute(route.id, { conductorId: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {conductors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Stops</p>
                <div className="space-y-2">
                  {route.stops.map((stop, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-foreground">{stop.name}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">{stop.eta}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Route</DialogTitle>
            <DialogDescription>Define stops as a comma-separated list, in travel order.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Route Name</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Morning City Route" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Short Name</Label>
                <Input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} placeholder="City Route" />
              </div>
              <div className="space-y-1.5">
                <Label>Departure Time</Label>
                <Input required value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} placeholder="7:15 AM" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Stops (comma-separated)</Label>
              <Input
                required
                value={form.stopsText}
                onChange={(e) => setForm({ ...form, stopsText: e.target.value })}
                placeholder="D-Ground Chowk, Kohinoor Chowk, FAST NUCES CFD Campus"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">Create Route</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
