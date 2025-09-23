import { notFound } from "next/navigation";
import BookingClient from "./booking-client";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { ISeat, SeatType } from "@/types/seat";
import { BackButton } from "@/components/ui/button";
import { Rows, TableRowsSplit, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";

type SearchParams = Record<string, string | string[] | undefined>;

const seatIcons: Record<SeatType, React.ReactNode> = {
  table: <TableRowsSplit className="h-6 w-6" />,
  row: <Rows className="h-6 w-6" />,
  free_area: <Users className="h-6 w-6" />,
};

export default async function SeatDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = (searchParams ? await searchParams : undefined) ?? {};
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/seats/${id}`, {
    // Ensure this is a server-side fetch
    cache: "no-store",
  });
  if (!res.ok) {
    notFound();
  }
  const seat: ISeat = await res.json();

  if (!seat) {
    notFound();
  }
  console.log("ej-date", sp?.date);
  return <SeatDetails seat={seat} date={sp?.date as string} />;
}

// Client Component
function SeatDetails({ seat, date }: { seat: ISeat; date: string }) {
  return (
    <div className="container p-8">
      <Alert className="mb-8 border-primary/50 text-primary flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-primary opacity-50">
            {seatIcons[seat.type as SeatType] || ""}
          </div>
          <div>
            <CardTitle className="text-3xl font-headline">
              {seat.name}
            </CardTitle>
            <CardDescription className="text-base">
              Capacity: {seat?.totalCapacity} seats ({seat.units}{" "}
              {seat.type === "table"
                ? "tables"
                : seat.type === "row"
                ? "rows"
                : "areas"}
              )
            </CardDescription>
          </div>
        </div>
        <div className="flex-1"></div>
        <BackButton />
      </Alert>

      <BookingClient seat={seat} date={date} />
    </div>
  );
}
