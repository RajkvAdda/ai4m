"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, isToday } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader } from "lucide-react";
import { cn, getDateFormat, isSameDay } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  avator?: string;
}

interface Booking {
  _id: string;
  seatId: string;
  seatNumber: number;
  status: string;
}

interface BookingCalendarProps {
  startDate: Date;
  endDate: Date;
  refreshKey: number;
  onCellClick: (userId: string, date: string) => void;
  users: User[];
  days: any[];
}

export function BookingCalendar({
  startDate,
  endDate,
  refreshKey,
  onCellClick,
  users,
  days,
}: BookingCalendarProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const todayRef = useRef<HTMLTableCellElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");

      const response = await fetch(
        `/api/seatbookings?fromDate=${start}&toDate=${end}`,
      );

      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      setBookings(data?.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, refreshKey]);

  useEffect(() => {
    // Scroll to today's date after data is loaded
    if (!loading && todayRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const todayElement = todayRef.current;
      const containerWidth = container.clientWidth;
      const todayLeft = todayElement.offsetLeft;
      const todayWidth = todayElement.offsetWidth;

      // Center today's date in the view
      container.scrollLeft = todayLeft - containerWidth / 2 + todayWidth / 2;
    }
  }, [loading, users]);

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEE");
  };

  const getDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "d MMM");
  };

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Calculate user-wise booking totals
  const getUserBookingTotal = (userId: string) => {
    return bookings.filter((b) => b.userId === userId).length;
  };

  // Calculate day-wise booking totals
  const getDayBookingTotal = (date: string) => {
    return bookings.filter((b) =>
      isSameDay(new Date(b.startDate), new Date(date)),
    ).length;
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
                <th className="sticky left-0 z-20 bg-white border-r-2 border-primary/20 px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      Team Members
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {users.length}
                    </Badge>
                  </div>
                </th>
                {days.map((date) => {
                  const isTodayDate = isToday(new Date(date));
                  return (
                    <th
                      key={date}
                      ref={isTodayDate ? todayRef : null}
                      className={cn(
                        "px-4 py-3 text-center border-l border-gray-200 min-w-[120px]",
                        isWeekend(date) && "bg-yellow-50",
                        isTodayDate && "bg-green-50 relative",
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "text-md font-bold",
                            isWeekend(date)
                              ? "text-yellow-400"
                              : "text-primary",
                            isTodayDate && "font-bold text-primary",
                          )}
                        >
                          {getDayName(date)}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isWeekend(date)
                              ? "text-yellow-400"
                              : "text-gray-600",
                            isTodayDate && "font-bold text-primary",
                          )}
                        >
                          {getDateDisplay(date)}
                        </span>
                        {isTodayDate && (
                          <Badge variant="default" className="justify-center">
                            Today
                          </Badge>
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="sticky right-0 z-20 bg-white border-l-2 border-primary/20 px-4 py-3 text-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-primary">
                      Total
                    </span>
                    <span className="text-xs text-gray-600">Bookings</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {users?.length > 0 ? null : (
                <tr key="loading" className="animate-pulse">
                  <td colSpan={days.length + 1} className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <Loader className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  </td>
                </tr>
              )}
              {users.map((user, userIndex) => (
                <tr
                  key={user.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    loading ? "animate-pulse" : "",
                    userIndex % 2 === 0 ? "bg-white" : "bg-gray-100",
                  )}
                >
                  <td className="sticky left-0 z-10 bg-inherit border-r-2 border-primary/20 px-2 py-0.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarImage src={user.avator} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  {days.map((date) => {
                    const booking = bookings.find(
                      (b) =>
                        b.userId === user.id &&
                        isSameDay(new Date(b.startDate), new Date(date)),
                    );

                    const isBooked = !!booking;
                    const weekend = isWeekend(date);
                    const isTodayDate = isToday(new Date(date));

                    return (
                      <td
                        key={`${user.id}-${date}`}
                        className={cn(
                          "border-l border-gray-200 px-1 py-0.5 cursor-pointer transition-all",
                          weekend && "bg-yellow-50",
                          isTodayDate && "bg-green-50",
                          loading && "pointer-events-none opacity-75",
                        )}
                        onClick={() =>
                          !weekend &&
                          !loading &&
                          onCellClick(user.id, getDateFormat(date))
                        }
                      >
                        <div
                          className={cn(
                            "h-9 rounded-lg flex items-center justify-center transition-all duration-200",
                            isBooked &&
                              !weekend &&
                              "bg-gradient-to-br from-green-300 to-green-400 shadow-md hover:shadow-lg hover:scale-105",
                            !isBooked &&
                              !weekend &&
                              "bg-gray-200 hover:bg-gray-300 hover:scale-105",
                            weekend &&
                              "bg-gray-300 cursor-not-allowed opacity-50",
                            loading && "cursor-wait",
                          )}
                        >
                          {isBooked && !weekend && (
                            <div className="flex flex-col items-center">
                              <span className="text-white text-xs font-semibold">
                                Seat {booking.seatNumber}
                              </span>
                            </div>
                          )}
                          {weekend && (
                            <span className="text-xs text-gray-500 font-medium">
                              Weekend
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 bg-inherit border-l-2 border-primary/20 px-4 py-3">
                    <div className="flex items-center justify-center">
                      <Badge
                        variant="default"
                        className="text-sm font-bold bg-primary"
                      >
                        {getUserBookingTotal(user.id)}
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-t-2 border-primary/20 sticky bottom-0 z-20">
                <td className="sticky left-0 z-30 bg-gray-100 px-4 py-3 font-semibold text-primary text-sm">
                  Daily Total
                </td>
                {days.map((date) => {
                  const weekend = isWeekend(date);
                  const isTodayDate = isToday(new Date(date));
                  const dayTotal = getDayBookingTotal(date);

                  return (
                    <td
                      key={`total-${date}`}
                      className={cn(
                        "border-l border-gray-200 px-4 py-3 text-center ",
                        weekend && "bg-yellow-50",
                        isTodayDate && "bg-green-50",
                      )}
                    >
                      <Badge
                        variant={dayTotal > 0 ? "default" : "secondary"}
                        className="text-sm font-bold"
                      >
                        {dayTotal}
                      </Badge>
                    </td>
                  );
                })}
                <td className="sticky right-0 z-30 bg-gray-100 border-l-2 border-primary/20 px-4 py-3 text-center">
                  <Badge
                    variant="default"
                    className="text-sm font-bold bg-primary"
                  >
                    {bookings.length}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
