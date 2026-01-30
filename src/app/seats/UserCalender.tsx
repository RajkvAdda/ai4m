import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cn,
  getDateFormat,
  getMonthDays,
  getMonthFormat,
  getPreviousAndNextMonths,
} from "@/lib/utils";
import { ISeat, ISeatBooking } from "@/types/seat";

import React, { useEffect } from "react";

export default function UserCalender({
  userId,
  seats,
}: {
  userId: string;
  seats: ISeat[];
}) {
  const [bookings, setBookings] = React.useState<ISeatBooking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const months = getPreviousAndNextMonths();
  const [selectedMonth, setSelectedMonth] = React.useState(
    getMonthFormat(months[1]),
  );

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
          `/api/seatbookings?userId=${userId}&fromDate=${fromDate}&toDate=${toDate}`,
        );
        const data = await res.json();

        setBookings(data?.data || []);
      } catch (_err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    if (fromDate && toDate && userId) fetchBookings();
  }, [fromDate, toDate, userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="text-base sm:text-lg">
            User Calendar for the month{" "}
          </div>
          <div className="overflow-x-auto w-full sm:w-auto">
            <Tabs value={selectedMonth} onValueChange={setSelectedMonth}>
              <TabsList className="w-max sm:w-auto">
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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid auto-rows-min gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 text-[10px] sm:text-xs md:text-sm">
          {days.map((day, i) => {
            const dayBooking = bookings?.find(
              (b) => b.startDate === getDateFormat(day),
            );
            const seat = seats?.find((r) => r._id === dayBooking?.seatId);
            if (dayBooking && seat) {
              return (
                <div
                  key={i}
                  className="bg-emerald-50 text-emerald-500 border border-emerald-400 aspect-square rounded-lg sm:rounded-xl p-1 sm:p-2 text-shadow-lg flex items-center text-center justify-center"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="whitespace-nowrap font-bold text-[10px] sm:text-xs">
                      {getDateFormat(day, "EEE d")}
                    </div>
                    <div className="text-[8px] sm:text-[10px] leading-tight break-words">
                      {`${seat.name} #${dayBooking.seatNumber}`}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={i}
                className={cn(
                  "bg-muted/30 aspect-square rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-shadow-lg flex items-center text-center justify-center text-[10px] sm:text-xs md:text-sm",
                  ["Sun", "Sat"].includes(getDateFormat(day, "EEE"))
                    ? "bg-yellow-50 border-yellow-400 border text-yellow-700"
                    : "border",
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
