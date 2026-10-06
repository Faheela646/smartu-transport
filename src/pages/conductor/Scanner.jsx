import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  BellRing,
  Play,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useTransportWorkflowStore } from "@/store/useTransportWorkflowStore";
import { useStudentStore as useRosterStore } from "@/store/useStudentStore";
import { parseStudentQrPayload } from "@/lib/studentQr";
import { createStudentQrPayload } from "@/lib/studentQr";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { transportService } from "@/api/transportService";
import { useSocketStore } from "@/store/useSocketStore";

const SCANNER_ELEMENT_ID = "conductor-qr-reader";
const QUEUE_KEY = "smartu-offline-scan-queue";

function playTone(success) {
  if (navigator.vibrate) navigator.vibrate(success ? [70, 35, 70] : [280]);
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

function validateScan(qrValue, routeId, alreadyBoarded, students) {
  const payload = parseStudentQrPayload(qrValue);
  if (!payload) return { allowed: false, reason: "Invalid QR Code" };
  const student = students.find(
    (record) => record.id === payload.studentId && record.rollNo === payload.rollNo
  );
  if (!student) return { allowed: false, reason: "Invalid QR Code" };
  if (student.accountStatus !== "Approved") return { allowed: false, reason: "Account Not Approved", student };
  if (alreadyBoarded.has(student.rollNo)) return { allowed: false, reason: "Already Scanned", student };
  if (student.routeId !== routeId) return { allowed: false, reason: "Wrong Route", student };
  return { allowed: true, student };
}

export default function ConductorScanner() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { conductors, buses, routes } = useFleetStore();
  const students = useStudentStore((s) => s.students);
  const markAttendance = useAttendanceStore((s) => s.markAttendance);
  const redeemTicket = useTransportWorkflowStore((s) => s.redeemTicket);
  const trips = useTransportWorkflowStore((s) => s.trips);
  const scanLogs = useTransportWorkflowStore((s) => s.scanLogs);
  const recordScan = useTransportWorkflowStore((s) => s.recordScan);
  const triggerEvent = useSocketStore((s) => s.triggerEvent);
  const updateStudent = useRosterStore((s) => s.updateStudent);

  const conductor = conductors.find((c) => c.id === user?.id);
  const bus = buses.find((b) => b.id === conductor?.assignedBusId);
  const route = routes.find((r) => r.id === bus?.routeId);
  const today = new Date().toISOString().slice(0, 10);
  const assignedTrips = trips.filter((trip) => trip.routeId === route?.id && trip.date === today && trip.status !== "COMPLETED");
  const [selectedTripId, setSelectedTripId] = useState("");
  const activeTrip = trips.find((trip) => trip.id === selectedTripId && trip.status === "ACTIVE")
    || trips.find((trip) => trip.routeId === route?.id && trip.status === "ACTIVE" && (!trip.conductorId || trip.conductorId === user?.id));
  const activeTripId = activeTrip?.id || "";
  const tripCounts = trips.find((trip) => trip.id === activeTripId);
  const currentBus = buses.find((item) => item.id === activeTrip?.busId) || bus;
  const capacity = tripCounts?.seatedCapacity || currentBus?.capacity || 50;

  const [scanning, setScanning] = useState(false);
  const [manualRollNo, setManualRollNo] = useState("");
  const [flash, setFlash] = useState(null); // { ok: bool, reason, name }
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]").length;
    } catch {
      return 0;
    }
  });

  const boardedSet = useMemo(
    () => new Set(scanLogs.filter((record) => record.tripId === activeTripId && record.result === "GREEN").map((record) => record.rollNo)),
    [scanLogs, activeTripId]
  );
  const boardedCount = (tripCounts?.seatedCount || 0) + (tripCounts?.standingCount || 0);

  const scannerRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    transportService.listTrips(today).catch((error) => {
      if (!cancelled) toast.error(error.response?.data?.message || error.message || "Could not load assigned trips.");
    });
    return () => { cancelled = true; };
  }, [today]);

  // ---- Online / offline listeners ----
  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      let queue;
      try {
        queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      } catch (error) {
        toast.error(`Could not read offline scan queue: ${error.message}`);
        return;
      }
      if (queue.length) {
        try {
          const result = await transportService.syncScans(queue);
          const conflicts = result.conflicts || [];
          conflicts.forEach((scan) => recordScan({
            studentId: scan.studentId || null,
            rollNo: scan.rollNo || null,
            type: scan.type || "HOSTELITE",
            result: "CONFLICT",
            reason: "Pass was consumed on another device while this scan was offline.",
            tripId: scan.tripId,
            routeId: scan.routeId,
            conductorId: user?.id,
          }));
          if (conflicts.length) {
            triggerEvent("offline-sync-conflict", {
              message: `${conflicts.length} offline scan conflict${conflicts.length === 1 ? "" : "s"} require review.`,
              audienceLabel: "Scan Logs",
            });
          }
          localStorage.setItem(QUEUE_KEY, "[]");
          setQueueLength(0);
          toast.success(`${queue.length - conflicts.length} queued scan(s) synchronized.${conflicts.length ? ` ${conflicts.length} conflict(s) sent to Admin.` : ""}`);
        } catch (error) {
          toast.error(`Offline scans could not synchronize: ${error.response?.data?.message || error.message}`);
        }
      }
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [recordScan, triggerEvent, user?.id]);

  const queueScan = (record) => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    queue.push(record);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setQueueLength(queue.length);
  };

  const scanManualRoll = () => {
    const rollNo = manualRollNo.trim().toUpperCase();
    const student = students.find((record) => record.rollNo.toUpperCase() === rollNo);
    if (!student) {
      recordScan({
        rollNo,
        type: "MANUAL",
        result: "RED",
        reason: "Not registered",
        tripId: activeTripId,
        routeId: route?.id,
        conductorId: user?.id,
      });
      playTone(false);
      setFlash({ ok: false, reason: "Not registered" });
      return;
    }
    if (student.role === "HOSTELITE") {
      recordScan({
        studentId: student.id,
        rollNo,
        type: "MANUAL",
        result: "RED",
        reason: "Hostelite must present an approved trip QR pass.",
        tripId: activeTripId,
        routeId: route?.id,
        conductorId: user?.id,
      });
      playTone(false);
      setFlash({ ok: false, reason: "Present approved hostelite QR pass", name: student.name });
      return;
    }
    setManualRollNo("");
    void handleDecoded(createStudentQrPayload(student));
  };

  useEffect(() => {
    if (!selectedTripId && assignedTrips.length) {
      const openTrip = assignedTrips.find((trip) => trip.status === "ACTIVE") || assignedTrips[0];
      setSelectedTripId(openTrip.id);
    }
  }, [assignedTrips, selectedTripId]);

  const handleDecoded = useCallback(
    async (decodedText) => {
      if (processingRef.current) return;
      processingRef.current = true;

      let ticketPayload = null;
      try {
        const decoded = JSON.parse(decodedText);
        if (decoded?.type === "SMARTU_HOSTELITE_PASS") ticketPayload = decoded;
        if (decoded?.type === "SMARTU_TICKET" && typeof decoded.token === "string") ticketPayload = decoded;
      } catch {
        ticketPayload = null;
      }

      if (ticketPayload?.type === "SMARTU_HOSTELITE_PASS") {
        try {
          const hostStudent = students.find((record) => record.id === ticketPayload.studentId);
          let result;
          if (!hostStudent || hostStudent.accountStatus !== "Approved") {
            result = { success: false, reason: "Not registered" };
          } else if (!activeTripId) {
            result = { success: false, reason: "No active trip" };
          } else {
            result = isOnline
              ? await transportService.scanPass(decodedText, activeTripId)
              : useTransportWorkflowStore.getState().scanHostelitePass(decodedText, activeTripId);
          }
          recordScan({
            studentId: hostStudent?.id || null,
            rollNo: hostStudent?.rollNo || null,
            type: "HOSTELITE",
            result: result.success ? "GREEN" : "RED",
            reason: result.success ? null : result.reason,
            tripId: activeTripId,
            routeId: route?.id,
            conductorId: user?.id,
          });
          if (!result.success) {
            playTone(false);
            setFlash({ ok: false, reason: result.reason, name: hostStudent?.name });
          } else {
            playTone(true);
            setFlash({ ok: true, name: `${hostStudent.name} · ${result.ticket.seatType || "Seated"}` });
            if (!isOnline) {
              queueScan({
                ticketId: result.ticket.id,
                studentId: hostStudent.id,
                rollNo: hostStudent.rollNo,
                type: "HOSTELITE",
                tripId: activeTripId,
                routeId: route?.id,
                conductorId: user?.id,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          toast.error(error.response?.data?.message || error.message || "Unable to verify hostelite QR.");
          playTone(false);
          setFlash({ ok: false, reason: "Unable to verify pass" });
        }
        setTimeout(() => {
          setFlash(null);
          processingRef.current = false;
        }, 2500);
        return;
      }

      if (ticketPayload) {
        const result = redeemTicket(ticketPayload.token, route?.id);
        if (!result.success) {
          playTone(false);
          setFlash({ ok: false, reason: result.error });
        } else {
          playTone(true);
          const ticketStudent = students.find((record) => record.id === result.ticket.userId);
          setFlash({ ok: true, name: `${ticketStudent?.name || result.ticket.userName} · ${result.ticket.status}` });
          const remainingActive = useTransportWorkflowStore.getState().tickets.some(
            (ticket) => ticket.userId === result.ticket.userId && ["Active", "HalfRedeemed"].includes(ticket.status)
          );
          if (result.ticket.status === "Redeemed" && !remainingActive && ticketStudent) {
            updateStudent(ticketStudent.id, { routeId: null, pickupStop: null });
          }
        }
        setTimeout(() => {
          setFlash(null);
          processingRef.current = false;
        }, 2500);
        return;
      }

      const result = validateScan(decodedText, route?.id, boardedSet, students);

      if (result.allowed) {
        markAttendance({
          userId: result.student.id,
          rollNo: result.student.rollNo,
          routeId: route.id,
          busId: currentBus?.id || bus.id,
          stop: route.stops?.[0]?.name || "Main Gate",
          method: "QR Scan",
        });
        playTone(true);
        setFlash({ ok: true, name: result.student.name });
        recordScan({
          studentId: result.student.id,
          rollNo: result.student.rollNo,
          type: "DAY_SCHOLAR",
          result: "GREEN",
          tripId: activeTripId,
          routeId: route?.id,
          conductorId: user?.id,
        });
        if (!isOnline) {
          queueScan({
            rollNo: result.student.rollNo,
            studentId: result.student.id,
            type: "DAY_SCHOLAR",
            routeId: route.id,
            busId: bus.id,
            tripId: activeTripId,
            conductorId: user?.id,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        playTone(false);
        setFlash({ ok: false, reason: result.reason, name: result.student?.name });
        recordScan({
          studentId: result.student?.id || null,
          rollNo: result.student?.rollNo || null,
          type: "DAY_SCHOLAR",
          result: "RED",
          reason: result.reason,
          tripId: activeTripId,
          routeId: route?.id,
          conductorId: user?.id,
        });
      }

      setTimeout(() => {
        setFlash(null);
        processingRef.current = false;
      }, 2500);
    },
    [route, bus, currentBus, boardedSet, students, markAttendance, redeemTicket, updateStudent, isOnline, activeTripId, recordScan, user?.id]
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

        <form className="absolute bottom-24 left-1/2 z-20 flex w-[min(92%,420px)] -translate-x-1/2 gap-2 rounded-xl bg-background/95 p-2 shadow-lg" onSubmit={(event) => { event.preventDefault(); scanManualRoll(); }}>
          <label className="sr-only" htmlFor="manual-roll-scan">Manual student roll number</label>
          <input id="manual-roll-scan" value={manualRollNo} onChange={(event) => setManualRollNo(event.target.value.toUpperCase())} placeholder="Manual Day Scholar roll number" autoComplete="off" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground" />
          <Button type="submit" size="sm" variant="secondary">Verify</Button>
        </form>

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

  if (!activeTrip) {
    return (
      <div className="space-y-4 p-4">
        <Card className="border-none bg-primary text-primary-foreground"><CardContent className="p-5">
          <p className="text-xs text-primary-foreground/70">Assigned duty</p><p className="mt-1 text-2xl font-bold">{route?.shortName || "No route assigned"}</p><p className="mt-1 text-sm text-primary-foreground/80">{bus?.plate || "Assign a bus to start"}</p>
        </CardContent></Card>
        <Card><CardContent className="space-y-3 p-4">
          <Label htmlFor="assigned-trip">Select assigned trip</Label>
          <Select value={selectedTripId} onValueChange={setSelectedTripId}>
            <SelectTrigger id="assigned-trip"><SelectValue placeholder="Choose today's trip" /></SelectTrigger>
            <SelectContent>{assignedTrips.map((trip) => <SelectItem key={trip.id} value={trip.id}>{trip.departureTime} · {trip.status}</SelectItem>)}</SelectContent>
          </Select>
          {!assignedTrips.length && <p className="text-sm text-muted-foreground">No trip is scheduled for your assigned route today.</p>}
          <Button className="w-full gap-2" disabled={!selectedTripId} onClick={async () => {
            try {
              const result = await transportService.startTrip(selectedTripId, user?.id);
              if (result.success) toast.success("Trip started.");
              else toast.error(result.error || "Could not start trip.");
            } catch (error) {
              toast.error(error.response?.data?.message || error.message || "Could not start trip.");
            }
          }}><Play className="h-4 w-4" />Start Trip</Button>
          <p className="text-xs text-muted-foreground">Camera scanning requires permission and a secure HTTPS connection on phones.</p>
        </CardContent></Card>
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
              <p className="font-semibold text-foreground">{currentBus?.plate}</p>
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
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="gap-2" onClick={() => navigate("/conductor/notify")}><BellRing className="h-4 w-4" />Notify Admin</Button>
        <Button variant="destructive" className="gap-2" onClick={async () => {
          try {
            const result = await transportService.endTrip(activeTripId);
            const expired = result.expiredCount || 0;
            toast.success(`Trip ended. ${expired} unused pass${expired === 1 ? "" : "es"} expired.`);
            setScanning(false);
            setSelectedTripId("");
          } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Could not end trip.");
          }
        }}><Square className="h-4 w-4" />End Trip</Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">{tripCounts?.seatedCount || 0} seated · {tripCounts?.standingCount || 0} standing · {Math.max(0, capacity - (tripCounts?.seatedCount || 0))} seats available</p>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Camera className="h-3.5 w-3.5" /> Requires camera access to scan student boarding passes.
      </p>
    </div>
  );
}
