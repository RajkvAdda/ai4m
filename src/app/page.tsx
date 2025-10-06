"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import UserAvator from "@/components/user-avator";
import { ArrowRight, PanelsRightBottomIcon, Table } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import seatBookingBg from "@/assets/images/seatbooking.png";
import meetingRoomBg from "@/assets/images/MeetingRoomBg.png";
const bookingOptions = [
  {
    title: "Meeting Room Booking",
    description: "Discover and book rooms in our beautiful campus.",
    href: "/rooms",
    Icon: PanelsRightBottomIcon,
    backgroundImage: `url(${meetingRoomBg.src})`,
  },
  {
    title: "Seat Booking",
    description: "Book your individual seat in our shared spaces.",
    href: "/seats",
    Icon: Table,
    backgroundImage: `url(${seatBookingBg.src})`,
  },
];

export default function Main() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [router, status]);

  return (
    <div className="container p-8 m-auto">
      <Alert className="mb-8 border-primary/50 text-primary flex flex-wrap items-center justify-center gap-5">
        <UserAvator
          discription={"Choose your preference of booking room or seat."}
        />
        <div className="flex-1"></div>
        <div>
          <Button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            variant="destructive"
            className="sm:w-auto w-full"
          >
            Logout
          </Button>
        </div>
      </Alert>

      <div
        className="flex flex-col md:flex-row rounded-xl overflow-hidden  gap-5 "
        style={{ minHeight: "60vh" }}
      >
        {bookingOptions.map((option) => (
          <div
            key={option.title}
            className="group relative w-full md:w-1/2 p-8 flex flex-col items-center justify-center text-center text-white overflow-hidden"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transform transition-all rounded duration-500 ease-in-out group-hover:scale-110"
              style={{ backgroundImage: option.backgroundImage }}
            />
            <div className="absolute inset-0 bg-black/60 transition-all duration-300 group-hover:bg-black/50" />

            <div className="relative z-10">
              <option.Icon className="h-12 w-12 mx-auto mb-4 text-white/80" />
              <h2 className="text-3xl font-bold mb-2">{option.title}</h2>
              <p className="text-white/90 mb-6">{option.description} </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-200"
              >
                <Link href={option.href}>
                  Select Option <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
