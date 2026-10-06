import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Bus,
  QrCode,
  CreditCard,
  User,
  Megaphone,
  FileText,
  AlertTriangle,
  HelpCircle,
  LogOut,
  Bell,
  Search,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Chatbot } from "@/components/shared/Chatbot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, initials } from "@/lib/utils";

const MOBILE_TABS = [
  { to: "/student", label: "Home", icon: Home, end: true },
  { to: "/student/transport", label: "Transport", icon: Bus },
  { to: "/student/attendance", label: "Attendance", icon: QrCode },
  { to: "/student/payments", label: "Payments", icon: CreditCard },
  { to: "/student/profile", label: "Profile", icon: User },
];

const DESKTOP_NAV = [
  { to: "/student", label: "Dashboard", icon: Home, end: true },
  { to: "/student/transport", label: "Live Tracking & Route", icon: Bus },
  { to: "/student/attendance", label: "Attendance & QR", icon: QrCode },
  { to: "/student/payments", label: "Fee & Fines", icon: CreditCard },
  { to: "/student/announcements", label: "Announcements", icon: Megaphone },
  { to: "/student/rules", label: "Rules & Policy", icon: FileText },
  { to: "/student/report-issue", label: "Report Issue", icon: AlertTriangle },
  { to: "/student/help", label: "Help & FAQs", icon: HelpCircle },
];

export default function StudentLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Top Header - Responsive */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo showSubtitle={false} />
            <Badge variant="accent" className="hidden sm:inline-flex text-xs">
              {user?.role === "FACULTY" ? "Faculty Portal" : user?.role === "HOSTELITE" ? "Hostelite Portal" : "Day Scholar Portal"}
            </Badge>
          </div>

          {/* Desktop Search / Info */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
            <span>FAST NUCES CFD Campus</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell onClick={() => navigate("/student/notifications")} />
            
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-secondary transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {initials(user?.name || "ST")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-semibold text-foreground leading-tight">{user?.name || "Student"}</p>
                    <p className="text-[10px] text-muted-foreground">{user?.rollNo || "22F-3082"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.rollNo} • Day Scholar</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/student/profile")}>
                  <User className="mr-2 h-4 w-4" /> Transport Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/student/payments")}>
                  <CreditCard className="mr-2 h-4 w-4" /> Transport Fee & Receipts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/student/help")}>
                  <HelpCircle className="mr-2 h-4 w-4" /> Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop Navigation Row */}
        <div className="hidden lg:block border-t border-border bg-background/50">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-8 py-2 overflow-x-auto">
            {DESKTOP_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors",
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
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12">
        <Outlet />
      </main>

      {/* Floating AI Chatbot Widget */}
      <Chatbot />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur lg:hidden safe-bottom">
        {MOBILE_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
