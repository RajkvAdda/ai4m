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
import { IRoom } from "@/modals/Room";
import { IconButton } from "@/components/ui/icon";

export default function AdminPage() {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { status } = useSession();
  const fetchRooms = async () => {
    try {
      setLoading(false);
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(data);
    } catch (_err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [router, status]);

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
    } catch (_err) {
      alert("Error deleting room");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center mt-10 p-10">
        <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
        <span className="text-lg font-semibold ">Loading...</span>
      </div>
    );

  return (
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
