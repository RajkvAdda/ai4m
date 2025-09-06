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
import Dashboard from "./dashboard";
import { getMonthFormat, getPreviousAndNextMonths } from "@/lib/utils";

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
            {["Dashboard", "Rooms", "Users"].map((tab) => (
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
          <Dashboard
            rooms={rooms}
            months={months}
            users={users}
            selectedMonth={selectedMonth}
          />
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
