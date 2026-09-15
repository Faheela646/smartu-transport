import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Clock,
  Bus,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  FileCheck2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useFleetStore } from "@/store/useFleetStore";

export default function Attendance() {
  const navigate = useNavigate();
  const { todayAttendance, attendanceHistory, rfidCard, markAttendance } = useAttendanceStore();
  const { routes, buses } = useFleetStore();

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // 'success' | 'invalid' | null

  const activeRoute = routes[0]; // RT-01
  const activeBus = buses[0]; // BUS-101

  const handleSimulateScan = (isValid = true) => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      if (isValid) {
        markAttendance({
          routeId: activeRoute.id,
          busId: activeBus.id,
          stop: "Kohinoor Chowk",
          method: "QR Scan",
        });
        setScanResult("success");
        toast.success("✅ Attendance Marked Successfully!");
      } else {
        setScanResult("invalid");
        toast.error("⚠️ Invalid or Expired QR Code!");
      }
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">QR Attendance & Boarding</h1>
        <p className="text-sm text-muted-foreground">Scan the QR code inside your university shuttle to record your daily attendance.</p>
      </div>

      {/* Today's Boarding Status Banner */}
      <Card className={`border-2 ${todayAttendance.marked ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${todayAttendance.marked ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
              {todayAttendance.marked ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Today's Attendance: {todayAttendance.marked ? "Marked Present" : "Not Marked Yet"}
                </h2>
                <Badge variant={todayAttendance.marked ? "success" : "warning"}>
                  {todayAttendance.marked ? "🟢 Boarded" : "🟡 Pending Scan"}
                </Badge>
              </div>
              {todayAttendance.marked ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Recorded at <span className="font-semibold text-foreground">{todayAttendance.time}</span> • Stop: {todayAttendance.stop} • Method: {todayAttendance.method}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Board your assigned bus and scan the QR code displayed near the front entrance.
                </p>
              )}
            </div>
          </div>

          {!todayAttendance.marked && (
            <Button onClick={() => handleSimulateScan(true)} className="w-full sm:w-auto gap-2">
              <Camera className="h-4 w-4" /> Open Camera Scanner
            </Button>
          )}
        </CardContent>
      </Card>

      {/* QR Code Scanner Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Shuttle QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative mx-auto flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 sm:p-10 bg-secondary/20 text-center max-w-md">
            {isScanning ? (
              <div className="py-8 space-y-3">
                <RefreshCw className="h-10 w-10 text-primary animate-spin mx-auto" />
                <p className="text-sm font-semibold text-foreground">Scanning Shuttle QR Code...</p>
                <p className="text-xs text-muted-foreground">Validating trip authentication and boarding time</p>
              </div>
            ) : scanResult === "success" || todayAttendance.marked ? (
              <div className="py-4 space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-emerald-600">Attendance Recorded Successfully!</p>
                  <p className="text-xs text-muted-foreground mt-1">Verified on Route R-01 (BUS-101 • FSD-2023)</p>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleSimulateScan(true)}>
                    Rescan QR Code
                  </Button>
                </div>
              </div>
            ) : scanResult === "invalid" ? (
              <div className="py-4 space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-base font-bold text-rose-600">Invalid or Expired QR Code</p>
                  <p className="text-xs text-muted-foreground mt-1">Make sure you are scanning the active QR code inside your assigned shuttle.</p>
                </div>
                <div className="flex items-center gap-2 justify-center pt-2">
                  <Button size="sm" onClick={() => handleSimulateScan(true)}>Try Again</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/student/report-issue")}>Report Issue</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <QrCode className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Scan QR Code inside Shuttle</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Point your device camera at the QR code displayed near the bus conductor station.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                  <Button onClick={() => handleSimulateScan(true)} className="gap-2">
                    <Camera className="h-4 w-4" /> Scan Boarding QR Code
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleSimulateScan(false)}>
                    Test Invalid QR
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* RFID Card Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Associated RFID Student Card
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border p-4 bg-secondary/30">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">RFID Card Number</p>
              <p className="text-base font-mono font-bold text-foreground">{rfidCard.cardNumber}</p>
              <p className="text-xs text-muted-foreground">Issued: {rfidCard.issuedDate} • Last Scanned: {rfidCard.lastScanned}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> RFID {rfidCard.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" /> Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Bus</TableHead>
                <TableHead>Boarding Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-xs text-foreground">{item.date}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.routeId}</TableCell>
                  <TableCell className="text-xs font-mono">{item.busId}</TableCell>
                  <TableCell className="text-xs font-semibold">{item.time}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline">{item.method}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="success">{item.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
