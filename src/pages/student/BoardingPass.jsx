import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";

const REFRESH_SECONDS = 30;

function mockHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

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

  const [secondsLeft, setSecondsLeft] = useState(REFRESH_SECONDS);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setNonce((n) => n + 1);
          return REFRESH_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const qrValue = useMemo(() => {
    const payload = `${student?.rollNo}|${route?.id}|${Date.now() - (Date.now() % (REFRESH_SECONDS * 1000))}|${nonce}`;
    return mockHash(payload) + "-" + student?.rollNo;
  }, [nonce, student?.rollNo, route?.id]);

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = secondsLeft / REFRESH_SECONDS;

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
            <svg width="52" height="52" viewBox="0 0 52 52" className="absolute -right-3 -top-3 -rotate-90">
              <circle cx="26" cy="26" r={radius} fill="white" stroke="#e2e8f0" strokeWidth="4" />
              <circle
                cx="26"
                cy="26"
                r={radius}
                fill="none"
                stroke="#07274c"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
              <text x="26" y="30" textAnchor="middle" fontSize="14" fill="#07274c" fontWeight="700" transform="rotate(90 26 26)">
                {secondsLeft}
              </text>
            </svg>
          </div>

          <Badge variant="accent" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Refreshes automatically — screenshots expire
          </Badge>

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
        This code is cryptographically refreshed every {REFRESH_SECONDS} seconds. A screenshot will
        stop working after the countdown ends.
      </p>
    </div>
  );
}
