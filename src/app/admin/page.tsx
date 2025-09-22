"use client";

import React, { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IRoom } from "@/modals/(Room)/Room";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Rooms from "./(rooms)/rooms";
import Users from "./users";
import { IUser } from "../users/[id]/page";
import SeatDashboard from "./(seats)/seat-dashboard";
import RoomDashboard from "./(rooms)/room-dashboard";
import { getMonthFormat, getPreviousAndNextMonths } from "@/lib/utils";
import Seats from "./(seats)/seats";
import { ISeatBooking } from "@/modals/(Seat)/SeatBooking";
import { ISeat } from "@/modals/(Seat)/Seat";
import { IRoomBooking } from "@/modals/(Room)/RoomBooking";

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("Dashboard");
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [seats, setSeats] = useState<ISeat[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [seatBookings, setSeatBookings] = useState<ISeatBooking[]>([]);
  const [roomBookings, setRoomBookings] = useState<IRoomBooking[]>([]);

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
  const fetchSeats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seats");
      const data = await res.json();
      setSeats(data);
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
  async function fetchRoomBookings() {
    try {
      setLoading(true);
      const res = await fetch("/api/roombookings");
      const data = await res.json();
      setRoomBookings(data);
    } catch (_err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  }
  async function fetchSeatBookings() {
    try {
      setLoading(true);
      const res = await fetch("/api/seatbookings");
      const data = await res.json();
      setSeatBookings(data);
    } catch (_err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchUsers();
    fetchRooms();
    fetchSeats();
    fetchRoomBookings();
    fetchSeatBookings();
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
        alert(data.message);
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

  const handleSeatDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this seat?")) return;
    try {
      await fetch(`/api/seatbookings?seatId=${id}`, {
        method: "DELETE",
      });
      const res = await fetch(`/api/seats/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSeats((prev) =>
          prev.filter((seat) => seat._id !== id && seat.id !== id)
        );
      } else {
        alert(data.error || "Failed to delete seat");
      }
    } catch (_err) {
      alert("Error deleting seat");
    }
  };

  const months = getPreviousAndNextMonths();
  const [selectedMonth, setSelectedMonth] = React.useState(
    getMonthFormat(months[1])
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
        <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
          <TabsList>
            {["Dashboard", "Rooms", "Seats", "Users"].map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <div>
            {activeTab === "Dashboard" && (
              <Tabs value={selectedMonth} onValueChange={setSelectedMonth}>
                <TabsList>
                  {months.map((month) => (
                    <TabsTrigger
                      key={month.getTime()}
                      value={getMonthFormat(month)}
                    >
                      {getMonthFormat(month)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>
        <TabsContent value="Dashboard">
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
            fetchRooms={fetchRooms}
          />
        </TabsContent>
        <TabsContent value="Seats">
          <Seats
            seats={seats}
            handleDelete={handleSeatDelete}
            fetchSeats={fetchSeats}
          />
        </TabsContent>
        <TabsContent value="Users">
          <Users users={users} />
        </TabsContent>
      </Tabs>
    </>
  );
}
