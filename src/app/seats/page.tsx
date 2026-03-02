"use client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { BackButton, Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  ArrowRight,
  Rows,
  TableRowsSplit,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ISeat, SeatType, ISeatBooking } from "@/types/seat";
import {
  getTodayOrNextDate,
  getMonthDays,
  getMonthFormat,
  getPreviousAndNextMonths,
  DAY_NAMES,
  checkSeatAccessAllowed,
} from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserCalender from "./UserCalender";
import UserAvator from "@/components/user-avator";
import { useSession } from "next-auth/react";
import { IUser } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useMemo, useRef } from "react";
import { Flex } from "@/components/ui/flex";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Badge } from "@/components/ui/badge";
import { BookingCalendar } from "../admin/seat-booking/booking-calendar";
import UserActivity from "../admin/(seats)/user-activity";

const seatIcons: Record<SeatType, React.ReactNode> = {
  table: <TableRowsSplit className="h-6 w-6" />,
  row: <Rows className="h-6 w-6" />,
  free_area: <Users className="h-6 w-6" />,
};

const seatDescriptions: Record<SeatType, string> = {
  table: "Group tables for collaboration",
  row: "Individual row-style seating",
  free_area: "Open area for flexible work",
};

function AccessRestrictedAlert({
  role,
  dayName,
}: {
  role: string;
  dayName: string;
}) {
  let message = "Access restricted: Please check your role.";
  if (role === "SPP") {
    message = `Access restricted: SPP users may only book on weekdays (Mon–Fri). Today is ${dayName}.`;
  } else if (role === "GST") {
    message = `Access restricted: GST users may only book on weekdays (Mon–Fri). Today is ${dayName}.`;
  } else if (role === "Intern") {
    message = `Access restricted: Intern users may only book on weekdays (Mon–Fri). Today is ${dayName}.`;
  }
  return (
    <Alert className="mb-8 border-yellow-500 text-yellow-500">{message}</Alert>
  );
}

