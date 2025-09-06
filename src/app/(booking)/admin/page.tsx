"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IRoom } from "@/modals/Room";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Rooms from "./rooms";
import Users from "./users";
import { IUser } from "../users/[id]/page";
import { IBooking } from "@/modals/Booking";

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("Dashboard");
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [bookings, setBookings] = useState<IBooking[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { status } = useSession();
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(data);
    } catch (_err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };
  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (_err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  }
  async function fetchBookings() {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data);
    } catch (_err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchRooms();
    fetchUsers();
    fetchBookings();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [router, status]);

  // Handler for deleting a room
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await fetch(`/api/bookings?roomId=${id}`, {
        method: "DELETE",
      });
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
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-2">
          {["Dashboard", "Rooms", "Users"].map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="Dashboard">
          Make changes to your account here.
        </TabsContent>
        <TabsContent value="Rooms">
          <Rooms
            rooms={rooms}
            handleDelete={handleDelete}
            fetchRooms={fetchRooms}
          />
        </TabsContent>
        <TabsContent value="Users">
          <Users users={users} />
        </TabsContent>
      </Tabs>
    </>
  );
}
