import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

export default function DriverLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();
  const previousTheme = theme;

  // Driver portal defaults to dark mode to reduce glare — restore the
  // previous theme when the driver navigates away.
  useEffect(() => {
    setTheme("dark");
    return () => setTheme(previousTheme || "light");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dark mx-auto flex min-h-screen max-w-md flex-col bg-background text-foreground lg:max-w-lg lg:border-x lg:border-border">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <div>
          <p className="text-sm font-bold">{user?.name}</p>
          <p className="text-xs text-muted-foreground">Driver</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
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
