"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { format, isToday } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarOff, Loader } from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  _id: string;
  userId: string;
  seatId: string;
  seatNumber: number;
  startDate: string;
  status: string;
}

interface CalendarStats {
  totalSeats: number;
}

interface BookingCalendarProps {
  startDate: Date;
  endDate: Date;
  refreshKey: number;
  onCellClick: (userId: string, date: string) => void;
  users: IUser[];
  days: Date[];
  stats: CalendarStats;
  isUserView: boolean;
}

// ─── Pure helpers (no hooks) ──────────────────────────────────────────────────

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const formatWeekday = (date: Date) => format(date, "EEE");
const formatDayMonth = (date: Date) => format(date, "d MMM");

/** Builds a status string like "LEAVE_BY_ADMIN" or "LEAVE_BY_USER". */
const buildStatusKey = (base: string, isAdmin: boolean) =>
  isAdmin ? `${base}_BY_ADMIN` : `${base}_BY_USER`;

/** Returns a new Date with time stripped to midnight. */
const toMidnight = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── BookingCalendar ──────────────────────────────────────────────────────────

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
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [markingHoliday, setMarkingHoliday] = useState<string | null>(null);

  const todayRef = useRef<HTMLTableCellElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Precomputed O(1) lookup maps ──────────────────────────────────────────

  /** "userId|dateKey" → Booking */
  const bookingLookup = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const b of bookings) {
      map.set(`${b.userId}|${getDateFormat(new Date(b.startDate))}`, b);
    }
    return map;
  }, [bookings]);

  /** "userId|dateKey" → IUserActivity[] */
  const activityLookup = useMemo(() => {
    const map = new Map<string, IUserActivity[]>();
    for (const a of userActivities) {
      const key = `${a.userId}|${a.date}`;
      const existing = map.get(key);
      if (existing) existing.push(a);
      else map.set(key, [a]);
    }
    return map;
  }, [userActivities]);

  /** dateKey → total bookings that day */
  const dayTotalMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      const key = getDateFormat(new Date(b.startDate));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [bookings]);

  /** userId → total bookings */
  const userTotalMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      map.set(b.userId, (map.get(b.userId) ?? 0) + 1);
    }
    return map;
  }, [bookings]);

  // Baseline midnight for "past date" comparisons
  const todayMidnight = useMemo(() => toMidnight(new Date()), []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchCalendarData = async () => {
    setLoading(true);
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    try {
      const [bookingsRes, activitiesRes] = await Promise.all([
        fetch(`/api/seatbookings?fromDate=${start}&toDate=${end}`),
        fetch(`/api/useractivity?fromDate=${start}&toDate=${end}`),
      ]);

      if (!bookingsRes.ok) throw new Error("Failed to fetch bookings");
      if (!activitiesRes.ok) throw new Error("Failed to fetch user activities");

      const [bookingsData, activitiesData] = await Promise.all([
        bookingsRes.json(),
        activitiesRes.json(),
      ]);

      setBookings(bookingsData?.data ?? []);
      setUserActivities(activitiesData?.data ?? []);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshActivities = async () => {
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    const res = await fetch(
      `/api/useractivity?fromDate=${start}&toDate=${end}`,
    );
    if (res.ok) setUserActivities((await res.json())?.data ?? []);
  };

  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, refreshKey]);

  // Scroll today's column into the centre of the viewport once data is loaded
  useEffect(() => {
    if (!loading && todayRef.current && scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const { offsetLeft, offsetWidth } = todayRef.current;
      scrollContainerRef.current.scrollLeft =
        offsetLeft - clientWidth / 2 + offsetWidth / 2;
    }
  }, [loading, users]);

  // ── Event handlers ────────────────────────────────────────────────────────

  const updateUserActivityStatus = async (
    user: IUser,
    date: Date,
    status: string,
    description: string,
  ) => {
    if (isUserView && user.id !== session?.user?.id) {
      toast({
        title: "Access Denied",
        description: "You can only manage your own status.",
        variant: "destructive",
      });
      return;
    }

    const response = await fetch("/api/useractivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        date: getDateFormat(date),
        status,
        userName: user.name,
        description,
      }),
    });

    if (!response.ok) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
      return;
    }

    await refreshActivities();
    toast({ title: "Status Updated", description: "Status updated" });
  };

  const handleMarkAsHoliday = async (date: Date) => {
    const dateKey = getDateFormat(date);
    const dateBookings = bookings.filter((b) =>
      isSameDay(new Date(b.startDate), date),
    );

    if (dateBookings.length === 0) {
      toast({
        title: "No Bookings",
        description: `No bookings found for ${formatDayMonth(date)}.`,
      });
      return;
    }

    setMarkingHoliday(dateKey);
    try {
      const results = await Promise.allSettled(
        dateBookings.map((b) =>
          fetch(`/api/seatbookings/${b._id}`, { method: "DELETE" }),
        ),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      toast({
        title: "Holiday Marked",
        description: `${succeeded} booking(s) cancelled for ${formatDayMonth(date)}.`,
      });
      await fetchCalendarData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel bookings.",
        variant: "destructive",
      });
    } finally {
      setMarkingHoliday(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

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
                  {/* Name column header */}
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

                  {/* Date column headers */}
                  {days.map((date) => {
                    const dateKey = getDateFormat(date);
                    return (
                      <DateHeaderCell
                        key={dateKey}
                        date={date}
                        isHovered={hoveredDate === dateKey}
                        isMarkingHoliday={markingHoliday === dateKey}
                        isUserView={isUserView}
                        todayRef={todayRef}
                        onHoverEnter={() => setHoveredDate(dateKey)}
                        onHoverLeave={() => setHoveredDate(null)}
                        onMarkHoliday={() => handleMarkAsHoliday(date)}
                      />
                    );
                  })}

                  {/* Total column header */}
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
                {users.length === 0 && (
                  <tr className="animate-pulse">
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
                      loading && "animate-pulse",
                      userIndex % 2 === 0 ? "bg-white" : "bg-gray-100",
                    )}
                  >
                    {/* User name cell */}
                    <td className="sticky left-0 z-10 bg-inherit border-r-2 border-primary/20 px-2 sm:px-3 py-1 sm:py-2">
                      <UserIdentityCell user={user} />
                    </td>

                    {/* Booking cells */}
                    {days.map((date) => {
                      const dateKey = getDateFormat(date);
                      const booking = bookingLookup.get(
                        `${user.id}|${dateKey}`,
                      );
                      const isBooked = !!booking;
                      const isMoreShow =
                        booking?.status.includes("MORE_SHOW") ?? false;
                      const weekend = isWeekend(date);
                      const isTodayDate = isToday(date);
                      const activities =
                        activityLookup.get(`${user.id}|${dateKey}`) ?? [];
                      const isWaiting =
                        activities[0] !== undefined &&
                        /^WAITING\(\d+\)_USER$/.test(activities[0].status);
                      const isPastDate = toMidnight(date) < todayMidnight;
                      const isHoliday =
                        !isBooked &&
                        !weekend &&
                        (dayTotalMap.get(dateKey) ?? 0) === 0;
                      const isStatusDisabled =
                        isPastDate ||
                        (isUserView ? user.id !== session?.user?.id : false);

                      return (
                        <td
                          key={`${user.id}-${dateKey}`}
                          className={cn(
                            "border-l border-gray-200 px-1 py-0.5 cursor-pointer transition-all",
                            weekend && "bg-yellow-50",
                            isTodayDate && "bg-green-100",
                            loading && "pointer-events-none opacity-75",
                            isHoliday && "bg-orange-200",
                          )}
                          onDoubleClick={() => {
                            if (isPastDate || loading) {
                              toast({
                                title: "Action Not Allowed",
                                description:
                                  "You cannot change status for past dates.",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (isUserView && weekend) {
                              toast({
                                title: "Action Not Allowed",
                                description: "You cannot book on weekends.",
                                variant: "destructive",
                              });
                              return;
                            }
                            onCellClick(user.id, dateKey);
                          }}
                        >
                          <BookingCell
                            isBooked={isBooked}
                            weekend={weekend}
                            loading={loading}
                            user={user}
                            date={date}
                            isWaiting={isWaiting}
                            isMoreShow={isMoreShow}
                            onStatusChange={updateUserActivityStatus}
                            userActivities={activities}
                            isTodayDate={isTodayDate}
                            isHoliday={isHoliday}
                            isStatusDisabled={isStatusDisabled}
                          />
                        </td>
                      );
                    })}

                    {/* Row total */}
                    <td className="sm:sticky right-0 z-10 bg-inherit border-l-2 border-primary/20 px-2 py-0.5">
                      <div className="flex items-center justify-center">
                        <Badge
                          variant="default"
                          className="text-sm font-bold bg-primary"
                        >
                          {userTotalMap.get(user.id) ?? 0}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Daily totals footer row */}
                <tr className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-t-2 border-primary/20 sticky bottom-0 z-10">
                  <td className="sticky left-0 bg-gray-100 px-2 sm:px-4 py-2 sm:py-3 font-semibold text-primary text-xs sm:text-sm">
                    Daily Total
                  </td>
                  {days.map((date) => {
                    const dateKey = getDateFormat(date);
                    const weekend = isWeekend(date);
                    const isTodayDate = isToday(date);
                    const dayTotal = dayTotalMap.get(dateKey) ?? 0;

                    return (
                      <td
                        key={`total-${dateKey}`}
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
                  <td className="sm:sticky right-0 bg-gray-100 border-l-2 border-primary/20 px-2 sm:px-4 py-2 sm:py-3 text-center">
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

// ─── DateHeaderCell ───────────────────────────────────────────────────────────

function DateHeaderCell({
  date,
  isHovered,
  isMarkingHoliday,
  isUserView,
  todayRef,
  onHoverEnter,
  onHoverLeave,
  onMarkHoliday,
}: {
  date: Date;
  isHovered: boolean;
  isMarkingHoliday: boolean;
  isUserView: boolean;
  todayRef: React.RefObject<HTMLTableCellElement | null>;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
  onMarkHoliday: () => void;
}) {
  const isTodayDate = isToday(date);
  const weekend = isWeekend(date);

  return (
    <th
      ref={isTodayDate ? todayRef : null}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      className={cn(
        "p-1 sm:p-2 text-center border-l border-gray-200 min-w-[50px] sm:min-w-[80px] transition-colors",
        weekend && "bg-yellow-50",
        isTodayDate && "bg-green-100 relative",
      )}
    >
      <div className="flex flex-col gap-0.5 sm:gap-1 justify-center items-center">
        <span
          className={cn(
            "text-xs sm:text-sm font-bold",
            weekend ? "text-yellow-400" : "text-primary",
            isTodayDate && "font-bold text-primary",
          )}
        >
          {formatWeekday(date)}
        </span>
        <span
          className={cn(
            "text-[10px] sm:text-xs font-medium",
            weekend ? "text-yellow-400" : "text-gray-600",
            isTodayDate && "font-bold text-primary",
          )}
        >
          {formatDayMonth(date)}
        </span>
        {isTodayDate && (
          <Badge variant="default" className="justify-center px-1 w-max">
            Today
          </Badge>
        )}
        {!isUserView && (isHovered || isMarkingHoliday) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkHoliday();
            }}
            disabled={isMarkingHoliday}
            title="Cancel all bookings for this date"
            className={cn(
              "flex items-center gap-0.5 text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded-md transition-colors",
              isMarkingHoliday
                ? "bg-red-300 text-white cursor-wait"
                : "bg-red-500 hover:bg-red-600 text-white cursor-pointer",
            )}
          >
            <CalendarOff className="w-2.5 h-2.5" />
            {isMarkingHoliday ? "..." : "Holiday"}
          </button>
        )}
      </div>
    </th>
  );
}

// ─── UserIdentityCell ─────────────────────────────────────────────────────────

function UserIdentityCell({ user }: { user: IUser }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary/20">
        <AvatarImage src={user.avator} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold">
          {initials}
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
  );
}

// ─── BookingCell ──────────────────────────────────────────────────────────────

interface BookingCellProps {
  isBooked: boolean;
  weekend: boolean;
  loading: boolean;
  user: IUser;
  date: Date;
  onStatusChange: (
    user: IUser,
    date: Date,
    status: string,
    description: string,
  ) => void;
  userActivities: IUserActivity[];
  isStatusDisabled: boolean;
  isTodayDate: boolean;
  isWaiting: boolean;
  isMoreShow: boolean;
  isHoliday: boolean;
}

const STATUS_MENU_ITEMS: Array<{
  label: string;
  base: string;
  description: string;
  todayOnly?: boolean;
}> = [
  { label: "Status: Leave", base: "LEAVE", description: "Marked leave" },
  {
    label: "Status: FH Leave",
    base: "FH_LEAVE",
    description: "Marked FH Leave",
  },
  {
    label: "Status: SH Leave",
    base: "SH_LEAVE",
    description: "Marked SH Leave",
  },
  { label: "Status: WFO", base: "WFO", description: "Marked WFO" },
  { label: "Status: WFH", base: "WFH", description: "Marked WFH" },
  {
    label: "Status: NO-SHOW",
    base: "NO-SHOW",
    description: "Marked NO-SHOW",
    todayOnly: true,
  },
];

function BookingCell({
  isBooked,
  weekend,
  loading,
  user,
  date,
  onStatusChange,
  userActivities,
  isStatusDisabled,
  isTodayDate,
  isWaiting,
  isMoreShow,
  isHoliday,
}: BookingCellProps) {
  const isAdmin =
    typeof window !== "undefined" && location.href.includes("admin");

  // Sort activities once; most-recent first
  const sortedActivities = useMemo(
    () => [...userActivities].sort((a, b) => (a._id < b._id ? 1 : -1)),
    [userActivities],
  );
  const latestActivity = sortedActivities[0];

  const StatusCell = ({
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
        weekend && "bg-gray-300 opacity-50",
        weekend && isStatusDisabled && "cursor-not-allowed",
        className,
        isBooked &&
          "bg-gradient-to-br from-green-300 to-green-400 shadow-md hover:shadow-lg hover:scale-105",
        isMoreShow &&
          "animate-bounce bg-gradient-to-br from-indigo-300 to-indigo-400",
        isWaiting &&
          "animate-pulse bg-gradient-to-br from-yellow-300 to-yellow-400",
        loading && "cursor-wait",
        isHoliday && !isBooked && !weekend && "bg-orange-300",
      )}
    >
      {isHoliday ? (
        <span className="text-white text-[10px] sm:text-xs font-semibold">
          Holiday
        </span>
      ) : isBooked ? (
        <span className="text-white text-[10px] sm:text-xs font-semibold">
          {weekend ? "Support" : isMoreShow ? "More Show" : "Booked"}
        </span>
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

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={isBooked || weekend || isStatusDisabled}>
        {latestActivity ? (
          <HoverCard openDelay={10} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div className="relative">
                <StatusCell
                  className={cn(
                    latestActivity.status.includes("LEAVE") &&
                      !isBooked &&
                      "animate-pulse bg-red-200 rounded-lg",
                    latestActivity.status.includes("NO-SHOW") &&
                      !isBooked &&
                      "animate-bounce bg-orange-300 rounded-lg",
                  )}
                >
                  {latestActivity.status.split("_")?.[0] ?? "WFH"}
                </StatusCell>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="flex w-64 flex-col gap-0.5 bg-white rounded-2xl p-4 shadow-lg border border-gray-200 z-50">
              <H5>Activity Log</H5>
              {userActivities.map((activity) => (
                <div
                  key={String(activity._id)}
                  className="mb-1 bg-gradient-to-b from-gray-100 to-grey-50 p-2 rounded-lg border border-gray-200"
                >
                  <p className="text-xs text-gray-700">
                    {activity.status.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {displayDateTime(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      new Date((activity as any).createdAt) ?? null,
                    )}
                  </p>
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        ) : (
          <StatusCell>WFH</StatusCell>
        )}
      </ContextMenuTrigger>

      <ContextMenuContent>
        {STATUS_MENU_ITEMS.filter((item) => !item.todayOnly || isTodayDate).map(
          (item) => (
            <ContextMenuItem
              key={item.base}
              onClick={() =>
                onStatusChange(
                  user,
                  date,
                  buildStatusKey(item.base, isAdmin),
                  item.description,
                )
              }
            >
              {item.label}
            </ContextMenuItem>
          ),
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
