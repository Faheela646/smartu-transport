import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound, LogOut, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/useAuthStore";
import { initials } from "@/lib/utils";

export default function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const changePassword = useAuthStore((s) => s.changePassword);
  const { theme, setTheme } = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("New password and confirmation don't match.");
      return;
    }
    changePassword();
    toast.success("Password updated successfully.");
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, account security, and preferences.</p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
                {initials(user?.name || "AD")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">Login ID: {user?.loginId}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive border-destructive/30 hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-1.5" /> Log out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Toggle dark mode across the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="dark-mode">Dark Mode</Label>
          <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Choose a strong password you haven't used before.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" required value={next} onChange={(e) => setNext(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
            </div>
            <Button type="submit">
              <KeyRound className="h-4 w-4 mr-1.5" /> Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Session Logout Card */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-destructive flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" /> Admin Session Security
          </CardTitle>
          <CardDescription>Log out of your administrator account session.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            End active session on this device.
          </div>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" /> Log out of Admin Portal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
