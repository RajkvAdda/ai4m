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
import { Users, ArrowRight, Rows, TableRowsSplit } from "lucide-react";
import { useEffect, useState } from "react";
import { ISeat, SeatType, ISeatBooking } from "@/types/seat";
import { getTodayOrNextDate } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserCalender from "./UserCalender";
import UserAvator from "@/components/user-avator";
import { useSession } from "next-auth/react";
import { IUser } from "@/types/user";
import { Flex } from "@/components/ui/flex";

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
  const totalCapacity = seat.totalCapacity || 0;
  const availableSeats = totalCapacity - bookingCount;
  const progressValue =
    totalCapacity > 0 ? (availableSeats / totalCapacity) * 100 : 0;

  return (
    <Card className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl">{seat.name}</CardTitle>
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
              // selectedDate && isAccessAllowed?
              `/seats/${seat._id}?date=${selectedDate}`
              // : "#"
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
  const [isAfter5PM, setIsAfter5PM] = useState<boolean>(false);
  console.log(role, "role-123");

  const isSameDate = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const today = new Date(selectedDate);
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayName = dayNames[today.getDay()];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      const isAfter7AM = currentHour >= 7;
      setIsAfter5PM(isAfter7AM);

      console.log(
        isAfter7AM,
        `${currentHour}:${currentMinutes} IST`,
        "currentTime"
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  function getWeekNumber(date: Date): number {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor(
      (date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  }

  const isAccessAllowed = () => {
    if (!role) return false;

    const week = getWeekNumber(new Date(selectedDate));
    const isOddWeek = week % 2 === 1;

    const allowedDays: Record<string, string[]> = {
      SPP: !isOddWeek
        ? ["Monday", "Tuesday", "Wednesday"]
        : ["Monday", "Tuesday"],
      GST: isOddWeek
        ? ["Wednesday", "Thursday", "Friday"]
        : ["Thursday", "Friday"],
      User: [...dayNames],
    };

    return (
      allowedDays[role]?.includes(dayName) ||
      (isSameDate(new Date(selectedDate), new Date()) && isAfter5PM)
    );
  };

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
    if (selectedDate) {
      const fetchBookings = async () => {
        try {
          const res = await fetch(`/api/seatbookings?date=${selectedDate}`);
          if (!res.ok) {
            throw new Error("Failed to fetch bookings");
          }
          const data = await res.json();
          setBookings(data);
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

  return (
    <div className="container p-8 m-auto">
      <Alert className="mb-8 border-primary/50 text-primary flex items-center flex-wrap justify-center gap-5">
        <UserAvator
          discription={"Choose a table to see details and book your seat."}
        />
        <div className="flex-1"></div>
        <Flex className="flex-col sm:flex-row">
          <Label
            htmlFor="booking-date"
            className="mb-1 font-medium whitespace-nowrap"
          >
            Date for booking
          </Label>
          <Input
            id="booking-date"
            type="date"
            className="border rounded px-3 py-2"
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
          {!isAccessAllowed() && session?.user?.id && (
            <Alert className="mb-8 border-yellow-500 text-yellow-500">
              {(() => {
                const week = getWeekNumber(new Date(selectedDate));
                const isOddWeek = week % 2 === 1;

                if (role === "SPP") {
                  return `Access restricted: SPP users can only book on Monday, Tuesday${
                    !isOddWeek ? ", and Wednesday (this week)" : ""
                  }. If you need to book on other days, you can book after 7 AM.`;
                }

                if (role === "GST") {
                  return `Access restricted: GST users can only book on Thursday, Friday${
                    isOddWeek ? ", and Wednesday (this week)" : ""
                  }. If you need to book on other days, you can book after 7 AM.`;
                }

                return "Access restricted: Please log in or check your role.";
              })()}
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center mt-10 p-10">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
              <span className="text-lg font-semibold">Loading...</span>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {seats?.map((seat: ISeat) => (
                  <SeatCard
                    key={seat._id}
                    seat={seat}
                    selectedDate={selectedDate}
                    bookingCount={getBookingCount(seat._id)}
                    isAccessAllowed={isAccessAllowed()}
                  />
                ))}
              </div>
              <UserCalender userId={session?.user?.id} seats={seats} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
