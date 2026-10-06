import { Bell, Bus, Megaphone, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocketStore } from "@/store/useSocketStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const notifications = useSocketStore((state) => state.notifications);
  const markNotificationsReadFor = useSocketStore((state) => state.markNotificationsReadFor);
  const markAllRead = useSocketStore((state) => state.markAllRead);
  const user = useAuthStore((state) => state.user);
  const visibleNotifications = user?.role === "HOSTELITE"
    ? notifications.filter((notification) => notification.payload?.audienceRole !== "ADMIN"
      && (!notification.payload?.studentId || notification.payload.studentId === user?.id))
    : notifications;

  const getIcon = (type) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return <Megaphone className="h-4 w-4 text-purple-500" />;
      case "REASSIGNMENT":
        return <Bus className="h-4 w-4 text-blue-500" />;
      case "BUS_MAINTENANCE":
        return <Bus className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notification Center</h1>
          <p className="text-sm text-muted-foreground">Live alerts, boarding confirmations, and route updates.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => user?.role === "HOSTELITE" ? markNotificationsReadFor(user.id) : markAllRead()}>
          <Check className="h-4 w-4 mr-1.5" /> Mark All as Read
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {visibleNotifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No recent notifications. You are all caught up!
            </div>
          ) : (
            visibleNotifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                  n.read ? "border-border/60 bg-card/40 opacity-75" : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-xs">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">
                      {n.payload?.audienceLabel || n.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{formatDate(n.timestamp)}</span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{n.payload?.message || "Notification received."}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
