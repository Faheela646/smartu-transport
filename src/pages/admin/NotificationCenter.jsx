import { useEffect, useState } from "react";
import { useSocketStore } from "@/store/useSocketStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isMockMode, transportService } from "@/api/transportService";
import { toast } from "sonner";

export default function NotificationCenter() {
  const notifications = useSocketStore((state) => state.notifications);
  const [loadError, setLoadError] = useState("");
  const markAllAsRead = async () => {
    try {
      await transportService.markNotificationsRead();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not update notifications.");
    }
  };

  useEffect(() => {
    if (isMockMode) return undefined;
    let cancelled = false;
    transportService.listNotifications().catch((error) => {
      if (!cancelled) setLoadError(error.response?.data?.message || error.message || "Could not load notifications.");
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold tracking-tight">Notification Center</h1><p className="text-sm text-muted-foreground">Booking requests, ticket updates, violations, and operational alerts.</p></div>
        <Button variant="outline" onClick={markAllAsRead} disabled={!notifications.some((item) => !item.read)}>Mark all read</Button>
      </div>
      {loadError && <Card className="border-destructive/40"><CardContent className="p-3 text-sm text-destructive">{loadError}</CardContent></Card>}
      {!notifications.length && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">You're all caught up. New alerts will appear here.</CardContent></Card>}
      {notifications.map((item) => <Card key={item.id} className={!item.read ? "border-primary/40" : ""}><CardContent className="flex items-start justify-between gap-4 p-4">
        <div><p className="text-sm">{item.payload?.message || item.type}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()} · {item.payload?.audienceLabel || "Transport"}</p></div>
        {!item.read && <Badge variant="accent">New</Badge>}
      </CardContent></Card>)}
    </div>
  );
}
