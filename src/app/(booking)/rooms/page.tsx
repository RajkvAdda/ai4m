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
import { Table, Armchair, Users, ArrowRight } from "lucide-react";
// import { getRooms } from "@/lib/data";
import { Room, RoomType } from "@/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IRoom } from "@/app/api/rooms/RoomModal";

const roomIcons: Record<RoomType, React.ReactNode> = {
  table: <Table className="h-6 w-6" />,
  bench: <Armchair className="h-6 w-6" />,
  free_area: <Users className="h-6 w-6" />,
};

const roomDescriptions: Record<RoomType, string> = {
  table: "Group tables for collaboration",
  bench: "Individual bench-style seating",
  free_area: "Open area for flexible work",
};

function RoomCard({
  room,
  selectedDate,
  bookingCount,
}: {
  room: Room;
  selectedDate: string;
  bookingCount: number;
}) {
  const totalCapacity = room.totalCapacity;
  const availableSeats = totalCapacity - bookingCount;
  const progressValue = (availableSeats / totalCapacity) * 100;

  return (
    <Card className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl">{room.name}</CardTitle>
          <div className="p-2 bg-accent/20 text-accent rounded-lg">
            {roomIcons[room.type]}
          </div>
        </div>
        <CardDescription>{roomDescriptions[room.type]}</CardDescription>
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
          <p className="text-xs text-muted-foreground mt-2">
            Bookings for {selectedDate}: {bookingCount}
          </p>
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
  const [selectedDate, setSelectedDate] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      const fetchRooms = async () => {
        try {
          const res = await fetch("/api/rooms");
          const data = await res.json();
          if (data?.length) setRooms(data);
        } catch (err) {
          // Optionally handle error
        }
      };
      fetchRooms();
    }
  }, [session]);

  useEffect(() => {
    if (selectedDate) {
      const fetchBookings = async () => {
        try {
          const res = await fetch(`/api/bookings?date=${selectedDate}`);
          const data = await res.json();
          setBookings(data);
        } catch (err) {
          // Optionally handle error
        }
      };
      fetchBookings();
    } else {
      setBookings([]);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status]);

  // Helper to get booking count for a room and date
  const getBookingCount = (roomId: string) => {
    return bookings.filter((b) => b.roomId === roomId).length;
  };

  return (
    <div className="container p-8">
      <div className="mb-8 grid grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Welcome, {session?.user?.name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Choose a room to see details and book your seat.
          </p>
        </div>
        {/* handle the selected date */}
        <div className="flex flex-col items-end justify-center">
          <label htmlFor="booking-date" className="mb-2 font-medium">
            Date For booking
          </label>
          <input
            id="booking-date"
            type="date"
            className="border rounded px-3 py-2"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms?.map((room) => (
          <RoomCard
            key={room._id}
            room={room}
            selectedDate={selectedDate}
            bookingCount={getBookingCount(room._id)}
          />
        ))}
      </div>
    </div>
  );
}
