import { useState, useEffect } from "react";
import { MapPin, Navigation2, Search, Bus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BUSES, ROUTES, CAMPUS_CENTER } from "@/data/mockData";

export default function AdminLiveTracking() {
  const [activeBuses, setActiveBuses] = useState([]);

  useEffect(() => {
    // Generate some fake live positions for buses currently on routes
    const live = BUSES.filter(b => b.routeId && b.status === "Active").map(b => {
      const route = ROUTES.find(r => r.id === b.routeId);
      return {
        ...b,
        route,
        speed: Math.floor(30 + Math.random() * 25), // 30-55 km/h
        lat: CAMPUS_CENTER.lat - (Math.random() * 0.05 - 0.025),
        lng: CAMPUS_CENTER.lng - (Math.random() * 0.05 - 0.025),
      };
    });
    setActiveBuses(live);
  }, []);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Navigation2 className="h-6 w-6 text-primary" /> Live Fleet Tracking
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time GPS tracking of all active buses on campus routes.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search bus or route..." className="pl-9 bg-card" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Active Fleet ({activeBuses.length})</h3>
          {activeBuses.map((bus) => (
            <Card key={bus.id} className="p-3 border-border hover:border-primary/40 cursor-pointer transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Bus className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{bus.id}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{bus.plate}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
                  {bus.speed} km/h
                </span>
              </div>
              <div className="mt-2 text-xs">
                <p className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> {bus.route?.name}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-border bg-card overflow-hidden relative shadow-inner h-[500px] lg:h-auto">
          {/* FAKE MAP UI */}
          <div className="absolute inset-0 bg-[#e5e3df] dark:bg-[#242f3e]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23000000' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }}>
            {/* Campus Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="bg-primary text-primary-foreground font-bold text-[10px] px-2 py-1 rounded shadow-lg mb-1 whitespace-nowrap">
                FAST CFD Campus
              </div>
              <div className="h-4 w-4 bg-primary rounded-full border-2 border-white dark:border-gray-800 shadow-xl z-10" />
            </div>

            {/* Fake Bus Pins */}
            {activeBuses.map((bus, i) => {
              // Scatter them around
              const top = 20 + (i * 15) + "%";
              const left = 30 + (i * 10 > 50 ? 50 - i * 5 : i * 10) + "%";
              
              return (
                <div key={bus.id} className="absolute flex flex-col items-center transition-all duration-1000" style={{ top, left }}>
                  <div className="bg-background/90 backdrop-blur text-foreground border border-border font-bold text-[10px] px-2 py-1 rounded shadow-lg mb-1 whitespace-nowrap flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {bus.id} ({bus.speed} km/h)
                  </div>
                  <div className="h-5 w-5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 shadow-xl flex items-center justify-center text-white relative z-20">
                    <Bus className="h-3 w-3" />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur border border-border rounded-lg p-3 text-xs shadow-lg max-w-xs">
            <p className="font-semibold mb-1">Live Feed</p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected to GPS network. Updating every 5 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
