import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Radio, MapPinOff, Clock, Route as RouteIcon, TriangleAlert, Wrench, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useSocketStore } from "@/store/useSocketStore";

const STATUS_OPTIONS = [
  { key: "TRAFFIC", label: "Traffic Delay", icon: Clock, variant: "warning" },
  { key: "BREAKDOWN", label: "Bus Breakdown", icon: Wrench, variant: "destructive" },
  { key: "ON_SCHEDULE", label: "On Schedule", icon: CheckCircle, variant: "success" },
];

export default function DriverDashboard() {
  const user = useAuthStore((s) => s.user);
  const { drivers, buses, routes } = useFleetStore();
  const triggerEvent = useSocketStore((s) => s.triggerEvent);

  const driver = drivers.find((d) => d.id === user?.id);
  const bus = buses.find((b) => b.id === driver?.assignedBusId);
  const route = routes.find((r) => r.id === bus?.routeId);

  const [permission, setPermission] = useState("prompt"); // prompt | granted | denied
  const [coords, setCoords] = useState(null);
  const [now, setNow] = useState(new Date());
  const [pendingStatus, setPendingStatus] = useState(null);
  const wakeLockRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Wake Lock API unsupported or denied — GPS broadcasting still works,
      // just without a screen-off guarantee.
    }
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPermission("denied");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPermission("granted");
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        requestWakeLock();
      },
      () => setPermission("denied"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      wakeLockRef.current?.release?.().catch(() => {});
    };
  }, []);

  const confirmStatus = () => {
    if (!pendingStatus) return;
    const opt = STATUS_OPTIONS.find((o) => o.key === pendingStatus);
    triggerEvent("DRIVER_STATUS", {
      message: `${route?.name}: ${opt.label} reported by ${driver?.name}.`,
      audienceLabel: route?.shortName,
    });
    toast.success(`Status broadcast: ${opt.label}`);
    setPendingStatus(null);
  };

  if (permission === "denied") {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 bg-destructive/10 p-6 text-center">
        <MapPinOff className="h-14 w-14 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">Location Access Required</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          SmartU Transport needs GPS access to broadcast your live location to students. Enable
          location permissions in your browser settings, then reload this page.
        </p>
        <div className="rounded-lg border border-border bg-secondary/50 p-3 text-left text-xs text-muted-foreground">
          Chrome (Android): Site Settings → Location → Allow<br />
          Safari (iOS): Settings → Privacy → Location Services → Safari Websites → Allow
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <Card className="border-border/60 bg-card">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success/50" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-success">
              <Radio className="h-6 w-6 text-white" />
            </span>
          </div>
          <p className="text-lg font-bold text-foreground">Broadcasting Live Location</p>
          <p className="text-xs text-muted-foreground">
            {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Acquiring GPS signal..."}
          </p>
          <p className="text-3xl font-mono font-bold tabular-nums text-foreground">
            {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Assigned Route</p>
            <p className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
              <RouteIcon className="h-4 w-4 text-primary" /> {route?.shortName}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bus</p>
            <p className="mt-1 font-semibold text-foreground">{bus?.plate}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Upcoming Stops</p>
          <div className="space-y-1.5">
            {route?.stops.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{s.name}</span>
                <span className="text-muted-foreground">{s.eta}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Emergency Status</p>
        <div className="grid grid-cols-3 gap-3">
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              variant={opt.variant}
              size="xl"
              className="flex-col gap-1.5"
              onClick={() => setPendingStatus(opt.key)}
            >
              <opt.icon className="h-6 w-6" />
              <span className="text-[11px] font-semibold leading-tight">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Dialog open={!!pendingStatus} onOpenChange={(o) => !o && setPendingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-warning" /> Confirm Status Update
            </DialogTitle>
            <DialogDescription>
              This will immediately notify all students tracking {route?.shortName}. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={confirmStatus} className="w-full sm:w-auto">Confirm & Broadcast</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
