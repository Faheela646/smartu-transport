import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Check, Trash2, Tag, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ANNOUNCEMENTS } from "@/data/mockData";
import { formatDate, formatTime } from "@/lib/utils";

export default function AnnouncementsPage() {
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [readIds, setReadIds] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  const list = ANNOUNCEMENTS.filter((a) => !dismissedIds.includes(a.id));

  const toggleRead = (id) => {
    if (readIds.includes(id)) {
      setReadIds(readIds.filter((i) => i !== id));
    } else {
      setReadIds([...readIds, id]);
      toast.success("Marked as read.");
    }
  };

  const handleDismiss = (id) => {
    setDismissedIds([...dismissedIds, id]);
    toast.success("Announcement dismissed.");
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground">Official university transport broadcasts and notices.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <Tabs value={filterCategory} onValueChange={setFilterCategory}>
            <TabsList className="overflow-x-auto no-scrollbar flex-wrap">
              <TabsTrigger value="ALL">All Categories</TabsTrigger>
              <TabsTrigger value="Transport">🚌 Transport</TabsTrigger>
              <TabsTrigger value="Fee">💰 Fee</TabsTrigger>
              <TabsTrigger value="Schedule">🕐 Schedule</TabsTrigger>
              <TabsTrigger value="Urgent">⚠️ Urgent</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            {list.map((item) => {
              const isRead = readIds.includes(item.id);
              return (
                <Card key={item.id} className={`border-border transition-colors ${isRead ? "bg-card/40 opacity-80" : "bg-card shadow-xs"}`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-primary" />
                        <Badge variant="accent" className="text-[10px]">
                          {item.audienceLabel}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(item.date)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-foreground leading-relaxed">{item.message}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <span className="text-muted-foreground">Author: {item.author}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleRead(item.id)}>
                          <Check className="h-3.5 w-3.5 mr-1" /> {isRead ? "Read" : "Mark as read"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDismiss(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {list.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">No active announcements.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
