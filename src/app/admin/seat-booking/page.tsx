"use client";

import React, { useState, useEffect } from "react";
import { BookingForm } from "./booking-form";
import { BookingCalendar } from "./booking-calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Settings,
  RefreshCw,
  TrendingUp,
  Users,
  Armchair,
} from "lucide-react";
import { toast } from "sonner";
import { User } from "next-auth";
import {
  getDateFormat,
  getMonthDays,
  getMonthFormat,
  getPreviousAndNextMonths,
} from "@/lib/utils";

export default function SeatBookingPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const months = getPreviousAndNextMonths();
  const [selectedMonth, setSelectedMonth] = React.useState(
    getMonthFormat(months[1]),
  );
  const [stats, setStats] = useState({
    totalSeats: 0,
    bookedToday: 0,
    totalUsers: 0,
  });

  const monthNumber = months.findIndex(
    (month) => getMonthFormat(month) === selectedMonth,
  );

  const days = getMonthDays(months[monthNumber].getMonth());
  const fromDate = getDateFormat(days[0]);
  const toDate = getDateFormat(days[days.length - 1]);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      // Fetch seats
      const seatsResponse = await fetch("/api/seats");
      const seatsData = await seatsResponse.json();
      const totalSeats =
        seatsData?.reduce(
          (sum: number, seat: any) => sum + seat.units * seat.seatsPerUnit,
          0,
        ) || 0;

      // Fetch users
      const usersResponse = await fetch("/api/users?role=SPP,GST");

      const usersData = await usersResponse.json();
      setUsers(usersData || []);
      const totalUsers = usersData?.length || 0;

      // Fetch today's bookings
      const today = new Date().toISOString().split("T")[0];
      const bookingsResponse = await fetch(
        `/api/seatbookings?startDate=${today}&endDate=${today}`,
      );
      const bookingsData = await bookingsResponse.json();
      const bookedToday = bookingsData?.length || 0;

      setStats({ totalSeats, bookedToday, totalUsers });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCellClick = async (userId: string, date: string) => {
    try {
      const response = await fetch("/api/admin/toggle-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle booking");
      }

      const result = await response.json();

      if (result.action === "booked") {
        toast.success("Seat booked successfully!");
      } else {
        toast.info("Booking cancelled");
      }

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Toggle booking error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update booking";
      toast.error(message);
    }
  };

  const handleBookingSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Booking updated successfully!");
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast.success("Calendar refreshed!");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Armchair className="h-8 w-8 text-primary" />
            Seat Booking Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage team seat bookings with bulk operations and calendar view
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Armchair className="h-4 w-4" />
              Total Seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {stats.totalSeats}
            </div>
            <p className="text-xs text-blue-600 mt-1">Available capacity</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Booked Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {stats.bookedToday}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {stats.totalSeats - stats.bookedToday} seats available
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Registered members role (SPP, GST)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="configure">
            <Settings className="h-4 w-4 mr-2" />
            Bulk Booking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Booking Calendar
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Click on any cell to book or cancel a seat for a user
                  </CardDescription>
                  <div className="flex gap-4 items-center mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-gradient-to-br from-green-400 to-green-500"></div>
                      <span className="text-xs text-gray-600">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-gray-200"></div>
                      <span className="text-xs text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-gray-300"></div>
                      <span className="text-xs text-gray-600">Weekend</span>
                    </div>
                  </div>
                </div>
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
              </div>
            </CardHeader>
            <CardContent>
              <BookingCalendar
                startDate={fromDate}
                endDate={toDate}
                days={days}
                refreshKey={refreshKey}
                users={users}
                onCellClick={handleCellClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure">
          <BookingForm
            onSuccess={handleBookingSuccess}
            users={users}
            fromDate={fromDate}
            toDate={toDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
