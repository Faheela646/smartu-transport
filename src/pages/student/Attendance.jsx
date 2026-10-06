import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  QrCode,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck2,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuthStore } from "@/store/useAuthStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";
import { createStudentQrPayload } from "@/lib/studentQr";
import { Button } from "@/components/ui/button";

export default function Attendance() {
  const user = useAuthStore((state) => state.user);
  const students = useStudentStore((state) => state.students);
  const { attendanceHistory, rfidCard, markAttendance } = useAttendanceStore();
  const { routes, buses } = useFleetStore();
  const student = students.find(
    (record) =>
      record.id === user?.id ||
      record.rollNo?.toLowerCase() === user?.rollNo?.toLowerCase() ||
      record.email?.toLowerCase() === user?.email?.toLowerCase()
  ) || {
    id: user?.id || "",
    name: user?.name || "Student",
    rollNo: user?.rollNo || user?.loginId || "",
    role: user?.role || "DAY_SCHOLAR",
    routeId: null,
  };
  const route = routes.find((record) => record.id === student.routeId);
  const bus = buses.find((record) => record.id === route?.busId);
  const studentHistory = attendanceHistory.filter((record) => record.rollNo === student.rollNo);
  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = studentHistory.find((record) => record.date === today);
  const qrValue = createStudentQrPayload(student);
  const markPresent = () => {
    if (student.accountStatus !== "Approved") {
      toast.error("Your account must be approved before attendance can be recorded.");
      return;
    }
    if (todayAttendance) {
      toast.info("Your presence is already recorded for today.");
      return;
    }
    const record = markAttendance({
      userId: student.id,
      rollNo: student.rollNo,
      routeId: student.routeId,
      busId: bus?.id,
      stop: student.pickupStop || route?.stops?.[0]?.name,
      method: "Self Mark",
    });
    toast.success(record.date === today ? "Attendance marked for today." : "Attendance already exists for today.");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">QR Attendance & Boarding</h1>
        <p className="text-sm text-muted-foreground">Show your personal QR code to the conductor when boarding. Your attendance will be recorded after it is scanned.</p>
      </div>

      {/* Today's Boarding Status Banner */}
      <Card className={`border-2 ${todayAttendance ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${todayAttendance ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
              {todayAttendance ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Today's Attendance: {todayAttendance ? "Marked Present" : "Not Marked Yet"}
                </h2>
                <Badge variant={todayAttendance ? "success" : "warning"}>
                  {todayAttendance ? "🟢 Boarded" : "🟡 Pending Scan"}
                </Badge>
              </div>
              {todayAttendance ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Recorded at <span className="font-semibold text-foreground">{todayAttendance.time}</span> • Stop: {todayAttendance.stop} • Method: {todayAttendance.method}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Show your student QR code below to the conductor when boarding.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!todayAttendance && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {student.accountStatus === "Approved"
              ? "You can mark your own presence once per day or present your QR code to the conductor."
              : "Attendance can be recorded after the Transport Office approves your account."}
          </p>
          <Button variant="outline" onClick={markPresent} disabled={student.accountStatus !== "Approved"}>Mark my presence</Button>
        </div>
      )}

      {/* Personal QR code for conductor scanning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Your Student Boarding QR
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="rounded-xl border-4 border-secondary bg-white p-3">
            <QRCodeSVG value={qrValue} size={220} fgColor="#07274c" level="M" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">{student.name}</p>
            <p className="font-mono text-sm text-muted-foreground">{student.rollNo}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {route?.shortName || "No route assigned"}{bus ? ` • ${bus.plate}` : ""}
            </p>
          </div>
          <Badge variant="outline">Present this code to your conductor</Badge>
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
              {studentHistory.map((item) => (
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
              {studentHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No attendance scans recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
