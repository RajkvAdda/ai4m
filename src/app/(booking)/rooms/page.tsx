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
import { IRoom } from "@/modals/Room";

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

function RoomCard({ room }: { room: Room }) {
  const totalCapacity = room.units * room.seatsPerUnit;
  const availableSeats = totalCapacity - (room.bookings?.length ?? 0);
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
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="default">
          <Link href={`/rooms/${room._id}`}>
            View & Book <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Rooms() {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();
  console.log("rj-session", { session, status });
  useEffect(() => {
    if (session) {
      const fetchRooms = async () => {
        try {
          const res = await fetch("/api/rooms");
          const data = await res.json();
          setRooms(data);
        } catch (err) {
          // Optionally handle error
        }
      };
      fetchRooms();
    }
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status]);

  return (
    <div className="container p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Welcome, {session?.user?.name || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Choose a room to see details and book your seat.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room._id} room={room} />
        ))}
      </div>
    </div>
  );
}
