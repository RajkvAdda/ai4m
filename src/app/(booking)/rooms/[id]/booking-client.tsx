"use client";

import { useState, useEffect, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getNameFistKey } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { IBooking } from "@/modals/Booking";
import { IRoom } from "@/modals/Room";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { H4, H5 } from "@/components/ui/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BookingClient({
  room,
  date,
}: {
  room: IRoom;
  date: string;
}) {
  const { data: session } = useSession();

  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [existingBooking, setexistingBooking] = useState<string | null>(null);
  // Booked seats state (should be fetched from API)
  const [bookedSeats, setBookedSeats] = useState<IBooking[]>([]);

  // Fetch booked seats for this room
  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?date=${date}&roomId=${room?.id}`);
      const bookings: IBooking[] = await res.json();
      const booked = bookings.map((b) => {
        if (b?.userId == session?.user?.id) {
          setexistingBooking((b?._id as string) || "");
        }
        return b;
      });
      setBookedSeats(booked);
    } catch {
      // Optionally handle error
    }
  };

  useEffect(() => {
    if (room.id && date) fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, date, session?.user?.id]);

  async function deleteBooking(id: string | null) {
    if (!id) {
      alert("invalid Id");
      return;
    }
    return await fetch(`/api/bookings/${id}`, {
      method: "DELETE",
    });
  }

  const handleBooking = async (seat = selectedSeat) => {
    if (!seat) return;
    setIsPending(true);
    try {
      if (existingBooking) {
        await deleteBooking(existingBooking);
      }

      // 3. Add new booking
      const res = await fetch(`/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          seatNumber: seat,
          userId: session?.user?.id,
          userName: session?.user?.name,
          avator: session?.user?.image,
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
  console.log("existingBookings", existingBooking, bookedSeats);
  // ...existing code...

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex items-center">
        <div>
          <CardTitle className="font-headline">Select a Seat</CardTitle>
          <CardDescription>
            Click on an available seat to make a reservation.
          </CardDescription>
        </div>
        <div className="flex-1"></div>
        <div>
          <Button
            disabled={!selectedSeat || isPending}
            onClick={() => handleBooking(selectedSeat)}
          >
            {isPending ? "Booking..." : `Book Seat ${selectedSeat || ""}`}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-4 border-2 border-dashed rounded-lg bg-muted/20">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-8 items-center justify-center">
            {Array.from(
              { length: room.totalCapacity || 0 },
              (_, i) => i + 1
            ).map((seatNumber) => {
              const isBooked = bookedSeats.find(
                (list) => list?.seatNumber == seatNumber
              );

              console.log("rj-isBooked", isBooked);
              const isSelected = selectedSeat === seatNumber;
              if (isBooked) {
                return (
                  <div
                    key={seatNumber as number}
                    className={cn(
                      "h-16 w-16 overflow-hidden border bg-green-200 text-green-900 flex items-center justify-center rounded-lg relative cursor-pointer",
                      isBooked?._id == existingBooking &&
                        "bg-blue-200 text-blue-900"
                    )}
                    {...(isBooked?._id == existingBooking
                      ? {
                          onDoubleClick: async () => {
                            await deleteBooking(existingBooking);
                            await fetchBookings();
                          },
                        }
                      : {})}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar color="bg-blue-200">
                          <AvatarImage
                            src={isBooked.avator}
                            alt={isBooked.userName}
                          />
                          <AvatarFallback className="rounded-lg">
                            <H5>{getNameFistKey(isBooked?.userName)}</H5>
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isBooked?.userName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              }
              return (
                <Button
                  key={seatNumber as number}
                  variant={
                    isSelected ? "default" : isBooked ? "secondary" : "outline"
                  }
                  size="icon"
                  className={cn(
                    "h-16 w-16 text-sm font-semibold transition-all duration-200",
                    isSelected &&
                      "ring-2 ring-offset-2 ring-primary scale-110 shadow-lg"
                  )}
                  disabled={isBooked ? true : false}
                  onClick={() => setSelectedSeat(seatNumber as number)}
                  onDoubleClick={() => {
                    handleBooking(seatNumber as number);
                  }}
                  aria-label={
                    isBooked
                      ? `Seat ${seatNumber} is booked`
                      : `Select seat ${seatNumber}`
                  }
                >
                  <H4>{seatNumber as ReactNode}</H4>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
