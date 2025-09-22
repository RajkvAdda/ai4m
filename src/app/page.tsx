"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import UserAvator from "@/components/user-avator";
import { ArrowRight, PanelsRightBottomIcon, Table } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

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
      <div className="space-y-5">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-2xl">
                  Rooms Booking
                </CardTitle>
                <div className="p-2 opacity-30 rounded-lg">
                  <PanelsRightBottomIcon />
                </div>
              </div>
              <CardDescription>
                Discover and book rooms in our beautiful campus.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium text-muted-foreground">
                    Availability
                  </p>
                  <p className="text-lg font-semibold">
                    {/* {availableSeats}
                <span className="text-sm font-normal text-muted-foreground">
                  /{totalCapacity} Seats
                </span> */}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="default">
                <Link href={`/rooms`}>
                  View & Book Room
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="flex flex-col transition-transform transform hover:-translate-y-1 hover:shadow-xl duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-2xl">
                  Seat Booking
                </CardTitle>
                <div className="p-2 opacity-30 rounded-lg">
                  <Table />
                </div>
              </div>
              <CardDescription>
                Book your seat in our beautiful campus.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-medium text-muted-foreground">
                    Availability
                  </p>
                  <p className="text-lg font-semibold">
                    {/* {availableSeats}
                <span className="text-sm font-normal text-muted-foreground">
                  /{totalCapacity} Seats
                </span> */}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="default">
                <Link href={`/seats`}>
                  View & Book Seat <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
