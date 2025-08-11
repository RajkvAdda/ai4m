import { notFound } from "next/navigation";
import BookingClient from "./booking-client";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, Armchair, Users } from "lucide-react";
import type { RoomType } from "@/types";
import { IRoom } from "@/modals/Room";

const roomIcons: Record<RoomType, React.ReactNode> = {
  table: <Table className="h-8 w-8" />,
  bench: <Armchair className="h-8 w-8" />,
  free_area: <Users className="h-8 w-8" />,
};

// Server Component
export default async function RoomDetailsPage({
  params,
}: {
  params: { id: string };
}) {
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

  return <RoomDetails room={room} />;
}

// Client Component
function RoomDetails({ room }: { room: IRoom }) {
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
              Capacity: {room.totalCapacity} seats ({room.units}{" "}
              {room.type === "table"
                ? "tables"
                : room.type === "bench"
                ? "benches"
                : "areas"}
              )
            </CardDescription>
          </div>
        </div>
      </Card>

      <BookingClient room={room} />
    </div>
  );
}
