"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { format, formatDate, isToday } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader } from "lucide-react";
import { cn, displayDateTime, getDateFormat, isSameDay } from "@/lib/utils";
import { IUser } from "@/types/user";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useToast } from "@/hooks/use-toast";
import { IUserActivity } from "@/types/userActivity";
import { HoverCard } from "@/components/ui/hover-card";
import { HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { H5 } from "@/components/ui/typography";
import { useSession } from "next-auth/react";

interface Booking {
  _id: string;
  userId: string;
  seatId: string;
  seatNumber: number;
  startDate: string;
  status: string;
}

interface BookingCalendarProps {
  startDate: Date;
  endDate: Date;
  refreshKey: number;
  onCellClick: (userId: string, date: string) => void;
  users: IUser[];
  days: Date[];
  stats: any;
  isUserView: boolean;
}

export function BookingCalendar({
  startDate,
  endDate,
  refreshKey,
  onCellClick,
  users,
  days,
  stats,
  isUserView,
}: BookingCalendarProps) {
  const { toast } = useToast();
  const { data: session } = useSession();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userActivities, setUserActivities] = useState<IUserActivity[]>([]);
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
  const fetchUserActivities = async () => {
    try {
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");

      const response = await fetch(
        `/api/useractivity?fromDate=${start}&toDate=${end}`,
      );

      if (!response.ok) throw new Error("Failed to fetch user activities");

      const data = await response.json();
      setUserActivities(data?.data || []);
    } catch (error) {
      console.error("Error fetching user activities:", error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchUserActivities();
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

  const getDayName = (date: Date) => {
    return format(date, "EEE");
  };

  const getDateDisplay = (date: Date) => {
    return format(date, "d MMM");
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Calculate user-wise booking totals
  const getUserBookingTotal = (userId: string) => {
    return bookings.filter((b) => b.userId === userId).length;
  };

  // Calculate day-wise booking totals
  const getDayBookingTotal = (date: Date) => {
    return bookings.filter((b) => isSameDay(new Date(b.startDate), date))
      .length;
  };

  async function handleStatus(
    user: IUser,
    date: Date,
    status: string,
    description: string,
  ) {
    if (isUserView && user.id !== session?.user?.id) {
      toast({
        title: "Access Denied",
        description: "You can only manage your own status.",
        variant: "destructive",
      });
      return;
    }
    const activityData = {
      userId: user.id,
      date: getDateFormat(date),
      status: status,
      userName: user.name,
      description: description,
    };
    const response = await fetch("/api/useractivity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activityData),
    });

    if (!response.ok) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
      return;
    }

    fetchUserActivities();

    toast({
      title: "Status Updated",
      description: "Status updated",
      variant: "default",
    });
  }

  console.log("bookings:", bookings);
  console.log("userActivities:", userActivities);

  return (
    <div className="relative">
      <Card className={cn("p-0 transition-all duration-200")}>
        <div
          className="overflow-x-auto max-h-screen overflow-y-auto"
          ref={scrollContainerRef}
        >
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse">
              <thead className="sticky top-0 z-30 bg-white shadow-md">
                <tr className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
                  <th className="sticky left-0 z-20 bg-white border-r-2 border-primary/20 px-2 sm:px-4 py-2 text-left min-w-[120px] sm:min-w-[180px]">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-primary truncate">
                        Team Members
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs hidden sm:inline-flex"
                      >
                        {users.length}
                      </Badge>
                    </div>
                  </th>
                  {days.map((date) => {
                    const dateKey = getDateFormat(date);
                    const isTodayDate = isToday(date);
                    return (
                      <th
                        key={dateKey}
                        ref={isTodayDate ? todayRef : null}
                        className={cn(
                          "p-1 sm:p-2 text-center border-l border-gray-200 min-w-[50px] sm:min-w-[80px]",
                          isWeekend(date) && "bg-yellow-50",
                          isTodayDate && "bg-green-100 relative",
                        )}
                      >
                        <div className="flex flex-col gap-0.5 sm:gap-1 justify-center items-center">
                          <span
                            className={cn(
                              "text-xs sm:text-sm font-bold",
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
                              "text-[10px] sm:text-xs font-medium",
                              isWeekend(date)
                                ? "text-yellow-400"
                                : "text-gray-600",
                              isTodayDate && "font-bold text-primary",
                            )}
                          >
                            {getDateDisplay(date)}
                          </span>
                          {isTodayDate && (
                            <Badge
                              variant="default"
                              className="justify-center px-1 w-max"
                            >
                              Today
                            </Badge>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="sm:sticky right-0 z-20 bg-white border-l-2 border-primary/20 px-2 sm:px-4 py-2 sm:py-3 text-center min-w-[60px] sm:min-w-[80px]">
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <span className="text-xs sm:text-sm font-semibold text-primary">
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
                      "hover:bg-green-100 transition-colors",
                      loading ? "animate-pulse" : "",
                      userIndex % 2 === 0 ? "bg-white" : "bg-gray-100",
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-inherit border-r-2 border-primary/20 px-2 sm:px-3 py-1 sm:py-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary/20">
                          <AvatarImage src={user.avator} alt={user.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 truncate w-[100px] sm:w-auto">
                            {user.name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:inline w-[100px] sm:w-auto">
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
                      const userActivity = userActivities.filter(
                        (activity) =>
                          activity.userId === user.id &&
                          activity.date === getDateFormat(date),
                      );

                      return (
                        <td
                          key={`${user.id}-${date}`}
                          className={cn(
                            "border-l border-gray-200 px-1 py-0.5 cursor-pointer transition-all",
                            weekend && "bg-yellow-50",
                            isTodayDate && "bg-green-100",
                            loading && "pointer-events-none opacity-75",
                          )}
                          onDoubleClick={() =>
                            !weekend &&
                            !loading &&
                            onCellClick(user.id, getDateFormat(date))
                          }
                        >
                          <TableCell
                            key={`${user.id}-${date}`}
                            isBooked={isBooked}
                            weekend={weekend}
                            loading={loading}
                            user={user}
                            date={date}
                            handleStatus={handleStatus}
                            userActivity={userActivity}
                            isStatusDisabled={
                              isUserView
                                ? user.id === session?.user?.id
                                  ? false
                                  : true
                                : false
                            }
                          />
                        </td>
                      );
                    })}
                    <td className="sm:sticky right-0 z-10 bg-inherit border-l-2 border-primary/20 px-2 py-0.5">
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
                  <td className="sticky left-0 z-30 bg-gray-100 px-2 sm:px-4 py-2 sm:py-3 font-semibold text-primary text-xs sm:text-sm">
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
                          "border-l border-gray-200 px-2 sm:px-4 py-2 sm:py-3 text-center",
                          weekend && "bg-yellow-50",
                          isTodayDate && "bg-green-100",
                        )}
                      >
                        <Badge
                          variant={dayTotal > 0 ? "default" : "secondary"}
                          className="text-xs sm:text-sm font-bold"
                        >
                          {dayTotal}/{stats.totalSeats}
                        </Badge>
                      </td>
                    );
                  })}
                  <td className="sm:sticky right-0 z-30 bg-gray-100 border-l-2 border-primary/20 px-2 sm:px-4 py-2 sm:py-3 text-center">
                    <Badge
                      variant="default"
                      className="text-xs sm:text-sm font-bold bg-primary"
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
    </div>
  );
}

function TableCell({
  isBooked,
  weekend,
  loading,
  user,
  date,
  handleStatus,
  userActivity,
  isStatusDisabled,
}: {
  isBooked: boolean;
  weekend: boolean;
  loading: boolean;
  user: IUser;
  date: Date;
  handleStatus: (
    user: IUser,
    date: Date,
    status: string,
    description: string,
  ) => void;
  userActivity: IUserActivity[] | undefined;
  isStatusDisabled: boolean;
}) {
  const Cell = ({
    className,
    children,
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => (
    <div
      className={cn(
        "h-6 sm:h-7 rounded-lg flex items-center justify-center transition-all duration-200",
        !isBooked &&
          !weekend &&
          "bg-gray-200 hover:bg-gray-300 hover:scale-105",
        weekend && "bg-gray-300 cursor-not-allowed opacity-50",
        className,
        isBooked &&
          !weekend &&
          "bg-gradient-to-br from-green-300 to-green-400 shadow-md hover:shadow-lg hover:scale-105",
        loading && "cursor-wait",
      )}
    >
      {isBooked && !weekend ? (
        <div className="flex flex-col items-center">
          <span className="text-white text-[10px] sm:text-xs font-semibold">
            Booked
          </span>
        </div>
      ) : weekend ? (
        <span className="text-[10px] sm:text-xs text-gray-500 font-medium px-1">
          WO
        </span>
      ) : (
        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
          {children}
        </span>
      )}
    </div>
  );
  const dayActivity =
    userActivity?.length > 0
      ? userActivity.sort((a, b) => {
          return a._id < b._id ? 1 : -1;
        })[0]
      : undefined;
  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={isBooked || weekend || isStatusDisabled}>
        {userActivity?.length > 0 ? (
          <HoverCard openDelay={10} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="relative">
                <Cell
                  className={cn(
                    dayActivity?.status.includes("LEAVE") &&
                      !isBooked &&
                      "animate-pulse bg-red-200 rounded-lg",
                    dayActivity?.status.includes("NO-SHOW") &&
                      !isBooked &&
                      "animate-bounce bg-orange-300 rounded-lg",
                  )}
                >
                  {dayActivity.status.split("_")?.[0] || "WFH"}
                </Cell>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="flex w-64 flex-col gap-0.5 bg-white rounded-2xl p-4 shadow-lg border border-gray-200 z-50">
              <H5>Activity Log</H5>
              {userActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="mb-1 bg-gradient-to-b from-gray-100 to-grey-50 p-2 rounded-lg border border-gray-200 "
                >
                  <p className="text-xs text-gray-700">
                    {activity.status.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {displayDateTime(new Date(activity.createdAt) || null)}
                  </p>
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <Cell>WFH</Cell>
        )}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            handleStatus(
              user,
              date,
              location.href.includes("admin")
                ? "LEAVE_BY_ADMIN"
                : "LEAVE_BY_USER",
              "Marked leave",
            );
            // handle user activity create here
          }}
        >
          Status: Leave
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            handleStatus(
              user,
              date,
              location.href.includes("admin")
                ? "FH_LEAVE_BY_ADMIN"
                : "FH_LEAVE_BY_USER",
              "Marked FH Leave",
            );
            // handle user activity create here
          }}
        >
          Status: FH Leave
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            handleStatus(
              user,
              date,
              location.href.includes("admin")
                ? "SH_LEAVE_BY_ADMIN"
                : "SH_LEAVE_BY_USER",
              "Marked SH Leave",
            );
          }}
        >
          Status: SH Leave
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            handleStatus(
              user,
              date,

              location.href.includes("admin") ? "WFO_BY_ADMIN" : "WFO_BY_USER",
              "Marked WFO",
            );
          }}
        >
          Status: WFO
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            handleStatus(
              user,
              date,
              location.href.includes("admin") ? "WFH_BY_ADMIN" : "WFH_BY_USER",
              "Marked WFH",
            );
          }}
        >
          Status: WFH
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            handleStatus(
              user,
              date,
              location.href.includes("admin")
                ? "NO-SHOW_BY_ADMIN"
                : "NO-SHOW_BY_USER",
              "Marked NO-SHOW",
            );
          }}
        >
          Status: NO-SHOW
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
