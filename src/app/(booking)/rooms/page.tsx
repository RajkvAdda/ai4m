"use client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, ArrowRight, Rows, TableRowsSplit } from "lucide-react";
import { useEffect, useState } from "react";
import { IRoom, RoomType } from "@/modals/Room";
import { getTodayOrNextDate } from "@/lib/utils";
import { IBooking } from "@/modals/Booking";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserCalender from "./UserCalender";
import UserAvator from "@/components/user-avator";
import { useSession } from "next-auth/react";

const roomIcons: Record<RoomType, React.ReactNode> = {
  table: <TableRowsSplit className="h-6 w-6" />,
  row: <Rows className="h-6 w-6" />,
  free_area: <Users className="h-6 w-6" />,
};

const roomDescriptions: Record<RoomType, string> = {
  table: "Group tables for collaboration",
  row: "Individual row-style seating",
  free_area: "Open area for flexible work",
};

function RoomCard({
  room,
  selectedDate,
  bookingCount,
}: {
  room: IRoom;
  selectedDate: string;
  bookingCount: number;
}) {
  const totalCapacity = room.totalCapacity || 0;
  const availableSeats = totalCapacity - bookingCount;
  const progressValue =
    totalCapacity > 0 ? (availableSeats / totalCapacity) * 100 : 0;

  return (
    <Card className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl">{room.name}</CardTitle>
          <div className="p-2 opacity-30 rounded-lg">
            {roomIcons[room.type as RoomType] || ""}
          </div>
        </div>
        <CardDescription>
          {room.description || roomDescriptions[room.type]}
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
            color=""
            aria-label={`${availableSeats} of ${totalCapacity} seats available`}
          />
          {/* <p className="text-xs text-muted-foreground mt-2">
            Bookings for {selectedDate}: {bookingCount}
          </p> */}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="default">
          <Link
            href={
              selectedDate ? `/rooms/${room._id}?date=${selectedDate}` : "#"
            }
          >
            View & Book <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Rooms() {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayOrNextDate());
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/rooms");
        const data = await res.json();
        if (data?.length) setRooms(data);
      } catch (_err) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const fetchBookings = async () => {
        try {
          const res = await fetch(`/api/bookings?date=${selectedDate}`);
          const data = await res.json();
          setBookings(data);
        } catch (_err) {
          // Optionally handle error
        }
      };
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [selectedDate]);

  // Helper to get booking count for a room and date
  const getBookingCount = (roomId: string) => {
    return bookings.filter((b) => b.roomId === roomId).length;
  };

  return (
    <div className="container p-8 m-auto">
      <Alert className="mb-8 border-primary/50 text-primary flex flex-wrap justify-center gap-5">
        <UserAvator discription="Choose a room to see details and book your seat." />
        <div className="flex-1"></div>
        <div>
          <Label htmlFor="booking-date" className="mb-1 font-medium">
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
        </div>
      </Alert>
      {/* handle the selected date */}
      {loading ? (
        <div className="flex items-center justify-center mt-10 p-10">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
          <span className="text-lg font-semibold ">Loading...</span>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms?.map((room: IRoom) => (
              <RoomCard
                key={room._id}
                room={room}
                selectedDate={selectedDate}
                bookingCount={getBookingCount(room._id)}
              />
            ))}
          </div>
          <UserCalender userId={session?.user?.id} rooms={rooms} />
        </div>
      )}
    </div>
  );
}
