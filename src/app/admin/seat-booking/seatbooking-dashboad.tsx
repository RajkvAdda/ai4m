"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
import { ISeat } from "@/types/seat";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_ORDER: Record<string, number> = { SPP: 1, GST: 2, Intern: 3 };

const DEBOUNCE_DELAY_MS = 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function compareByRole(a: User, b: User): number {
  const roleDiff =
    (ROLE_ORDER[a.role as string] ?? 999) -
    (ROLE_ORDER[b.role as string] ?? 999);
  if (roleDiff !== 0) return roleDiff;
  return (a.name ?? "").localeCompare(b.name ?? "");
}

// ─── StatCard sub-component ───────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  colorScheme: "blue" | "green" | "purple";
  isLoading: boolean;
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  colorScheme,
  isLoading,
}: StatCardProps) {
  const colors = {
    blue: {
      card: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
      title: "text-blue-700",
      value: "text-blue-900",
      sub: "text-blue-600",
    },
    green: {
      card: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
      title: "text-green-700",
      value: "text-green-900",
      sub: "text-green-600",
    },
    purple: {
      card: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
      title: "text-purple-700",
      value: "text-purple-900",
      sub: "text-purple-600",
    },
  }[colorScheme];

  return (
    <Card className={cn(colors.card, isLoading && "animate-pulse")}>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle
          className={cn(
            "text-xs sm:text-sm font-medium flex items-center gap-2",
            colors.title,
          )}
        >
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl sm:text-3xl font-bold", colors.value)}>
          {value}
        </div>
        <p className={cn("text-xs mt-1", colors.sub)}>{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ─── LegendItem sub-component ─────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-4 w-4 rounded", color)} />
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

// ─── Dashboard stats type ─────────────────────────────────────────────────────

interface DashboardStats {
  totalSeats: number;
  bookedToday: number;
  totalUsers: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SeatBookingDashboard() {
  const { toast } = useToast();

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>("All");

  const months = getPreviousAndNextMonths();
  const [selectedMonth, setSelectedMonth] = useState(getMonthFormat(months[1]));

  const [stats, setStats] = useState<DashboardStats>({
    totalSeats: 0,
    bookedToday: 0,
    totalUsers: 0,
  });

  // Derive month-related values from selectedMonth
  const { days, fromDate, toDate } = useMemo(() => {
    const monthIndex = months.findIndex(
      (month) => getMonthFormat(month) === selectedMonth,
    );
    const monthDays = getMonthDays(months[monthIndex].getMonth());
    return {
      days: monthDays,
      fromDate: getDateFormat(monthDays[0]),
      toDate: getDateFormat(monthDays[monthDays.length - 1]),
    };
  }, [selectedMonth, months]);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const [seatsRes, usersRes, bookingsRes] = await Promise.all([
        fetch("/api/seats"),
        fetch("/api/users?role=SPP,GST,Intern"),
        fetch(`/api/seatbookings?startDate=${getTodayDate()}`),
      ]);

      const [seatsData, usersData, bookingsData] = await Promise.all([
        seatsRes.json(),
        usersRes.json(),
        bookingsRes.json(),
      ]);

      const totalSeats: number =
        (seatsData as ISeat[])?.reduce(
          (sum, seat) => sum + seat.units * seat.seatsPerUnit,
          0,
        ) ?? 0;

      const fetchedUsers: User[] = usersData?.data ?? usersData ?? [];
      const bookedToday: number =
        bookingsData?.data?.length ?? bookingsData?.length ?? 0;

      setUsers(fetchedUsers);
      setStats({ totalSeats, bookedToday, totalUsers: fetchedUsers.length });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // ── Event handlers ───────────────────────────────────────────────────────────

  const handleCellClick = useCallback(
    async (userId: string, date: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      if (isProcessingRef.current) {
        toast({
          title: "Please wait…",
          description: "Processing previous request",
          variant: "default",
        });
        return;
      }

      debounceTimerRef.current = setTimeout(async () => {
        isProcessingRef.current = true;
        try {
          const response = await fetch("/api/admin/toggle-booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              date,
              userType: "ADMIN",
              status:
                date === getTodayDate()
                  ? "ADMIN_MORE_SHOW"
                  : "ADMIN_BOOKED_SEAT",
            }),
          });

          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || "Failed to toggle booking");
          }

          const result = await response.json();
          if (result?.message) {
            toast({ title: result.message, variant: "default" });
          }

          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to update booking";
          console.error("Toggle booking error:", message);
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
        } finally {
          isProcessingRef.current = false;
        }
      }, DEBOUNCE_DELAY_MS);
    },
    [toast],
  );

  const handleBookingSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    toast({ title: "Booking updated successfully!", variant: "success" });
  }, [toast]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    toast({ title: "Calendar refreshed!", variant: "success" });
  }, [toast]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setSearchQuery(e.target.value.toLowerCase()),
    [],
  );

  // ── Derived data ─────────────────────────────────────────────────────────────

  const filteredAndSortedUsers = useMemo(
    () =>
      users
        .filter(
          (user) =>
            (activeGroup === "All" || user.role === activeGroup) &&
            (!searchQuery || user.name?.toLowerCase().includes(searchQuery)),
        )
        .sort(compareByRole),
    [users, activeGroup, searchQuery],
  );

  const usersSortedByRole = useMemo(
    () => [...users].sort(compareByRole),
    [users],
  );

  const userCountByRole = useMemo(
    () => ({
      SPP: users.filter((u) => u.role === "SPP").length,
      GST: users.filter((u) => u.role === "GST").length,
      Intern: users.filter((u) => u.role === "Intern").length,
    }),
    [users],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  const isStatsLoading = stats.totalSeats === 0;

  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <Armchair className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Seat Booking Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                Manage team seat bookings with bulk operations and calendar view
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              icon={<Armchair className="h-4 w-4" />}
              label="Total Seats"
              value={stats.totalSeats}
              subtitle="Available capacity"
              colorScheme="blue"
              isLoading={isStatsLoading}
            />
            <StatCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Booked Today"
              value={stats.bookedToday}
              subtitle={`${stats.totalSeats - stats.bookedToday} seats available`}
              colorScheme="green"
              isLoading={isStatsLoading}
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Total Users"
              value={stats.totalUsers}
              subtitle="Registered members (SPP, GST, Intern)"
              colorScheme="purple"
              isLoading={stats.totalUsers === 0}
            />
          </div>

          {/* ── Main Content ── */}
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

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader className="md:px-4 px-0.5">
                  <div className="flex justify-between items-center w-full flex-wrap md:flex-nowrap gap-3 sm:gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                        Booking Calendar
                      </CardTitle>
                      <CardDescription className="mt-1 sm:mt-2 text-sm">
                        Click on any cell to book or cancel a seat for a user
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 sm:gap-4 items-center mt-2">
                        <LegendItem
                          color="bg-gradient-to-br from-green-400 to-green-500"
                          label="Booked"
                        />
                        <LegendItem color="bg-gray-200" label="Available" />
                        <LegendItem color="bg-yellow-100" label="Weekend" />
                      </div>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="text"
                        value={searchQuery}
                        placeholder="Search by name…"
                        className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
                        onChange={handleSearchChange}
                      />
                    </div>

                    {/* Group filter */}
                    <Tabs
                      defaultValue="All"
                      value={activeGroup}
                      onValueChange={setActiveGroup}
                    >
                      <TabsList>
                        <TabsTrigger value="All">
                          <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                            {users.length}
                          </Badge>
                          All
                        </TabsTrigger>
                        {(["SPP", "GST", "Intern"] as const).map((role) => (
                          <TabsTrigger key={role} value={role}>
                            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                              {userCountByRole[role]}
                            </Badge>
                            {role}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>

                    {/* Month selector */}
                    <div className="overflow-x-auto">
                      <Tabs
                        value={selectedMonth}
                        onValueChange={setSelectedMonth}
                      >
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
                  </div>
                </CardHeader>

                <CardContent className="md:px-4 px-0.5">
                  <BookingCalendar
                    startDate={fromDate}
                    endDate={toDate}
                    days={days}
                    refreshKey={refreshKey}
                    stats={stats}
                    users={filteredAndSortedUsers}
                    onCellClick={handleCellClick}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bulk Booking Tab */}
            <TabsContent value="configure">
              <BookingForm
                onSuccess={handleBookingSuccess}
                users={usersSortedByRole}
                fromDate={fromDate}
                toDate={toDate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
