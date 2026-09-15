import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export default function ConductorLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background lg:max-w-lg lg:border-x lg:border-border lg:shadow-sm">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-primary px-4 text-primary-foreground">
        <div>
          <p className="text-sm font-bold">{user?.name}</p>
          <p className="text-xs text-primary-foreground/70">Conductor</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
