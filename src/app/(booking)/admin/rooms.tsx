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
import { IRoom } from "@/modals/Room";
import React from "react";
import CreateRoomForm from "./create-room-form";

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
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 w-full overflow-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Existing Rooms</CardTitle>
              <CardDescription>
                A list of all currently configured rooms.
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
                        {room?.totalCapacity}
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
