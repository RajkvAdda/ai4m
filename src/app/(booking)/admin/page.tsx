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

import { IRoom } from "@/modals/Room";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AdminPage() {
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    if (session) {
      const fetchRooms = async () => {
        try {
          const res = await fetch("/api/rooms");
          const data = await res.json();
          setRooms(data);
        } catch (err) {
          // Optionally handle error
        }
      };
      fetchRooms();
    }
  }, [session]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status]);

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
                      {room.units && room.seatsPerUnit
                        ? room.units * room.seatsPerUnit
                        : 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <CreateRoomForm />
      </div>
    </div>
  );
}
