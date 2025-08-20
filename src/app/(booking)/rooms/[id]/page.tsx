import { notFound } from "next/navigation";
import BookingClient from "./booking-client";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { IRoom, RoomType } from "@/modals/Room";
import { roomIcons } from "../page";
import { BackButton } from "@/components/ui/button";

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

// Server Component
export default async function RoomDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/rooms/${params?.id}`,
    {
      // Ensure this is a server-side fetch
      cache: "no-store",
    }
  );
  if (!res.ok) {
    notFound();
  }
  const room: IRoom = await res.json();

  if (!room) {
    notFound();
  }
  console.log("ej-date", searchParams?.date, params);
  return <RoomDetails room={room} date={searchParams?.date} />;
}

// Client Component
function RoomDetails({ room, date }: { room: IRoom; date: string }) {
  return (
    <div className="container p-8">
      <Card className="mb-8 overflow-hidden shadow-lg bg-primary/7">
        <div className=" p-2 px-4 flex items-center gap-4">
          <div className="text-primary">
            {roomIcons[room.type as RoomType] || ""}
          </div>
          <div>
            <CardTitle className="text-3xl font-headline">
              {room.name}
            </CardTitle>
            <CardDescription className="text-base">
              Capacity: {room?.totalCapacity} seats ({room.units}{" "}
              {room.type === "table"
                ? "tables"
                : room.type === "row"
                ? "rows"
                : "areas"}
              )
            </CardDescription>
          </div>
          <div className="flex-1"></div>
          <BackButton />
        </div>
      </Card>

      <BookingClient room={room} date={date} />
    </div>
  );
}
