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
import React from "react";
import CreateRoomForm from "./create-room-form";
import { IRoom } from "@/types/room";

export default function Rooms({
  rooms,
  handleDelete,
  fetchRooms,
}: {
  rooms: IRoom[];
  handleDelete: (id: string) => void;
  fetchRooms: () => void;
}) {
  return (
    <div>
      <div className="grid gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 w-full">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl sm:text-2xl">
                Existing Rooms
              </CardTitle>
              <CardDescription className="text-sm">
                A list of all currently configured rooms.
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
                        <TableHead className="text-right">
                          Min Booking Time
                        </TableHead>
                        <TableHead className="text-right">Start Time</TableHead>
                        <TableHead className="text-right">End Time</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((room) => (
                        <TableRow key={room._id || room.id}>
                          <TableCell className="font-medium">
                            {room.name}
                            <div>
                              <small className="text-muted-foreground/50 text-sm">
                                {room.description}
                              </small>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{room.type}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {room?.minBookingTime}
                          </TableCell>
                          <TableCell className="text-right">
                            {room?.startTime}
                          </TableCell>
                          <TableCell className="text-right">
                            {room?.endTime}
                          </TableCell>
                          <TableCell className="text-right">
                            {/* <IconButton
                          iconName="Edit2"
                          onClick={() => handleDelete(room._id || room.id)}
                          aria-label="Delete Room"
                        /> */}
                            <IconButton
                              iconName="Trash"
                              onClick={() => handleDelete(room._id || room.id)}
                              aria-label="Delete Room"
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
          <CreateRoomForm onRoomChange={fetchRooms} />
        </div>
      </div>
    </div>
  );
}
