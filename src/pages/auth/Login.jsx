import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bus, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ROLE_HOME } from "@/data/mockData";

export default function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotValue, setForgotValue] = useState("");

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Simulate network latency for the mock auth call.
    setTimeout(() => {
      const result = login(loginId, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const dest = location.state?.from?.pathname || ROLE_HOME[result.user.role] || "/";
      toast.success(`Welcome back, ${result.user.name.split(" ")[0]}`);
      navigate(dest, { replace: true });
    }, 500);
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setForgotOpen(false);
    toast.success("Password reset link sent to registered email.");
    setForgotValue("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center text-accent">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <Bus className="h-7 w-7" strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-bold text-white">SmartU Transport</h1>
          <p className="mt-1 text-sm text-white/70">FAST NUCES — Chiniot-Faisalabad Campus</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="loginId">Roll Number / Staff ID</Label>
                <Input
                  id="loginId"
                  placeholder="e.g. 22F-3082 or admin"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoCapitalize="characters"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in
              </Button>

              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="mx-auto block text-sm text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-white/60">
          Accounts are pre-provisioned by the Transport Admin. Students cannot self-register.
        </p>

        <div className="mt-4 rounded-lg border border-white/15 bg-white/5 p-3 text-[11px] leading-relaxed text-white/70">
          <p className="mb-1 font-semibold text-white/90">Demo accounts</p>
          Admin: <code>admin / admin123</code> · Day Scholar: <code>22F-3082 / student123</code> ·
          Hostelite: <code>22F-3091 / student123</code> · Conductor: <code>conductor_1 / conductor123</code> ·
          Driver: <code>driver_1 / driver123</code>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your registered email or roll number and we'll send a reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot">Email or Roll Number</Label>
              <Input
                id="forgot"
                value={forgotValue}
                onChange={(e) => setForgotValue(e.target.value)}
                placeholder="22F-3082 or you@nu.edu.pk"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">Send reset link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
