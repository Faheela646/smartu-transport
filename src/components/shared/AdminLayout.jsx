import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Bus,
  Route as RouteIcon,
  Megaphone,
  Settings,
  LogOut,
  Bell,
  Map,
  ClipboardList,
  MessageSquareWarning,
  BarChart3,
  BadgeCheck,
  Ticket,
  AlertTriangle,
  ClipboardCheck,
  Receipt,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocketStore } from "@/store/useSocketStore";
import { cn, initials } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/approvals", label: "Approvals", icon: BadgeCheck },
  { to: "/admin/booking-requests", label: "Booking Requests", icon: Ticket },
  { to: "/admin/hostel-billing", label: "Hostel Billing", icon: Receipt },
  { to: "/admin/violations", label: "Violations", icon: AlertTriangle },
  { to: "/admin/scan-logs", label: "Scan Logs", icon: ClipboardCheck },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/staff", label: "Staff", icon: UserCog },
  { to: "/admin/fleet", label: "Fleet", icon: Bus },
  { to: "/admin/routes", label: "Routes", icon: RouteIcon },
  { to: "/admin/tracking", label: "Live Tracking", icon: Map },
  { to: "/admin/attendance", label: "Attendance Logs", icon: ClipboardList },
  { to: "/admin/issues", label: "Helpdesk", icon: MessageSquareWarning },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const notifications = useSocketStore((s) => s.notifications);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-secondary/40 lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r border-border bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Logo showSubtitle={false} />
          </div>
          <div className="hidden text-sm text-muted-foreground lg:block">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative">
              <Button variant="ghost" size="icon" aria-label="Open notification center" onClick={() => navigate("/admin/notifications")}>
                <Bell className="h-[18px] w-[18px]" />
              </Button>
              {unreadCount > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full p-0 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-secondary">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {initials(user?.name || "AD")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Signed in as Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-medium">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Direct header logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive h-9 px-3 gap-1.5 ml-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Log out</span>
            </Button>
          </div>
        </header>

        {/* Mobile nav row */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2 no-scrollbar lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </nav>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
