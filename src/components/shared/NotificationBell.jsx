import { Bell, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocketStore } from "@/store/useSocketStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ANNOUNCEMENTS } from "@/data/mockData";
import { formatDate } from "@/lib/utils";

export function NotificationBell() {
  const liveNotifications = useSocketStore((s) => s.notifications);
  const markAllRead = useSocketStore((s) => s.markAllRead);
  const markNotificationsReadFor = useSocketStore((s) => s.markNotificationsReadFor);
  const user = useAuthStore((s) => s.user);
  const visibleNotifications = user?.role === "HOSTELITE"
    ? liveNotifications.filter((item) => item.payload?.audienceRole !== "ADMIN"
      && (!item.payload?.studentId || item.payload.studentId === user?.id))
    : liveNotifications;

  const items = [
    ...visibleNotifications.map((n) => ({
      id: n.id,
      message: n.payload?.message,
      date: n.timestamp,
      audienceLabel: n.payload?.audienceLabel || "All Routes",
    })),
    ...ANNOUNCEMENTS,
  ].slice(0, 8);

  const unread = visibleNotifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (!open) return;
      if (user?.role === "HOSTELITE") markNotificationsReadFor(user?.id);
      else markAllRead();
    }}>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full p-2 hover:bg-secondary">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <Badge className="absolute right-0.5 top-0.5 h-4 min-w-4 justify-center rounded-full p-0 text-[10px]">
              {unread}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Announcements</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 space-y-1 overflow-y-auto p-1">
          {items.map((item) => (
            <div key={item.id} className="flex gap-2.5 rounded-md p-2 hover:bg-secondary">
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs leading-snug text-foreground">{item.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.audienceLabel} · {formatDate(item.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
