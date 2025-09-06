import { notFound } from "next/navigation";
import BookingClient from "./booking-client";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { IRoom, RoomType } from "@/modals/Room";
import { BackButton } from "@/components/ui/button";
import { Rows, TableRowsSplit, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";

type SearchParams = Record<string, string | string[] | undefined>;

const roomIcons: Record<RoomType, React.ReactNode> = {
  table: <TableRowsSplit className="h-6 w-6" />,
  row: <Rows className="h-6 w-6" />,
  free_area: <Users className="h-6 w-6" />,
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
    <div className="container p-8">
      <Alert className="mb-8 border-primary/50 text-primary flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-primary opacity-50">
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
        </div>
        <div className="flex-1"></div>
        <BackButton />
      </Alert>

      <BookingClient room={room} date={date} />
    </div>
  );
}
