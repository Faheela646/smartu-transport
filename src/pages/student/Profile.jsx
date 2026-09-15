import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  CreditCard,
  KeyRound,
  LogOut,
  Bell,
  Moon,
  Shield,
  Bus,
  MapPin,
  CheckCircle2,
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
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { initials } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, changePassword } = useAuthStore();
  const rfidCard = useAttendanceStore((s) => s.rfidCard);
  const { theme, setTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    changePassword();
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
                {initials(user?.name || "Ahmed Raza")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{user?.name || "Ahmed Raza"}</h2>
                <Badge variant="accent">Day Scholar</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Roll Number: <span className="font-mono font-medium text-foreground">{user?.rollNo || "22F-3082"}</span>
              </p>
              <p className="text-xs text-muted-foreground">FAST NUCES Chiniot-Faisalabad Campus</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/login"); }} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-1.5" /> Log out
          </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-border p-3.5 bg-background/80 space-y-1">
              <span className="text-muted-foreground">Assigned Route</span>
              <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Bus className="h-4 w-4 text-primary" /> Route R-01 (D-Ground)
              </p>
            </div>

            <div className="rounded-xl border border-border p-3.5 bg-background/80 space-y-1">
              <span className="text-muted-foreground">Designated Pickup Stop</span>
              <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-500" /> Kohinoor Chowk
              </p>
            </div>

            <div className="rounded-xl border border-border p-3.5 bg-background/80 space-y-1">
              <span className="text-muted-foreground">Associated RFID Number</span>
              <p className="font-mono font-bold text-sm text-foreground">{rfidCard.cardNumber}</p>
            </div>

            <div className="rounded-xl border border-border p-3.5 bg-background/80 space-y-1">
              <span className="text-muted-foreground">Transport Subscription</span>
              <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Active (Paid - Sept 2026)
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
                <Input type="password" required value={newPass} onChange={(e) => setNewPass(e.target.value)} />
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
