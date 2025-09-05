import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDateFormat,
  getMonthDays,
  getMonthFormat,
  getPreviousAndNextMonths,
} from "@/lib/utils";
import { IBooking } from "@/modals/Booking";
import { IRoom } from "@/modals/Room";
import React, { useEffect } from "react";

export default function UserCalender({
  userId,
  rooms,
}: {
  userId: string;
  rooms: IRoom[];
}) {
  const [bookings, setBookings] = React.useState<IBooking[]>([]);
  const months = getPreviousAndNextMonths();
  const [selectedMonth, setSelectedMonth] = React.useState(
    getMonthFormat(months[1])
  );

  const monthNumber = months.findIndex(
    (month) => getMonthFormat(month) === selectedMonth
  );

  const days = getMonthDays(months[monthNumber].getMonth());
  const fromDate = getDateFormat(days[0]);
  const toDate = getDateFormat(days[days.length - 1]);

  useEffect(() => {
    const fetchBookings = async () => {
      setBookings([]);
      try {
        const res = await fetch(
          `/api/bookings?userId=${userId}&fromDate=${fromDate}&toDate=${toDate}`
        );
        const data = await res.json();
        setBookings(data);
      } catch (_err) {
        // Optionally handle error
      }
    };
    fetchBookings();
  }, [fromDate, toDate, userId]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div>User Calendar for the month </div>
          <Tabs value={selectedMonth} onValueChange={setSelectedMonth}>
            <TabsList>
              {months.map((month) => (
                <TabsTrigger
                  key={month.getTime()}
                  value={getMonthFormat(month)}
                >
                  {getMonthFormat(month)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid auto-rows-min gap-4 sm:grid-cols-3 md:grid-cols-10">
          {days.map((day, i) => {
            const dayBooking = bookings?.find(
              (b) => b.startDate === getDateFormat(day)
            );
            const room = rooms?.find((r) => r.id === dayBooking?.roomId);
            if (dayBooking && room) {
              return (
                <div
                  key={i}
                  className="bg-muted/50 aspect-square rounded-xl p-2 text-shadow-lg flex items-center justify-center"
                >
                  {room.name} Seat({dayBooking.seatNumber})
                </div>
              );
            }
            return (
              <div
                key={i}
                className="bg-muted/50 aspect-square rounded-xl p-4  flex items-center justify-center text-2xl"
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
