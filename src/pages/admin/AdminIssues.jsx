import { useState, useMemo } from "react";
import { useIssueStore } from "@/store/useIssueStore";
import { MessageSquareWarning, Filter, CheckCircle2, Clock, Search, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function AdminIssues() {
  const { issues, resolveIssue } = useIssueStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const filteredIssues = useMemo(() => {
    let list = issues;
    if (filter !== "All") {
      list = list.filter((i) => i.status === filter);
    }
    if (search) {
      list = list.filter((i) =>
        (i.id || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.category || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.description || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [issues, search, filter]);

  const stats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === "Pending Investigation").length,
    resolved: issues.filter((i) => i.status === "Resolved").length,
  };

  const handleResolve = () => {
    if (!resolutionNote.trim()) {
      toast.error("Please enter a resolution note.");
      return;
    }
    resolveIssue(selectedIssue.id, resolutionNote);
    toast.success(`Ticket ${selectedIssue.id} resolved successfully.`);
    setSelectedIssue(null);
    setResolutionNote("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquareWarning className="h-6 w-6 text-primary" /> Helpdesk & Complaints
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and resolve tickets raised by students.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <MessageSquareWarning className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Action</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search tickets..." 
            className="pl-9 bg-card" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-secondary/40 p-1 rounded-lg border border-border">
          {["All", "Pending Investigation", "Resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === f ? "bg-background shadow-sm border border-border/50 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.replace(" Investigation", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl bg-card">
            <Filter className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No tickets found.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div key={issue.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-primary bg-primary/5 px-2 py-0.5 rounded">
                        {issue.id}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        issue.status === "Resolved" 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}>
                        {issue.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(issue.date)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                      {issue.category} 
                      <span className="text-xs font-normal text-muted-foreground ml-2">
                        (Route: {issue.routeId || "N/A"} &bull; Bus: {issue.busId || "N/A"})
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {issue.description}
                    </p>
                  </div>

                  {issue.status === "Resolved" && (
                    <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 mt-2">
                      <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-1">
                        <ShieldAlert className="h-3.5 w-3.5" /> Resolution Note
                      </p>
                      <p className="text-sm text-emerald-600/90">{issue.resolutionNote}</p>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center justify-end sm:justify-start border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4 gap-2">
                  {issue.status !== "Resolved" ? (
                    <Button onClick={() => setSelectedIssue(issue)} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                      Resolve Ticket <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full sm:w-auto">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-500" /> Closed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selectedIssue} onOpenChange={(o) => !o && setSelectedIssue(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket {selectedIssue?.id}</DialogTitle>
            <DialogDescription>
              Mark this ticket as resolved. The student will be notified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-secondary/40 rounded-lg p-3 text-sm">
              <span className="font-semibold block mb-1">Issue Description:</span>
              <span className="text-muted-foreground">{selectedIssue?.description}</span>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Action Taken / Resolution Note *</label>
              <textarea
                className="w-full h-24 rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                placeholder="e.g. Warning issued to the driver, issue has been resolved."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedIssue(null); setResolutionNote(""); }}>Cancel</Button>
            <Button onClick={handleResolve}>Submit Resolution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
