"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, isToday } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [bookingMap, setBookingMap] = useState<
    Record<string, Record<string, Booking | null>>
  >({});
  const [loading, setLoading] = useState(true);
  const todayRef = useRef<HTMLTableCellElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");

      const response = await fetch(
        `/api/admin/bookings-calendar?startDate=${start}&endDate=${end}`,
      );

      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      setBookingMap(data.bookingMap);
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

  return (
    <Card className="overflow-hidden">
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
                        isWeekend(date) && "bg-gray-50",
                        isTodayDate &&
                          "bg-primary/20 border-2 border-primary relative",
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isWeekend(date) ? "text-gray-400" : "text-primary",
                            isTodayDate && "font-bold text-primary",
                          )}
                        >
                          {getDayName(date)}
                        </span>
                        <span
                          className={cn(
                            "text-xs",
                            isWeekend(date) ? "text-gray-400" : "text-gray-600",
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
              </tr>
            </thead>
            <tbody>
              {!users?.length > 0 && (
                <tr key="loading" className="animate-pulse">
                  <td colSpan={10} className="px-4 py-3">
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
                  <td className="sticky left-0 z-10 bg-inherit border-r-2 border-primary/20 px-4 py-3">
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
                    const booking = bookingMap[user.id]?.[date];
                    const isBooked = !!booking;
                    const weekend = isWeekend(date);
                    const isTodayDate = isToday(new Date(date));

                    return (
                      <td
                        key={`${user.id}-${date}`}
                        className={cn(
                          "border-l border-gray-200 p-2 cursor-pointer transition-all",
                          weekend && "bg-gray-100",
                          isTodayDate &&
                            "bg-primary/10 border-2 border-primary",
                        )}
                        onClick={() => !weekend && onCellClick(user.id, date)}
                      >
                        <div
                          className={cn(
                            "h-12 rounded-lg flex items-center justify-center transition-all duration-200",
                            isBooked &&
                              !weekend &&
                              "bg-gradient-to-br from-green-400 to-green-500 shadow-md hover:shadow-lg hover:scale-105",
                            !isBooked &&
                              !weekend &&
                              "bg-gray-200 hover:bg-gray-300 hover:scale-105",
                            weekend &&
                              "bg-gray-300 cursor-not-allowed opacity-50",
                          )}
                        >
                          {isBooked && !weekend && (
                            <div className="flex flex-col items-center">
                              <span className="text-white text-xs font-semibold">
                                Seat {booking.seatNumber}
                              </span>
                              <Badge
                                variant="secondary"
                                className="mt-1 text-[10px] bg-white/20 text-white border-white/30"
                              >
                                Booked
                              </Badge>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
