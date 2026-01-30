"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Rooms from "./(rooms)/rooms";
import Users from "./users";
// import SeatDashboard from "./(seats)/seat-dashboard";
import SeatDashboard from "./seat-booking/seatbooking-dashboad";
import { getMonthFormat, getPreviousAndNextMonths } from "@/lib/utils";
import Seats from "./(seats)/seats";
import { IRoom } from "@/types/room";
import { ISeat } from "@/types/seat";
import { IUser } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("Seat Booking");
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [seats, setSeats] = useState<ISeat[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { status } = useSession();

  // Fetch all data in parallel
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [roomsRes, seatsRes, usersRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/seats"),
        fetch("/api/users?limit=1000"),
      ]);

      const [roomsData, seatsData, usersData] = await Promise.all([
        roomsRes.json(),
        seatsRes.json(),
        usersRes.json(),
      ]);

      setRooms(roomsData);
      setSeats(seatsData);
      setUsers(usersData.data || usersData);
    } catch (_err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [router, status]);

  // Handler for deleting a room
  const handleRoomDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await fetch(`/api/roombookings?roomId=${id}`, {
        method: "DELETE",
      });
      const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Room Deleted",
          description: data.message,
          variant: "destructive",
        });
        setRooms((prev) => prev.filter((room) => room._id !== id));
      } else {
        toast({
          title: "Failed to delete room",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (_err) {
      toast({
        title: "Error",
        description: "Error deleting room",
        variant: "destructive",
      });
    }
  };

  const handleSeatDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this seat?")) return;
    try {
      await fetch(`/api/seatbookings?seatId=${id}`, {
        method: "DELETE",
      });
      const res = await fetch(`/api/seats/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
        setSeats((prev) => prev.filter((seat) => seat._id !== id));
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete seat",
          variant: "destructive",
        });
      }
    } catch (_err) {
      toast({
        title: "Error",
        description: "Error deleting seat",
        variant: "destructive",
      });
    }
  };

  const months = getPreviousAndNextMonths();
  const [selectedMonth, setSelectedMonth] = React.useState(
    getMonthFormat(months[1]),
  );

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
        <div className="flex flex-wrap gap-2 items-center justify-between mb-3 sm:mb-4 overflow-x-auto">
          <TabsList className="w-max sm:w-auto">
            {["Seat Booking", "Rooms", "Seats", "Users"].map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="Seat Booking">
          <SeatDashboard
            seats={seats}
            months={months}
            users={users}
            selectedMonth={selectedMonth}
          />
        </TabsContent>
        <TabsContent value="Rooms">
          <Rooms
            rooms={rooms}
            handleDelete={handleRoomDelete}
            fetchRooms={fetchAllData}
          />
        </TabsContent>
        <TabsContent value="Seats">
          <Seats
            seats={seats}
            handleDelete={handleSeatDelete}
            fetchSeats={fetchAllData}
          />
        </TabsContent>
        <TabsContent value="Users">
          <Users users={users} />
        </TabsContent>
      </Tabs>
    </>
  );
}
