import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Armchair, User as UserIcon, Ticket, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { useFleetStore } from "@/store/useFleetStore";
import { useBookingStore } from "@/store/useBookingStore";
import { STUDENTS } from "@/data/mockData";
import { formatDate } from "@/lib/utils";

export default function Book() {
  const user = useAuthStore((s) => s.user);
  const { routes } = useFleetStore();
  const { seatsAvailableFor, capacityFor, createBooking, bookingsForStudent, cancelBooking } = useBookingStore();

  const student = STUDENTS.find((s) => s.rollNo === user?.rollNo);
  const route = routes.find((r) => r.id === student?.routeId) || routes[0];
  const isHostelite = student?.role === "HOSTELITE";

  const [date, setDate] = useState(new Date());
  const [fareType, setFareType] = useState("FULL");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  const dateKey = date ? date.toISOString().slice(0, 10) : null;
  const available = dateKey ? seatsAvailableFor(route.id, dateKey) : 0;
  const cap = capacityFor(route.id);
  const noSeatsLeft = available <= 0;

  const myBookings = bookingsForStudent(student?.rollNo || "");

  const handleBook = () => {
    if (!dateKey) return;
    setPendingBooking({ rollNo: student.rollNo, routeId: route.id, date: dateKey, fareType });
    setConfirmOpen(true);
  };

  const confirmBooking = () => {
    const result = createBooking(pendingBooking);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`Trip booked for ${formatDate(pendingBooking.date)} (${pendingBooking.fareType === "FULL" ? "Reserved Seat" : "Standing"}).`);
    }
    setConfirmOpen(false);
  };

  if (!isHostelite) {
    return (
      <div className="space-y-4 p-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Book a Trip</h1>
          <p className="text-sm text-muted-foreground">Reservation booking is only available for Hostelite students.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <UserIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">You're a Day Scholar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your seat on <strong>{route.shortName}</strong> is automatically assigned. Track it live from the Map tab.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-bold text-foreground">Book a Trip</h1>
        <p className="text-sm text-muted-foreground">{route.name}</p>
      </div>

      <Card>
        <CardContent className="p-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
            className="mx-auto"
          />
        </CardContent>
      </Card>

      {dateKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fare Type — {formatDate(date)}</CardTitle>
            <CardDescription>{available} / {cap} reserved seats available for this trip.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={fareType} onValueChange={setFareType}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="FULL" id="full" disabled={noSeatsLeft} />
                <Armchair className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <Label htmlFor="full" className={noSeatsLeft ? "text-muted-foreground" : ""}>Full Fare (Reserved Seat)</Label>
                  {noSeatsLeft && <p className="text-xs text-destructive">No reserved seats left for this trip.</p>}
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="HALF" id="half" />
                <UserIcon className="h-4 w-4 text-primary" />
                <Label htmlFor="half">Half Fare (Standing)</Label>
              </label>
            </RadioGroup>

            <Button className="w-full" size="lg" onClick={handleBook} disabled={fareType === "FULL" && noSeatsLeft}>
              <CalendarCheck className="h-4 w-4" /> Confirm Booking
            </Button>
          </CardContent>
        </Card>
      )}

      {myBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your Upcoming Trips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {myBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2.5">
                  <Ticket className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatDate(b.date)}</p>
                    <Badge variant={b.fareType === "FULL" ? "accent" : "secondary"} className="mt-0.5">
                      {b.fareType === "FULL" ? "Reserved Seat" : "Standing"}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { cancelBooking(b.id); toast.success("Booking cancelled."); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
            <DialogDescription>
              {pendingBooking && (
                <>
                  {route.name} on {formatDate(pendingBooking.date)} —{" "}
                  {pendingBooking.fareType === "FULL" ? "Reserved Seat (Full Fare)" : "Standing (Half Fare)"}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={confirmBooking} className="w-full sm:w-auto">Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
