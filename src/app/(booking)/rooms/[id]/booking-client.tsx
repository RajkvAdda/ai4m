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
import {
  cn,
  getDateFormat,
  getIsBeforeDate,
  getNameFistKey,
  getTodayOrNextDate,
} from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Pencil, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Flex } from "@/components/ui/flex";

export default function BookingClient({
  room,
  date,
}: {
  room: IRoom;
  date: string;
}) {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState(date);

  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [existingBooking, setexistingBooking] = useState<string | null>(null);
  // Booked seats state (should be fetched from API)
  const [bookedSeats, setBookedSeats] = useState<IBooking[]>([]);

  // Fetch booked seats for this room
  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}`);
      const bookings: IBooking[] = await res.json();
      const booked: IBooking[] = [];
      bookings.forEach((b) => {
        if (b?.userId == session?.user?.id) {
          setexistingBooking((b?._id as string) || "");
        }
        if (b?.roomId == room?.id) booked.push(b);
      });
      setBookedSeats(booked);
    } catch {
      // Optionally handle error
    }
  };

  useEffect(() => {
    if (room.id && selectedDate) fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, selectedDate, session?.user?.id]);

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
      if (!getIsBeforeDate(getTodayOrNextDate(), selectedDate)) {
        toast({
          title: "Invalid Date",
          description: "You can only book for today or future dates.",
          variant: "destructive",
        });
        setIsPending(false);
        return;
      }
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
          startDate: selectedDate,
          endDate: selectedDate,
          status: "booked",
        }),
      });
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
          description: "Booking failed.",
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
      <CardHeader className="flex items-center flex-wrap ">
        <div>
          <CardTitle className="font-headline">
            Select a Seat for{" "}
            <b>{`(${getDateFormat(selectedDate, "EEE dd MMM, yyyy")})`}</b>
          </CardTitle>
          <CardDescription>
            Click on an available seat to make a reservation.
          </CardDescription>
        </div>
        <div className="flex-1"></div>
        <Flex className="flex-wrap">
          <Flex className="flex-wrap gap-0">
            <Label
              htmlFor="booking-date"
              className="mb-1 font-medium whitespace-nowrap"
            >
              Date for booking
            </Label>
            <Input
              id="booking-date"
              type="date"
              className="border rounded px-3 py-2"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getTodayOrNextDate()}
            />
          </Flex>
          <Button
            disabled={!selectedSeat || isPending}
            onClick={() => handleBooking(selectedSeat)}
          >
            {isPending ? "Booking..." : `Book Seat ${selectedSeat || ""}`}
          </Button>
        </Flex>
      </CardHeader>
      <CardContent>
        <div className="p-4 border-2 border-dashed rounded-lg bg-muted/20">
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 md:gap-8 gap-4 items-center justify-center">
            {Array.from(
              { length: room.totalCapacity || 0 },
              (_, i) => i + 1
            ).map((seatNumber) => {
              const isBooked =
                bookedSeats.find((list) => list?.seatNumber == seatNumber) ||
                null;

              console.log("rj-isBooked", isBooked);
              const isSelected = selectedSeat === seatNumber;
              if (isBooked?._id == existingBooking && existingBooking) {
                return (
                  <div
                    key={seatNumber as number}
                    className={cn(
                      "h-16 w-16 overflow-hidden bg-blue-200 text-blue-900 border flex items-center justify-center rounded-lg relative cursor-pointer"
                    )}
                    onDoubleClick={async () => {
                      await deleteBooking(existingBooking);
                      await fetchBookings();
                    }}
                  >
                    <ContextMenu>
                      <ContextMenuTrigger>
                        <Avatar color="bg-blue-200">
                          <AvatarImage
                            src={isBooked?.avator}
                            alt={isBooked?.userName}
                          />
                          <AvatarFallback className="rounded-lg">
                            <H5>{getNameFistKey(isBooked?.userName)}</H5>
                          </AvatarFallback>
                        </Avatar>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onClick={async () => {
                            await deleteBooking(existingBooking);
                            await fetchBookings();
                          }}
                        >
                          <Trash size={14} className="mr-2" />
                          Delete
                        </ContextMenuItem>
                        <ContextMenuItem>
                          <Pencil size={14} className="mr-2" />
                          Remarks
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  </div>
                );
              }
              if (isBooked?._id) {
                return (
                  <div
                    key={seatNumber as number}
                    className={cn(
                      "h-16 w-16 aspect-square overflow-hidden border bg-green-200 text-green-900 flex items-center justify-center rounded-lg relative cursor-pointer"
                    )}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar color="bg-blue-200">
                          <AvatarImage
                            src={isBooked?.avator}
                            alt={isBooked?.userName}
                          />
                          <AvatarFallback className="rounded-lg">
                            <H5>{getNameFistKey(isBooked?.userName)}</H5>
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-white min-w-5 h-5 flex justify-center items-center px-1 rounded-lg font-mono tabular-nums"
                        >
                          {seatNumber as ReactNode}
                        </Badge>
                        <p>{isBooked?.userName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              }
              return (
                <Button
                  key={seatNumber as number}
                  variant={isSelected ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-full w-full aspect-square text-sm font-semibold transition-all duration-200",
                    isSelected &&
                      "ring-2 ring-offset-2 ring-primary scale-110 shadow-lg"
                  )}
                  onClick={() => setSelectedSeat(seatNumber as number)}
                  onDoubleClick={() => {
                    handleBooking(seatNumber as number);
                  }}
                  aria-label={`Select seat ${seatNumber}`}
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
