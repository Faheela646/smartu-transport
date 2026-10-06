import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";
import { createStudentQrPayload } from "@/lib/studentQr";

export default function BoardingPass() {
  const user = useAuthStore((s) => s.user);
  const students = useStudentStore((s) => s.students);
  const { routes } = useFleetStore();

  const student = students.find(
    (s) =>
      (user?.rollNo && s.rollNo.toLowerCase() === user.rollNo.toLowerCase()) ||
      (user?.email && s.email?.toLowerCase() === user.email.toLowerCase())
  ) || {
    name: user?.name || "Student",
    rollNo: user?.rollNo || user?.loginId || "",
    role: user?.role || "DAY_SCHOLAR",
    routeId: "RT-01",
  };

  const route = routes.find((r) => r.id === student?.routeId) || routes[0];
  const qrValue = createStudentQrPayload(student);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-lg font-bold text-foreground">Boarding Pass</h1>
        <p className="text-sm text-muted-foreground">Show this to the conductor when boarding.</p>
      </div>

      <Card className="w-full max-w-xs overflow-hidden">
        <div className="bg-primary px-5 py-4 text-primary-foreground">
          <p className="text-sm font-semibold">{student?.name}</p>
          <p className="text-xs text-primary-foreground/70">{student?.rollNo}</p>
        </div>
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <div className="relative flex items-center justify-center">
            <div className="rounded-xl border-4 border-secondary p-3">
              <QRCodeSVG value={qrValue} size={190} fgColor="#07274c" level="M" />
            </div>
          </div>

          <Badge variant="accent">Present this personal code to your conductor</Badge>

          <div className="w-full space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Route</span>
              <span className="font-medium text-foreground">{route?.shortName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium text-foreground">{student?.role === "HOSTELITE" ? "Hostelite" : "Day Scholar"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="max-w-xs text-center text-xs text-muted-foreground">
        This code is unique to your student account. The conductor scans it to record your boarding
        and attendance.
      </p>
    </div>
  );
}
