"use client";
import CreateRoomForm from "./create-room-form";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Trash } from "lucide-react";
import { IRoom } from "@/modals/Room";
import { IconButton } from "@/components/ui/icon";

export default function AdminPage() {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();
  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchRooms();
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status]);

  console.log("rj-rooms-2", rooms);

  // Handler for deleting a room
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setRooms((prev) =>
          prev.filter((room) => room._id !== id && room.id !== id)
        );
      } else {
        alert(data.error || "Failed to delete room");
      }
    } catch (err) {
      alert("Error deleting room");
    }
  };

  // Handler for editing a room (stub)
  const handleEdit = (room: IRoom) => {
    // You can open a modal or navigate to an edit page here
    alert(`Edit room: ${room.name}`);
    // Example: router.push(`/booking/admin/edit/${room._id || room.id}`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
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
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{room.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {room?.totalCapacity}
                    </TableCell>
                    <TableCell className="text-right">
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
  );
}
