import { Badge } from "@/components/ui/badge";
import {
  Card,
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
import { ISeat } from "@/modals/(Seat)/Seat";
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
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 w-full overflow-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Existing Seats</CardTitle>
              <CardDescription>
                A list of all currently configured seats.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        {seat?.totalCapacity}
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
