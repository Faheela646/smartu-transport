import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLE_HOME } from "@/data/mockData";

export default function Unauthorized() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-secondary/50 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">403 — Unauthorized</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your account doesn't have permission to view this page. If you think this is a mistake,
        contact the Transport Admin.
      </p>
      <Button onClick={() => navigate(user ? ROLE_HOME[user.role] : "/login")}>
        Return to Dashboard
      </Button>
    </div>
  );
}
