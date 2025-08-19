"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { IBooking } from "@/modals/Booking";
import { IRoom } from "@/modals/Room";

export default function BookingClient({
  room,
  date,
}: {
  room: IRoom;
  date: string;
}) {
  const { data: session, status } = useSession();

  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [existingBookings, setexistingBookings] = useState(0);
  // Booked seats state (should be fetched from API)
  const [bookedSeatNumbers, setBookedSeatNumbers] = useState<Set<number>>(
    new Set()
  );

  // Fetch booked seats for this room
  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?date=${date}&roomId=${room?.id}`);
      const bookings: IBooking[] = await res.json();
      const booked = bookings.map((b) => {
        if (b?.userId == session?.user?.id) {
          setexistingBookings(b?._id);
        }
        return b.seatNumber;
      });
      setBookedSeatNumbers(new Set(booked));
    } catch {
      // Optionally handle error
    }
  };

  useEffect(() => {
    if (room.id && date) fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, date, session?.user?.id]);

  const handleBooking = async () => {
    if (!selectedSeat) return;
    setIsPending(true);
    try {
      if (existingBookings) {
        await fetch(`/api/bookings/${existingBookings}`, {
          method: "DELETE",
        });
      }
      // 3. Add new booking
      const res = await fetch(`/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          seatNumber: selectedSeat,
          userId: session?.user?.id,
          userName: session?.user?.name,
          startDate: date,
          endDate: date,
          status: "pending",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Success!",
          description: `Seat ${selectedSeat} booked successfully!`,
          variant: "default",
        });
        setSelectedSeat(null);
        await fetchBookings(); // Refetch bookings after booking
      } else {
        toast({
          title: "Error",
          description: data.error || "Booking failed.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };
  console.log("existingBookings", existingBookings);
  // ...existing code...

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Select a Seat</CardTitle>
        <CardDescription>
          Click on an available seat to make a reservation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border-2 border-dashed rounded-lg bg-muted/20">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-8">
            {Array.from({ length: room.totalCapacity }, (_, i) => i + 1).map(
              (seatNumber) => {
                const isBooked = bookedSeatNumbers.has(seatNumber);
                const isSelected = selectedSeat === seatNumber;
                return (
                  <Button
                    key={seatNumber}
                    variant={
                      isSelected
                        ? "default"
                        : isBooked
                        ? "secondary"
                        : "outline"
                    }
                    size="icon"
                    className={cn(
                      "h-16 w-16 text-sm font-semibold transition-all duration-200",
                      isSelected &&
                        "ring-2 ring-offset-2 ring-primary scale-110 shadow-lg",
                      isBooked &&
                        "cursor-not-allowed bg-muted text-muted-foreground"
                    )}
                    disabled={isBooked}
                    onClick={() => !isBooked && setSelectedSeat(seatNumber)}
                    aria-label={
                      isBooked
                        ? `Seat ${seatNumber} is booked`
                        : `Select seat ${seatNumber}`
                    }
                  >
                    {seatNumber}
                  </Button>
                );
              }
            )}
          </div>
        </div>
        <Button
          className="w-full sm:w-auto mt-6"
          disabled={!selectedSeat || isPending}
          onClick={handleBooking}
        >
          {isPending ? "Booking..." : `Book Seat ${selectedSeat || ""}`}
        </Button>
      </CardContent>
    </Card>
  );
}
