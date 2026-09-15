import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Bus,
  Route as RouteIcon,
  WifiOff,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useFineStore } from "@/store/useFineStore";
import { STUDENTS } from "@/data/mockData";
import { cn } from "@/lib/utils";

const SCANNER_ELEMENT_ID = "conductor-qr-reader";
const QUEUE_KEY = "smartu-offline-scan-queue";

function playTone(success) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = success ? "sine" : "square";
    osc.frequency.value = success ? 880 : 180;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (success ? 0.18 : 0.35));
  } catch {
    // Audio not available — fail silently.
  }
}

function validateScan(qrValue, routeId, alreadyBoarded, fines) {
  const student = STUDENTS.find((s) => qrValue.endsWith(s.rollNo));
  if (!student) return { allowed: false, reason: "Invalid QR Code" };
  if (alreadyBoarded.has(student.rollNo)) return { allowed: false, reason: "Already Scanned", student };
  if (student.routeId !== routeId) return { allowed: false, reason: "Wrong Route", student };
  const unpaid = fines.some((f) => f.rollNo === student.rollNo && f.status === "Unpaid");
  if (unpaid) return { allowed: false, reason: "Unpaid Fine", student };
  return { allowed: true, student };
}

export default function ConductorScanner() {
  const user = useAuthStore((s) => s.user);
  const { conductors, buses, routes } = useFleetStore();
  const fines = useFineStore((s) => s.fines);

  const conductor = conductors.find((c) => c.id === user?.id);
  const bus = buses.find((b) => b.id === conductor?.assignedBusId);
  const route = routes.find((r) => r.id === bus?.routeId);
  const capacity = bus?.capacity ?? 50;

  const [scanning, setScanning] = useState(false);
  const [boardedCount, setBoardedCount] = useState(0);
  const [boardedSet, setBoardedSet] = useState(new Set());
  const [flash, setFlash] = useState(null); // { ok: bool, reason, name }
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]").length;
    } catch {
      return 0;
    }
  });

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  // ---- Online / offline listeners ----
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      if (queue.length > 0) {
        toast.success(`Syncing ${queue.length} queued scans to server...`);
        setTimeout(() => {
          localStorage.setItem(QUEUE_KEY, "[]");
          setQueueLength(0);
        }, 1200);
      }
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const queueScan = (record) => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    queue.push(record);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setQueueLength(queue.length);
  };

  const handleDecoded = useCallback(
    (decodedText) => {
      if (processingRef.current) return;
      processingRef.current = true;

      const result = validateScan(decodedText, route?.id, boardedSet, fines);

      if (result.allowed) {
        playTone(true);
        setFlash({ ok: true, name: result.student.name });
        setBoardedCount((c) => c + 1);
        setBoardedSet((prev) => new Set(prev).add(result.student.rollNo));
        if (!isOnline) queueScan({ rollNo: result.student.rollNo, time: Date.now() });
      } else {
        playTone(false);
        setFlash({ ok: false, reason: result.reason, name: result.student?.name });
      }

      setTimeout(() => {
        setFlash(null);
        processingRef.current = false;
      }, 2500);
    },
    [route?.id, boardedSet, fines, isOnline]
  );

  // ---- Camera lifecycle ----
  useEffect(() => {
    if (!scanning) return;
    const qr = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = qr;
    let cancelled = false;

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => handleDecoded(decodedText),
      () => {} // ignore per-frame scan failures
    ).catch(() => {
      if (!cancelled) {
        toast.error("Camera access denied. Enable camera permissions to scan passes.");
        setScanning(false);
      }
    });

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  if (scanning) {
    return (
      <div className="relative flex min-h-[calc(100vh-64px)] flex-col bg-black">
        {!isOnline && (
          <div className="sticky top-0 z-20 flex items-center justify-center gap-2 bg-warning px-3 py-2 text-xs font-semibold text-warning-foreground">
            <WifiOff className="h-3.5 w-3.5" /> Offline Mode: Queuing Scans Locally ({queueLength})
          </div>
        )}

        <div id={SCANNER_ELEMENT_ID} className="w-full flex-1" />

        {flash && (
          <div
            className={cn(
              "absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 text-white",
              flash.ok ? "animate-flash-green" : "animate-flash-red"
            )}
          >
            {flash.ok ? <CheckCircle2 className="h-28 w-28" strokeWidth={2.5} /> : <XCircle className="h-28 w-28" strokeWidth={2.5} />}
            <p className="text-2xl font-bold">{flash.ok ? "Boarded" : "Denied"}</p>
            {flash.name && <p className="text-lg">{flash.name}</p>}
            {!flash.ok && flash.reason && (
              <p className="rounded-full bg-black/30 px-4 py-1.5 text-sm font-semibold">{flash.reason}</p>
            )}
          </div>
        )}

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4">
          <div className="rounded-full bg-black/60 px-5 py-2.5 text-center text-white">
            <p className="text-2xl font-bold leading-none">{boardedCount} / {capacity}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">Boarded</p>
          </div>
          <Button size="lg" variant="destructive" onClick={() => setScanning(false)}>
            Stop Scanning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-lg bg-warning px-3 py-2 text-xs font-semibold text-warning-foreground">
          <WifiOff className="h-4 w-4" /> Offline Mode: {queueLength} scans queued locally
        </div>
      )}

      <Card className="border-none bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <p className="text-xs text-primary-foreground/70">Boarded</p>
          <p className="text-5xl font-extrabold tracking-tight">{boardedCount} <span className="text-2xl font-semibold text-primary-foreground/60">/ {capacity}</span></p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Bus className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Bus</p>
              <p className="font-semibold text-foreground">{bus?.plate}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <RouteIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Route</p>
              <p className="font-semibold text-foreground">{route?.shortName}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button size="xl" className="w-full gap-3" onClick={() => setScanning(true)}>
        <ScanLine className="h-6 w-6" /> Start Scanning
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Camera className="h-3.5 w-3.5" /> Requires camera access to scan student boarding passes.
      </p>
    </div>
  );
}
