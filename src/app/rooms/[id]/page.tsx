import { notFound } from "next/navigation";
import BookingClient from "./booking-client";
import { IRoom, RoomType } from "@/types/room";
import { BackButton } from "@/components/ui/button";
import { TableRowsSplit, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { CardDescription, CardTitle } from "@/components/ui/card";

type SearchParams = Record<string, string | string[] | undefined>;

const roomIcons: Record<RoomType, React.ReactNode> = {
  table_room: <TableRowsSplit className="h-6 w-6" />,
  open_room: <Users className="h-6 w-6" />,
};

export default async function RoomDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/rooms/${id}`, {
    // Ensure this is a server-side fetch
    cache: "no-store",
  });
  if (!res.ok) {
    notFound();
  }
  const room: IRoom = await res.json();

  if (!room) {
    notFound();
  }
  console.log("ej-date", sp?.date);
  return <RoomDetails room={room} date={sp?.date as string} />;
}

// Client Component
function RoomDetails({ room, date }: { room: IRoom; date: string }) {
  return (
    <div className="container p-4 sm:p-6 md:p-8">
      <Alert className="mb-4 sm:mb-6 md:mb-8 border-primary/50 text-primary flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="text-primary opacity-50">
            {roomIcons[room.type as RoomType] || ""}
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-headline">
              {room.name}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Capacity: {room?.totalCapacity} seats ({room.units}{" "}
              {room.type === "table_room"
                ? "tables"
                : room.type === "open_room"
                  ? "areas"
                  : "rows"}
              )
            </CardDescription>
          </div>
        </div>
        <div className="flex-1"></div>
        <BackButton />
      </Alert>

      <BookingClient room={room} />
    </div>
  );
}
