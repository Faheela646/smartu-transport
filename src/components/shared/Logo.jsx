import { Bus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, showSubtitle = true }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-accent">
        <Bus className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold tracking-tight text-foreground">SmartU Transport</p>
        {showSubtitle && (
          <p className="text-[11px] text-muted-foreground">FAST NUCES — Chiniot-Faisalabad</p>
        )}
      </div>
    </div>
  );
}
