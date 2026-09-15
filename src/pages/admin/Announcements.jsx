import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useFleetStore } from "@/store/useFleetStore";
import { useSocketStore } from "@/store/useSocketStore";
import { ANNOUNCEMENTS } from "@/data/mockData";
import { formatDate, formatTime } from "@/lib/utils";

export default function Announcements() {
  const { routes } = useFleetStore();
  const { notifications, triggerEvent } = useSocketStore();
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("ALL");

  const sent = [
    ...notifications
      .filter((n) => n.type === "ANNOUNCEMENT")
      .map((n) => ({ id: n.id, message: n.payload.message, audienceLabel: n.payload.audienceLabel, date: n.timestamp })),
    ...ANNOUNCEMENTS,
  ];

  const handleBroadcast = () => {
    if (!message.trim()) return;
    const audienceLabel = audience === "ALL" ? "All Routes" : routes.find((r) => r.id === audience)?.shortName;
    triggerEvent("ANNOUNCEMENT", { message: message.trim(), audienceLabel, audience });
    toast.success(`Broadcast sent to ${audienceLabel}.`);
    setMessage("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground">Broadcast live updates to student portals.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Broadcast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Route 3 is delayed by 15 mins due to traffic near Jail Road."
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1.5 sm:w-64">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Students</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.shortName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBroadcast} disabled={!message.trim()}>
              <Send className="h-4 w-4" /> Broadcast
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sent Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sent.map((a) => (
            <div key={a.id} className="flex gap-3 rounded-lg border border-border p-3">
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm text-foreground">{a.message}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="accent">{a.audienceLabel}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(a.date)} · {formatTime(new Date(a.date))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
