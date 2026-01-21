import { Card, CardContent } from "@/components/ui/card";
import {
  cn,
  getDateFormat,
  getMonthDays,
  getMonthFormat,
  getNameFistKey,
} from "@/lib/utils";

import React, { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { H5 } from "@/components/ui/typography";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { IUser } from "@/types/user";
import { IRoom, IRoomBooking } from "@/types/room";

export default function RoomDashboard({
  rooms,
  months,
  selectedMonth,
  users,
}: {
  rooms: IRoom[];
  months: Date[];
  selectedMonth: string;
  users: IUser[];
}) {
  const [bookings, setBookings] = React.useState<IRoomBooking[]>([]);
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
          `/api/roombookings?fromDate=${fromDate}&toDate=${toDate}&limit=1000`,
        );
        if (!res.ok) return;
        const data = await res.json();
        setBookings(data.data || data);
      } catch (_err) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };
    if (fromDate && toDate) fetchBookings();
  }, [fromDate, toDate]);

  return (
    <Card>
      <CardContent>
        <div className="grid gap-1 sm:grid-cols-3 md:grid-cols-7 ">
          {days.map((day, i) => {
            const dayBookings = bookings?.filter(
              (b) => b.date === getDateFormat(day),
            );
            if (dayBookings.length > 0) {
              return (
                <div
                  key={i}
                  className=" border border-emerald-400 aspect-square"
                >
                  <BookingDetails
                    bookings={dayBookings}
                    rooms={rooms}
                    users={users}
                  />
                </div>
              );
            }
            return (
              <div
                key={i}
                className={cn(
                  "bg-muted/30 aspect-square text-shadow-lg flex items-center text-center justify-center text-md border-emerald-400 border",
                  ["Sun", "Sat"].includes(getDateFormat(day, "EEE"))
                    ? "bg-yellow-50 text-yellow-700"
                    : "",
                  loading ? "animate-caret-blink" : "",
                )}
              >
                {getDateFormat(day, "EEE d")}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDetails({
  bookings,
  rooms,
  users,
}: {
  bookings: IRoomBooking[];
  rooms: IRoom[];
  users: IUser[];
}) {
  return (
    <div className="grid grid-cols-5 gap-1 p-1">
      {bookings.map((booking, index) => {
        const room = rooms.find((r) => r._id === booking.roomId);
        const user = users.find((u) => u.id === booking.userId);
        return (
          <div key={index}>
            <HoverCard>
              <HoverCardTrigger>
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage
                    className="rounded-none"
                    src={user?.avator}
                    alt={user?.name}
                  />
                  <AvatarFallback className="rounded-none bg-emerald-100 text-emerald-800 text-xs">
                    <H5>{getNameFistKey(user?.name)}</H5>
                  </AvatarFallback>
                </Avatar>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="grid grid-cols-[80px_auto] gap-2 ">
                  <div>
                    <Avatar className="w-full h-full rounded-lg">
                      <AvatarImage
                        className="rounded-lg"
                        src={user?.avator}
                        alt={user?.name}
                      />
                      <AvatarFallback className="rounded-lg p-4 px-8 bg-emerald-100 text-emerald-800 text-xs">
                        <H5>{getNameFistKey(user?.name)}</H5>
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="space-y-1">
                    <div className="bg-emerald-50 p-0.5 pl-2 ">
                      {user?.name}
                    </div>
                    <div className="bg-emerald-50 p-0.5 pl-2 ">
                      {room?.name}
                    </div>
                    <div className="bg-emerald-50 p-0.5 pl-2 ">
                      {booking.startTime} - {booking.endTime}
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        );
      })}
    </div>
  );
}
