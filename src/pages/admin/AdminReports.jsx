import { useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Download, Calendar, Users, Route } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState("financial");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Reports &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Download comprehensive system data and analytics.</p>
        </div>
        <Button className="gap-2 bg-primary">
          <Download className="h-4 w-4" /> Export Full Audit (PDF)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> Current Semester Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">Rs. 1.2M</p>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" /> +12% from last semester
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Active Bus Passes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold text-foreground">845</p>
            <p className="text-xs text-muted-foreground mt-1">Students using transport</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Route className="h-4 w-4 text-amber-500" /> Most Active Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-foreground">RT-02 (Jaranwala)</p>
            <p className="text-xs text-muted-foreground mt-1">210 students assigned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="usage">Usage &amp; Operations</TabsTrigger>
        </TabsList>
        <TabsContent value="financial" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Download Financial Statements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Fall 2026 Semester Collection Report", date: "Sep 2026" },
                { name: "Fine Collection History", date: "All Time" },
                { name: "Outstanding Dues & Defaulters", date: "Current" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Period: {r.date}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operational Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Daily Boarding / Attendance Logs", date: "Sep 2026" },
                { name: "Fleet Maintenance & Servicing History", date: "All Time" },
                { name: "Driver / Conductor Shift Logs", date: "Sep 2026" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">Period: {r.date}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
