import { Card, CardContent } from "@/components/ui/card";
import {
  cn,
  getDateFormat,
  getMonthDays,
  getMonthFormat,
  getNameFistKey,
} from "@/lib/utils";

import React, { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IUser } from "@/types/user";
import { ISeat, ISeatBooking } from "@/types/seat";
import { Badge } from "@/components/ui/badge";

export default function SeatDashboard({
  seats,
  months,
  selectedMonth,
  users,
}: {
  seats: ISeat[];
  months: Date[];
  selectedMonth: string;
  users: IUser[];
}) {
  const [bookings, setBookings] = React.useState<ISeatBooking[]>([]);
  const [loading, setLoading] = React.useState(true);

  const monthNumber = months.findIndex(
    (month) => getMonthFormat(month) === selectedMonth,
  );

  const days = getMonthDays(months[monthNumber].getMonth());
  const fromDate = getDateFormat(days[0]);
  const toDate = getDateFormat(days[days.length - 1]);

  useEffect(() => {
    const fetchBookings = async () => {
      setBookings([]);
      setLoading(true);
      try {
        const res = await fetch(
          `/api/seatbookings?fromDate=${fromDate}&toDate=${toDate}`,
        );
        if (!res.ok) return;

        const data = await res.json();
        setBookings(data?.data);
      } catch (_err) {
      } finally {
        setLoading(false);
      }
    };
    if (fromDate && toDate) fetchBookings();
  }, [fromDate, toDate]);

  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <table className="w-full">
            <tbody>
              {days.map((day, i) => {
                const dayBookings = bookings?.filter(
                  (b) => b.startDate === getDateFormat(day),
                );
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-emerald-200",
                      ["Sun", "Sat"].includes(getDateFormat(day, "EEE"))
                        ? "bg-yellow-50/50"
                        : "",
                    )}
                  >
                    <td
                      style={{ minWidth: "80px", width: "80px" }}
                      className="p-3 text-center font-medium text-sm border-r border-emerald-200"
                    >
                      {getDateFormat(day, "EEE, d")}{" "}
                      <Badge className="mt-1">{dayBookings.length}</Badge>
                    </td>
                    <td className="p-2">
                      {dayBookings.length > 0 ? (
                        <BookingDetails
                          bookings={dayBookings}
                          seats={seats}
                          users={users}
                          loading={loading}
                        />
                      ) : (
                        <div
                          className={cn(
                            "text-sm text-muted-foreground py-1",
                            loading ? "animate-pulse" : "",
                          )}
                        >
                          No bookings
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDetails({
  bookings,
  seats,
  users,
  loading,
}: {
  bookings: ISeatBooking[];
  seats: ISeat[];
  users: IUser[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = React.useState(false);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || isPaused) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= scrollElement.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollElement.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, bookings]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Duplicate bookings for seamless infinite scroll */}
      {[...bookings, ...(bookings?.length > 8 ? bookings : [])].map(
        (booking, index) => {
          const seat = seats.find((r) => r.id === booking.seatId);
          const user = users.find((u) => u.id === booking.userId);
          return (
            <div
              key={`${booking.id}-${index}`}
              className="flex items-center gap-2 bg-emerald-50 rounded-lg p-2 min-w-fit border border-emerald-200"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avator} alt={user?.name} />
                <AvatarFallback
                  className={cn(
                    "bg-emerald-100 text-emerald-800 text-xs",
                    user?.role == "GST" && "bg-blue-100 text-blue-800",
                    user?.role == "Intern" && "bg-orange-100 text-orange-600",
                  )}
                >
                  {getNameFistKey(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-xs">
                <span className="font-medium text-gray-900">{user?.name}</span>
                <span className="text-gray-600">{seat?.name}</span>
                <span className="text-gray-500">
                  Seat: {booking.seatNumber}
                </span>
              </div>
            </div>
          );
        },
      )}
    </div>
  );
}
