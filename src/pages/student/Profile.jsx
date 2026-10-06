import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CreditCard,
  KeyRound,
  LogOut,
  Shield,
  Bus,
  MapPin,
  CheckCircle2,
  Mail,
  Key,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/useAuthStore";
import { useStudentStore } from "@/store/useStudentStore";
import { useFleetStore } from "@/store/useFleetStore";
import { initials } from "@/lib/utils";
import { generateStudentEmail, generateStudentPassword } from "@/data/mockData";
import { QRCodeSVG } from "qrcode.react";
import { createStudentQrPayload } from "@/lib/studentQr";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const students = useStudentStore((s) => s.students);
  const routes = useFleetStore((s) => s.routes);
  const { theme, setTheme } = useTheme();

  const student = students.find(
    (s) =>
      (user?.rollNo && s.rollNo.toLowerCase() === user.rollNo.toLowerCase()) ||
      (user?.email && s.email?.toLowerCase() === user.email.toLowerCase())
  ) || {
    name: user?.name || "Student",
    rollNo: user?.rollNo || user?.loginId || "22F-3082",
    role: user?.role || "DAY_SCHOLAR",
    routeId: "RT-01",
  };

  const assignedRoute = routes.find((r) => r.id === student.routeId) || routes[0];
  const pickupStop = assignedRoute?.stops[1] || assignedRoute?.stops[0] || { name: "Main Stop" };
  const studentEmail = student.email || generateStudentEmail(student.rollNo);
  const studentPassword = student.password || generateStudentPassword(student.rollNo);
  const rfidNumber = `RFID-${student.rollNo.replace(/[^A-Za-z0-9]/g, "")}`;
  const qrValue = createStudentQrPayload(student);

  const { updateStudentPassword } = useStudentStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (currentPass.trim() !== studentPassword) {
      toast.error("Incorrect current password.");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (newPass.trim().length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPass.trim() === studentPassword) {
      toast.error("Choose a password different from your current password.");
      return;
    }
    updateStudentPassword(student.rollNo, newPass.trim());
    toast.success("Password updated successfully.");
    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Transport Profile & Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your student credentials, transport subscription, and account security.</p>
      </div>

      {/* Student Personal Overview Card */}
      <Card>
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{student.name}</h2>
                <Badge variant={student.role === "HOSTELITE" || student.role === "FACULTY" ? "accent" : "secondary"}>
                  {student.role === "FACULTY" ? "Faculty" : student.role === "HOSTELITE" ? "Hostelite" : "Day Scholar"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {student.role === "FACULTY" ? "Staff ID" : "Roll Number"}: <span className="font-mono font-medium text-foreground">{student.rollNo}</span>
              </p>
              <p className="text-xs text-muted-foreground">FAST NUCES Chiniot-Faisalabad Campus</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/login"); }} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-1.5" /> Log out
          </Button>
        </CardContent>
      </Card>

      {/* Account Login Credentials Box */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" /> Allocated Student Login Account
          </CardTitle>
          <CardDescription>Use these credentials to log in on any device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-border p-3 bg-background/90 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <Mail className="h-3.5 w-3.5 text-primary" /> Allocated Email Address
              </span>
              <p className="font-mono font-bold text-sm text-foreground">{studentEmail}</p>
            </div>
            <div className="rounded-xl border border-border p-3 bg-background/90 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1 font-medium">
                <Key className="h-3.5 w-3.5 text-emerald-600" /> Password
              </span>
              <p className="font-mono font-bold text-sm text-emerald-600">{studentPassword}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport Card & Credentials */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Digital Transport Profile Card
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-background/80 p-4 sm:flex-row">
            <div className="rounded-lg border-2 border-secondary bg-white p-2">
              <QRCodeSVG value={qrValue} size={144} fgColor="#07274c" level="M" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">Your personal boarding QR</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Show this code to the conductor. Your attendance is marked when it is scanned.
              </p>
              <p className="mt-2 font-mono text-xs text-primary">{student.rollNo}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-border p-3.5 bg-background/80 space-y-1">
              <span className="text-muted-foreground">Assigned Route</span>
              <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Bus className="h-4 w-4 text-primary" /> {assignedRoute.shortName || assignedRoute.name}
              </p>
            </div>

            <div className="rounded-xl border border-border p-3.5 bg-background/80 space-y-1">
              <span className="text-muted-foreground">Designated Pickup Stop</span>
              <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-500" /> {pickupStop.name}
              </p>
            </div>

            <div className="rounded-xl border border-border p-3.5 bg-background/80 space-y-1">
              <span className="text-muted-foreground">Associated RFID Number</span>
              <p className="font-mono font-bold text-sm text-foreground">{rfidNumber}</p>
            </div>

            <div className="rounded-xl border border-border p-3.5 bg-background/80 space-y-1">
              <span className="text-muted-foreground">Transport Subscription</span>
              <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Active ({student.feeStatus === "Paid" ? "Paid" : "Registered"})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Preferences & Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Switch between light and dark dashboard theme</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(val) => setTheme(val ? "dark" : "light")} />
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold">Transport Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive live bus arrival alerts and announcement broadcasts</p>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={(val) => { setNotificationsEnabled(val); toast.success(`Notifications ${val ? "enabled" : "disabled"}`); }} />
          </div>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Security & Password Update
          </CardTitle>
          <CardDescription>Ensure your student portal account uses a strong password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" required value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" required minLength={8} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" required value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
              </div>
            </div>
            <Button type="submit">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
