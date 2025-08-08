"use client";

import { useState, useTransition, useEffect } from "react";
import type { Room } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormState } from "react-dom";
import { bookSeatAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export default function BookingClient({ room }: { room: Room }) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [state, formAction] = useFormState(bookSeatAction, {
    success: false,
    message: "",
  });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Success!" : "Error",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      });
      if (state.success) {
        setSelectedSeat(null);
      }
    }
  }, [state, toast]);

  const bookedSeatNumbers = new Set(room.bookings.map((b) => b.seatNumber));

  const handleFormSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };

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
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
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
                      "h-12 w-12 text-sm font-semibold transition-all duration-200",
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
        <form action={handleFormSubmit} className="mt-6">
          <input type="hidden" name="roomId" value={room.id} />
          <input type="hidden" name="seatNumber" value={selectedSeat ?? ""} />
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={!selectedSeat || isPending}
          >
            {isPending ? "Booking..." : `Book Seat ${selectedSeat || ""}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
