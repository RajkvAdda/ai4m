"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { User } from "next-auth";
import {
  cn,
  getDateFormat,
  getMonthDays,
  getMonthFormat,
  getPreviousAndNextMonths,
  getTodayDate,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function SeatBookingPage() {
  const { toast } = useToast();

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const [searchUser, setSearchUser] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [group, setGroup] = useState<string>("All");
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
      const [seatsResponse, usersResponse, bookingsResponse] =
        await Promise.all([
          fetch("/api/seats"),
          fetch("/api/users?role=SPP,GST,Intern"),
          fetch(`/api/seatbookings?startDate=${getTodayDate()}`),
        ]);

      const [seatsData, usersData, bookingsData] = await Promise.all([
        seatsResponse.json(),
        usersResponse.json(),
        bookingsResponse.json(),
      ]);

      const totalSeats =
        seatsData?.reduce(
          (sum: number, seat: any) => sum + seat.units * seat.seatsPerUnit,
          0,
        ) || 0;

      setUsers(usersData?.data || usersData || []);
      const totalUsers = usersData?.data?.length || usersData?.length || 0;
      const bookedToday =
        bookingsData?.data?.length || bookingsData?.length || 0;

      console.log({ totalSeats, bookedToday, totalUsers, bookingsData });
      setStats({ totalSeats, bookedToday, totalUsers });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCellClick = useCallback(
    async (userId: string, date: string) => {
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // If already processing, ignore the click
      if (isProcessingRef.current) {
        toast({
          title: "Please wait...",
          description: "Processing previous request",
          variant: "default",
        });
        return;
      }

      // Set up debounce timer (300ms delay)
      debounceTimerRef.current = setTimeout(async () => {
        isProcessingRef.current = true;

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
            toast({
              title: "Seat booked successfully!",
              variant: "success",
            });
          } else {
            toast({
              title: "Booking cancelled",
              variant: "info",
            });
          }

          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error("Toggle booking error:", error);
          const message =
            error instanceof Error ? error.message : "Failed to update booking";
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
        } finally {
          isProcessingRef.current = false;
        }
      }, 1000);
    },
    [toast],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleBookingSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    toast({
      title: "Booking updated successfully!",
      variant: "success",
    });
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    toast({
      title: "Calendar refreshed!",
      variant: "success",
    });
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
        <Card
          className={cn(
            "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
            stats?.totalSeats === 0 && "animate-pulse",
          )}
        >
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

        <Card
          className={cn(
            "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
            stats?.totalSeats === 0 && "animate-pulse",
          )}
        >
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

        <Card
          className={cn(
            "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
            stats?.totalUsers === 0 && "animate-pulse",
          )}
        >
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
              Registered members role (SPP, GST, Intern)
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
                      <div className="h-4 w-4 rounded bg-yellow-100"></div>
                      <span className="text-xs text-yellow-400">Weekend</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchUser}
                    placeholder="Search by name..."
                    className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      if (searchTerm) {
                        setSearchUser(searchTerm);
                      } else {
                        setSearchUser("");
                      }
                    }}
                  />
                </div>
                <Tabs defaultValue="All" value={group} onValueChange={setGroup}>
                  <TabsList>
                    <TabsTrigger value="All">
                      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                        {users.length}
                      </Badge>
                      All
                    </TabsTrigger>
                    <TabsTrigger value="SPP">
                      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                        {users.filter((user) => user.role === "SPP").length}
                      </Badge>
                      SPP
                    </TabsTrigger>
                    <TabsTrigger value="GST">
                      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                        {users.filter((user) => user.role === "GST").length}
                      </Badge>
                      GST
                    </TabsTrigger>
                    <TabsTrigger value="Intern">
                      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                        {users.filter((user) => user.role === "Intern").length}
                      </Badge>
                      Intern
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
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
                users={users
                  .filter(
                    (user) =>
                      (group === "All" || user.role === group) &&
                      (user.name?.toLowerCase().includes(searchUser) ||
                        !searchUser),
                  )
                  .sort((a, b) => {
                    const roleOrder = { SPP: 1, GST: 2, Intern: 3 };
                    return (
                      (roleOrder[a.role as keyof typeof roleOrder] || 999) -
                      (roleOrder[b.role as keyof typeof roleOrder] || 999)
                    );
                  })}
                onCellClick={handleCellClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configure">
          <BookingForm
            onSuccess={handleBookingSuccess}
            users={users.sort((a, b) => {
              const roleOrder = { SPP: 1, GST: 2, Intern: 3 };
              return (
                (roleOrder[a.role as keyof typeof roleOrder] || 999) -
                (roleOrder[b.role as keyof typeof roleOrder] || 999)
              );
            })}
            fromDate={fromDate}
            toDate={toDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