function SeatCard({
  seat,
  selectedDate,
  bookingCount,
  isAccessAllowed,
}: {
  seat: ISeat;
  selectedDate: string;
  bookingCount: number;
  isAccessAllowed: boolean;
}) {
  const totalCapacity = seat.seatsPerUnit || 0;
  const availableSeats = totalCapacity - bookingCount;
  const progressValue =
    totalCapacity > 0 ? (availableSeats / totalCapacity) * 100 : 0;

  return (
    <Card className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-xl sm:text-2xl">
            {seat.name}
          </CardTitle>
          <div className="p-2 opacity-30 rounded-lg">
            {seatIcons[seat.type as SeatType] || ""}
          </div>
        </div>
        <CardDescription>
          {seat.description || seatDescriptions[seat.type]}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <p className="text-sm font-medium text-muted-foreground">
              Availability
            </p>
            <p className="text-lg font-semibold">
              {availableSeats}
              <span className="text-sm font-normal text-muted-foreground">
                /{totalCapacity} Seats
              </span>
            </p>
          </div>
          <Progress
            value={progressValue}
            aria-label={`${availableSeats} of ${totalCapacity} seats available`}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          className="w-full"
          variant="default"
          disabled={!isAccessAllowed}
        >
          <Link
            href={
              selectedDate && isAccessAllowed
                ? `/seats/${seat._id}?date=${selectedDate}`
                : "#"
            }
          >
            View & Book <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Seats() {
  const [seats, setSeats] = useState<ISeat[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayOrNextDate());
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<ISeatBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [role, setRole] = useState<string>("");
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState<string>("");
  const [group, setGroup] = useState<string>("All");
  const [users, setUsers] = useState<IUser[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const months = getPreviousAndNextMonths();
  const [selectedMonth, setSelectedMonth] = useState(getMonthFormat(months[1]));
  const { toast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const dayName = DAY_NAMES[new Date(selectedDate).getDay()];

  const isAccessAllowed = useMemo(
    () => checkSeatAccessAllowed(role, selectedDate),
    [role, selectedDate],
  );

  useEffect(() => {
    const fetchUser = async () => {
      if (!session?.user?.id) {
        setIsRoleLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/users/${session?.user?.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData: IUser = await res.json();
        setRole(userData?.role || "");
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data. Please try again.");
      } finally {
        setIsRoleLoading(false);
      }
    };

    fetchUser();
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchSeats = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/seats");
        if (!res.ok) {
          throw new Error("Failed to fetch seats");
        }
        const data = await res.json();
        if (data?.length) setSeats(data);
      } catch (error) {
        console.error("Error fetching seats:", error);
        setError("Failed to load seats. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users?role=SPP,GST,Intern");
        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await res.json();
        setUsers(data?.data || data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [refreshKey]);

  useEffect(() => {
    if (selectedDate) {
      const fetchBookings = async () => {
        try {
          const res = await fetch(
            `/api/seatbookings?date=${selectedDate}&limit=1000`,
          );
          if (!res.ok) {
            throw new Error("Failed to fetch bookings");
          }
          const data = await res.json();
          setBookings(data.data || data);
        } catch (error) {
          console.error("Error fetching bookings:", error);
          setError("Failed to load bookings. Please try again.");
        }
      };
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [selectedDate]);

  const getBookingCount = (seatId: string) => {
    return bookings.filter((b) => b.seatId === seatId).length;
  };

  const monthNumber = months.findIndex(
    (month) => getMonthFormat(month) === selectedMonth,
  );

  const days = getMonthDays(months[monthNumber].getMonth());
  const fromDate = days[0];
  const toDate = days[days.length - 1];

  const handleCellClick = useCallback(
    async (userId: string, date: string) => {
      // Only allow users to toggle their own bookings
      if (userId !== session?.user?.id) {
        toast({
          title: "Access Denied",
          description: "You can only manage your own bookings",
          variant: "destructive",
        });
        return;
      }

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
            body: JSON.stringify({ userId, date, userType: "USER" }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to toggle booking");
          }

          const result = await response.json();

          if (result?.message) {
            toast({
              title: result.message,
              variant: "default",
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
    [toast, session?.user?.id],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="container p-2 sm:p-6 md:p-8 m-auto">
      <Alert className="mb-4 sm:mb-6 md:mb-8 border-primary/50 text-primary flex items-center flex-wrap justify-between gap-3 sm:gap-5">
        <UserAvator
          className="flex-1"
          discription={"Choose a table to see details and book your seat."}
        />

        <Flex className="sm:flex-row sm:flex-nowrap ">
          <Label
            htmlFor="booking-date"
            className="mb-1 font-medium whitespace-nowrap hidden sm:block"
          >
            Date for booking
          </Label>
          <Input
            id="booking-date"
            type="date"
            className="border rounded px-3 py-2 w-auto"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getTodayOrNextDate()}
          />
          <BackButton />
        </Flex>
      </Alert>

      {error && (
        <Alert className="mb-8 border-red-500 text-red-500">{error}</Alert>
      )}

      {isRoleLoading ? (
        <div className="flex items-center justify-center mt-10 p-10">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
          <span className="text-lg font-semibold">Loading user role...</span>
        </div>
      ) : (
        <>
          {!isAccessAllowed && session?.user?.id && (
            <AccessRestrictedAlert role={role} dayName={dayName} />
          )}

          {loading ? (
            <div className="flex items-center justify-center mt-10 p-10">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
              <span className="text-lg font-semibold">Loading...</span>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {seats?.map((seat: ISeat) => (
                  <SeatCard
                    key={seat._id}
                    seat={seat}
                    selectedDate={selectedDate}
                    bookingCount={getBookingCount(seat._id)}
                    isAccessAllowed={isAccessAllowed}
                  />
                ))}
              </div>
              <Tabs defaultValue="team_calendar" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="team_calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="booking">Bookings</TabsTrigger>
                  <TabsTrigger value="user_activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="team_calendar" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center flex-wrap  gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                            Booking Calendar
                          </CardTitle>
                          <CardDescription className="mt-2 text-sm">
                            Click on any cell to book or cancel a seat for a
                            user
                          </CardDescription>
                          <div className="flex flex-wrap gap-3 sm:gap-4 items-center mt-2">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded bg-gradient-to-br from-green-400 to-green-500"></div>
                              <span className="text-xs text-gray-600">
                                Booked
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded bg-gray-200"></div>
                              <span className="text-xs text-gray-600">
                                Available
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded bg-yellow-100"></div>
                              <span className="text-xs text-yellow-400">
                                Weekend
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-center order-last sm:order-none">
                          <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchUser}
                            className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
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
                        <div className="hidden sm:block">
                          <Tabs
                            defaultValue="All"
                            value={group}
                            onValueChange={setGroup}
                          >
                            <TabsList>
                              <TabsTrigger value="All">
                                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                                  {users.length}
                                </Badge>
                                All
                              </TabsTrigger>
                              <TabsTrigger value="SPP">
                                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                                  {
                                    users.filter((user) => user.role === "SPP")
                                      .length
                                  }
                                </Badge>
                                SPP
                              </TabsTrigger>
                              <TabsTrigger value="GST">
                                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                                  {
                                    users.filter((user) => user.role === "GST")
                                      .length
                                  }
                                </Badge>
                                GST
                              </TabsTrigger>
                              <TabsTrigger value="Intern">
                                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums mr-2">
                                  {
                                    users.filter(
                                      (user) => user.role === "Intern",
                                    ).length
                                  }
                                </Badge>
                                Intern
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
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
                    </CardHeader>
                    <CardContent className="md:px-4 px-0">
                      <BookingCalendar
                        startDate={fromDate}
                        endDate={toDate}
                        days={days}
                        stats={{
                          totalSeats: seats.reduce(
                            (acc, seat) => acc + (seat.seatsPerUnit || 0),
                            0,
                          ),
                        }}
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
                            const roleComparison =
                              (roleOrder[a.role as keyof typeof roleOrder] ||
                                999) -
                              (roleOrder[b.role as keyof typeof roleOrder] ||
                                999);

                            if (roleComparison !== 0) {
                              return roleComparison;
                            }

                            // If roles are the same, sort by name
                            return (a.name || "").localeCompare(b.name || "");
                          })}
                        isUserView={true}
                        onCellClick={handleCellClick}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="booking">
                  <UserCalender userId={session?.user?.id} seats={seats} />
                </TabsContent>
                <TabsContent value="user_activity">
                  <UserActivity
                    users={users}
                    date={new Date().toISOString().split("T")[0]}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
}
