import { useRef } from "react";
import { toast } from "sonner";
import { Receipt, Upload, CheckCircle2, Clock3, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { useFineStore } from "@/store/useFineStore";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_META = {
  Unpaid: { icon: AlertCircle, variant: "destructive" },
  "Pending Approval": { icon: Clock3, variant: "warning" },
  Cleared: { icon: CheckCircle2, variant: "success" },
};

export default function Wallet() {
  const user = useAuthStore((s) => s.user);
  const { fines, submitChallan, finesForStudent } = useFineStore();
  const fileInputRef = useRef(null);
  const activeFineIdRef = useRef(null);

  const myFines = finesForStudent(user?.rollNo || "");
  const totalDue = myFines.filter((f) => f.status === "Unpaid").reduce((sum, f) => sum + f.amount, 0);

  const triggerUpload = (fineId) => {
    activeFineIdRef.current = fineId;
    fileInputRef.current?.click();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeFineIdRef.current) return;
    submitChallan(activeFineIdRef.current, file.name);
    toast.success("Challan uploaded. Pending admin approval.");
    e.target.value = "";
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Wallet</h1>
        <p className="text-sm text-muted-foreground">Fines, fees, and challan submissions.</p>
      </div>

      <Card className="border-none bg-primary text-primary-foreground">
        <CardContent className="p-5">
          <p className="text-xs text-primary-foreground/70">Total Outstanding</p>
          <p className="mt-1 text-3xl font-bold">{formatCurrency(totalDue)}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {myFines.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No fines on your account. Keep it that way! 🎉
            </CardContent>
          </Card>
        )}
        {myFines.map((fine) => {
          const meta = STATUS_META[fine.status];
          const Icon = meta.icon;
          return (
            <Card key={fine.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{fine.reason}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(fine.date)}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-foreground">{formatCurrency(fine.amount)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={meta.variant} className="gap-1">
                    <Icon className="h-3 w-3" /> {fine.status}
                  </Badge>
                  {fine.status === "Unpaid" && (
                    <Button size="sm" variant="outline" onClick={() => triggerUpload(fine.id)}>
                      <Upload className="h-3.5 w-3.5" /> Submit Challan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
    </div>
  );
}
