"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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
}

export function BookingCalendar({
  startDate,
  endDate,
  refreshKey,
  onCellClick,
}: BookingCalendarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [bookingMap, setBookingMap] = useState<
    Record<string, Record<string, Booking | null>>
  >({});
  const [loading, setLoading] = useState(true);

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
      setUsers(data.users);
      setDates(data.dates);
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

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-collapse">
            <thead>
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
                {dates.map((date) => (
                  <th
                    key={date}
                    className={cn(
                      "px-4 py-3 text-center border-l border-gray-200 min-w-[120px]",
                      isWeekend(date) && "bg-gray-50",
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isWeekend(date) ? "text-gray-400" : "text-primary",
                        )}
                      >
                        {getDayName(date)}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          isWeekend(date) ? "text-gray-400" : "text-gray-600",
                        )}
                      >
                        {getDateDisplay(date)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, userIndex) => (
                <tr
                  key={user.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    userIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50",
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
                  {dates.map((date) => {
                    const booking = bookingMap[user.id]?.[date];
                    const isBooked = !!booking;
                    const weekend = isWeekend(date);

                    return (
                      <td
                        key={`${user.id}-${date}`}
                        className={cn(
                          "border-l border-gray-200 p-2 cursor-pointer transition-all",
                          weekend && "bg-gray-100",
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
