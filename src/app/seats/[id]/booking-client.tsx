"use client";

import { useState, useEffect, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { ISeat, ISeatBooking } from "@/types/seat";
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
import { AlertCircleIcon, Pencil, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Flex } from "@/components/ui/flex";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IUser } from "@/types/user";

export default function BookingClient({
  seatDetails,
  date,
}: {
  seatDetails: ISeat;
  date: string;
}) {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState(date);
  const [isLoading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const [existingBooking, setexistingBooking] = useState<string | null>(null);
  const [bookedSeats, setBookedSeats] = useState<ISeatBooking[]>([]);

  // --- Start of New Code ---
  const [role, setRole] = useState<string>("");
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);
  const [isAfter5PM, setIsAfter5PM] = useState<boolean>(false);
  const [accessAllowed, setAccessAllowed] = useState<boolean>(false);

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getWeekNumber = (date: Date): number => {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor(
      (date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000),
    );
    return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session?.user?.id) {
        setIsRoleLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/users/${session.user.id}`);
        if (res.ok) {
          const userData: IUser = await res.json();
          setRole(userData.role || "");
        }
      } catch (error) {
        console.error("Failed to fetch user role", error);
      } finally {
        setIsRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [session?.user?.id]);

  useEffect(() => {
    const checkAccess = () => {
      if (!role || isRoleLoading) return;

      const today = new Date(selectedDate);
      const dayName = dayNames[today.getDay()];
      const week = getWeekNumber(today);
      const isOddWeek = week % 2 === 1;

      const allowedDays: Record<string, string[]> = {
        SPP: !isOddWeek
          ? ["Monday", "Tuesday", "Wednesday"]
          : ["Monday", "Tuesday"],
        GST: isOddWeek
          ? ["Wednesday", "Thursday", "Friday"]
          : ["Thursday", "Friday"],
        User: [...dayNames],
      };

      const hasAccess =
        allowedDays[role]?.includes(dayName) ||
        (new Date(selectedDate).toDateString() === new Date().toDateString() &&
          isAfter5PM);
      setAccessAllowed(hasAccess);
    };

    checkAccess();
  }, [selectedDate, role, isRoleLoading, isAfter5PM]);

  const week = getWeekNumber(new Date(selectedDate));
  const isOddWeek = week % 2 === 1;
  // --- End of New Code ---

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setexistingBooking(null);
      const res = await fetch(`/api/seatbookings?date=${selectedDate}`);
      const bookings: ISeatBooking[] = await res.json();
      const booked: ISeatBooking[] = [];
      bookings?.data.forEach((b) => {
        if (b?.userId == session?.user?.id) {
          setexistingBooking((b?._id as string) || "");
        }
        if (b?.seatId == seatDetails?.id) booked.push(b);
      });
      setBookedSeats(booked);
    } catch {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (seatDetails.id && selectedDate) fetchBookings();
  }, [seatDetails.id, selectedDate, session?.user?.id]);

  async function deleteBooking(id: string | null) {
    if (!id) {
      alert("invalid Id");
      return;
    }
    return await fetch(`/api/seatbookings/${id}`, {
      method: "DELETE",
    });
  }

  const handleBooking = async (seat = selectedSeat) => {
    // --- New check added here ---
    if (!accessAllowed) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to book for this date.",
        variant: "destructive",
      });
      return;
    }
    // --- End of new check ---

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
      console.log("seat.id", seat);
      const res = await fetch(`/api/seatbookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatId: seatDetails.id,
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
        await fetchBookings();
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
          <Flex className="gap-1">
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
            // --- Button is now disabled based on accessAllowed ---
            disabled={!selectedSeat || isPending || !accessAllowed}
            onClick={() => handleBooking(selectedSeat)}
          >
            {isPending ? "Booking..." : `Book Seat ${selectedSeat || ""}`}
          </Button>
        </Flex>
      </CardHeader>
      <CardContent>
        {/* --- Alert message for restricted access --- */}
        {!accessAllowed && !isRoleLoading && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              {(() => {
                const week = getWeekNumber(new Date(selectedDate));
                const isOddWeek = week % 2 === 1;
                if (role === "SPP") {
                  return `Access restricted: SPP users can only book on Monday, Tuesday${
                    !isOddWeek ? ", and Wednesday (this week)" : ""
                  }. If you need to book on other days, you can book after 7 AM.`;
                }
                if (role === "GST") {
                  return `Access restricted: GST users can only book on Thursday, Friday${
                    isOddWeek ? ", and Wednesday (this week)" : ""
                  }. If you need to book on other days, you can book after 7 AM.`;
                }
                return "Access restricted: Please log in or check your role.";
              })()}
            </AlertDescription>
          </Alert>
        )}
        <div className="p-8 border-2 border-dashed rounded-lg bg-muted/20">
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 md:gap-8 gap-4 items-center justify-center">
            {Array.from(
              { length: seatDetails.totalCapacity || 0 },
              (_, i) => i + 1,
            ).map((seatNumber) => {
              const isBooked =
                bookedSeats.find((list) => list?.seatNumber == seatNumber) ||
                null;

              const isSelected = selectedSeat === seatNumber;
              if (isBooked?._id == existingBooking && existingBooking) {
                return (
                  <div
                    key={seatNumber as number}
                    className={cn(
                      "h-full w-full aspect-square overflow-hidden bg-blue-200 text-blue-900 border flex items-center justify-center rounded-lg relative cursor-pointer",
                    )}
                    onDoubleClick={async () => {
                      if (isLoading || isPending) return;
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
                            if (isLoading || isPending) return;

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
                      "h-full w-full aspect-square overflow-hidden border bg-green-200 text-green-900 flex items-center justify-center rounded-lg relative cursor-pointer",
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
                  // --- Seat buttons are now also disabled ---
                  disabled={isLoading || isPending || !accessAllowed}
                  className={cn(
                    "h-full w-full aspect-square text-sm font-semibold transition-all duration-200",
                    isSelected &&
                      "ring-2 ring-offset-2 ring-primary scale-110 shadow-lg",
                    isLoading && "cursor-not-allowed animate-caret-blink",
                  )}
                  onClick={() => setSelectedSeat(seatNumber as number)}
                  onDoubleClick={() => {
                    if (isLoading || isPending) return;

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
      <CardFooter>
        <Alert>
          <AlertCircleIcon />
          <AlertTitle>Usase Info</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc text-sm mt-2">
              <li>You Can Double Click to Book Your Seat</li>
              <li>To Delete You Can Duble Click on Your (Booked seat)</li>
              <li>You can hover on seat and see the booking details</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  );
}
