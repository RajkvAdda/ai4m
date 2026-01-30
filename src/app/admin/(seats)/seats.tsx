import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ISeat } from "@/types/seat";
import React from "react";
import CreateSeatForm from "./create-seat-form";

export default function Seats({
  seats,
  handleDelete,
  fetchSeats,
}: {
  seats: ISeat[];
  handleDelete: (id: string) => void;
  fetchSeats: () => void;
}) {
  return (
    <div>
      <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 w-full">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl sm:text-2xl">
                Existing Seats
              </CardTitle>
              <CardDescription className="text-sm">
                A list of all currently configured seats.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Capacity</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seats.map((seat) => (
                        <TableRow key={seat._id || seat.id}>
                          <TableCell className="font-medium">
                            {seat.name}
                            <div>
                              <small className="text-muted-foreground/50 text-sm">
                                {seat.description}
                              </small>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{seat.type}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {seat?.seatsPerUnit}
                          </TableCell>
                          <TableCell className="text-right">
                            {/* <IconButton
                          iconName="Edit2"
                          onClick={() => handleDelete(seat._id || seat.id)}
                          aria-label="Delete Seat"
                        /> */}
                            <IconButton
                              iconName="Trash"
                              onClick={() => handleDelete(seat._id || seat.id)}
                              aria-label="Delete Seat"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <CreateSeatForm onSeatChange={fetchSeats} />
        </div>
      </div>
    </div>
  );
}
