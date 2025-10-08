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
import { Users, ArrowRight, TableRowsSplit } from "lucide-react";
import { useEffect, useState } from "react";
import { IRoom, RoomType, IRoomBooking } from "@/types/room";
import { formatTime, getTodayOrNextDate } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserCalender from "./UserCalender";
import UserAvator from "@/components/user-avator";
import { useSession } from "next-auth/react";
import { Flex } from "@/components/ui/flex";

const roomIcons: Record<RoomType, React.ReactNode> = {
  open_room: <Users className="h-6 w-6" />,
  table_room: <TableRowsSplit className="h-6 w-6" />,
};

const roomDescriptions: Record<RoomType, string> = {
  open_room: "Open room for flexible work",
  table_room: "Group tables for collaboration",
};

function RoomCard({
  room,
  selectedDate,
}: {
  room: IRoom;
  selectedDate: string;
}) {
  return (
    <Card className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl duration-300 ">
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
          <p className="small mb-1">
            <strong>Operating Hours:</strong> {formatTime(room.startTime)} -{" "}
            {formatTime(room.endTime)}
          </p>
          <p className="small">
            <strong>Min. Interval:</strong> {room.minBookingTime} mins
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="default">
          <Link href={`/rooms/${room._id}?date=${selectedDate}`}>
            View & Book <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Rooms() {
  const { data: session } = useSession();

  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayOrNextDate());
  const [bookings, setBookings] = useState<IRoomBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/rooms");
        if (!res.ok) {
          throw new Error("Failed to fetch rooms");
        }
        const data = await res.json();
        if (data?.length) setRooms(data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setError("Failed to load rooms. Please try again.");
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
          const res = await fetch(`/api/roombookings?date=${selectedDate}`);
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

  return (
    <div className="container p-8 m-auto">
      <Alert className="mb-8 border-primary/50 text-primary flex flex-wrap justify-center gap-5">
        <UserAvator
          discription={"Choose a room to see details and book your seat."}
        />
        <div className="flex-1"></div>
        <Flex>
          {/* <Label
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
          /> */}
          <BackButton />
        </Flex>
      </Alert>

      {error && (
        <Alert className="mb-8 border-red-500 text-red-500">{error}</Alert>
      )}
      {loading ? (
        <div className="flex items-center justify-center mt-10 p-10">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
          <span className="text-lg font-semibold">Loading...</span>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {rooms?.map((room: IRoom) => (
              <RoomCard
                key={room._id}
                room={room}
                selectedDate={selectedDate}
              />
            ))}
          </div>
          <UserCalender userId={session?.user?.id} rooms={rooms} />
        </div>
      )}
    </div>
  );
}
