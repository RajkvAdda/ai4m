import { getRoomById } from "@/lib/data";
import { notFound } from "next/navigation";
import BookingClient from "./booking-client";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, Armchair, Users } from "lucide-react";
import type { RoomType } from "@/types";

const roomIcons: Record<RoomType, React.ReactNode> = {
  table: <Table className="h-8 w-8" />,
  bench: <Armchair className="h-8 w-8" />,
  free_area: <Users className="h-8 w-8" />,
};

export default async function RoomDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const room = await getRoomById(params.id);

  if (!room) {
    notFound();
  }

  return (
    <div className="container py-8">
      <Card className="mb-8 overflow-hidden shadow-lg">
        <div className="bg-primary/10 p-6 flex items-center gap-4">
          <div className="text-primary">{roomIcons[room.type]}</div>
          <div>
            <CardTitle className="text-3xl font-headline">
              {room.name}
            </CardTitle>
            <CardDescription className="text-base">
              Capacity: {room.totalCapacity} seats ({room.capacity.units}{" "}
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
