import { notFound } from "next/navigation";
import BookingClient from "./booking-client";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { IRoom, RoomType } from "@/modals/Room";
import { BackButton } from "@/components/ui/button";
import { Rows, TableRowsSplit, Users } from "lucide-react";

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
  return <RoomDetails room={room} date={sp?.date} />;
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
