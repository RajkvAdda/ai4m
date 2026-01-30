"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { IRoom, IRoomBooking, RoomBookingZodSchema } from "@/types/room";
import {
  formatTime,
  getDateFormat,
  getTodayDate,
  minutesToTime,
  timeToMinutes,
} from "@/lib/utils";
import { DateSelector } from "./DateGenerator";
// import { formatDate } from "date-fns";
// import { TimeSlotGrid } from "./TimeSlotGrid";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flex } from "@/components/ui/flex";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { se } from "date-fns/locale";
import { H5 } from "@/components/ui/typography";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import z from "zod";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Room({ room }: { room: IRoom }) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [priority, setPriority] = useState("medium");
  const [isLoading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [allBookings, setAllBookings] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [users, setUsers] = useState([]);

  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<z.infer<typeof RoomBookingZodSchema>>({
    resolver: zodResolver(RoomBookingZodSchema),
    defaultValues: {
      name: "",
      roomId: room.id,
      userId: session?.user?.id || "",
      userName: session?.user?.name || "",
      avator: session?.user?.image || "",
      date: selectedDate,
      startTime: selectedSlots[0] || "",
      endTime: selectedSlots[selectedSlots.length - 1] || "",
      remarks: "",
      priority: "medium",
    },
  });

  const remarks = form.watch("remarks");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/roombookings?date=${selectedDate}`);
      const bookings: IRoomBooking[] = await res.json();
      const booked: IRoomBooking[] = [];
      bookings?.data.forEach((b) => {
        if (b?.roomId == room.id) booked.push(b);
      });
      setAllBookings(booked);
    } catch {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };
  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/users?limit=1000");
      const data = await res.json();
      setUsers(data.data || data);
    } catch (_err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  }
  const handleSlotSelect = (slotTime: string) => {
    setSelectedSlots((prevSelectedSlots) => {
      if (prevSelectedSlots.includes(slotTime)) {
        return prevSelectedSlots.filter((s) => s !== slotTime);
      } else {
        return [...prevSelectedSlots, slotTime].sort();
      }
    });
  };
  const handleDeleteBooking = async (bookingIdToDelete: string) => {
    console.log(bookingIdToDelete, "bookingIdToDelete");
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      const res = await fetch(`/api/roombookings/${bookingIdToDelete}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Room Deleted",
          description: data.message,
          variant: "destructive",
        });
      }
      fetchBookings();
    }
  };
  const mergeContinuousSlots = (slots: string[], interval: number) => {
    if (slots.length === 0) return [];

    const merged = [];
    let currentGroup = [slots[0]];

    for (let i = 1; i < slots.length; i++) {
      const lastSlotInGroup = currentGroup[currentGroup.length - 1];
      const currentSlot = slots[i];

      const isContinuous =
        timeToMinutes(currentSlot) ===
        timeToMinutes(lastSlotInGroup) + interval;

      if (isContinuous) {
        currentGroup.push(currentSlot);
      } else {
        merged.push({
          startTime: currentGroup[0],
          endTime: minutesToTime(timeToMinutes(lastSlotInGroup) + interval),
        });
        currentGroup = [currentSlot];
      }
    }

    merged.push({
      startTime: currentGroup[0],
      endTime: minutesToTime(
        timeToMinutes(currentGroup[currentGroup.length - 1]) + interval,
      ),
    });

    return merged;
  };
  async function handleBookingConfirm() {
    if (!selectedSlots) return;
    const mergedSlots = mergeContinuousSlots(
      selectedSlots,
      parseInt(room.minBookingTime, 10),
    );
    let res, data;
    mergedSlots.forEach(async (slotGroup) => {
      try {
        res = await fetch("/api/roombookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: room.id,
            userId: session?.user?.id || "",
            userName: session?.user?.name || "",
            avator: session?.user?.image || "",
            date: selectedDate,
            startTime: slotGroup.startTime,
            endTime: slotGroup.endTime,
            remarks: remarks,
            priority: priority,
          }),
        });
        data = await res.json();
        if (res.ok) {
          toast({
            title: `Booking Confirmed for ${slotGroup.startTime} - ${slotGroup.endTime}`,
            description: data.message,
          });
          form.reset();
          setSelectedSlots([]);
          setPriority("medium");
          fetchBookings();
        } else {
          toast({
            title: `Booking Failed for ${slotGroup.startTime} - ${slotGroup.endTime}`,
            description: data.error
              ? JSON.stringify(data.error)
              : "Failed to create room.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: `Booking Failed for ${slotGroup.startTime} - ${slotGroup.endTime}`,
          description: "Failed to create room.",
          variant: "destructive",
        });
      }
    });

    setSelectedSlots([]);
    setPriority("medium");
  }

  useEffect(() => {
    if (room.id && selectedDate) {
      fetchBookings();
      fetchUsers();
    }
  }, [room.id, selectedDate]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedSlots([]);
  };
  console.log("selectedSlots", { selectedSlots, allBookings });

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex items-center flex-wrap ">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
        </CardHeader>
        <CardContent className="bg-secondary py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
            <TimeSlotGrid
              room={room}
              dailyBookings={allBookings}
              onSlotSelect={(time) => handleSlotSelect(time)}
              selectedSlots={selectedSlots}
              loading={isLoading}
              allUsers={users}
              selectedDate={selectedDate}
              currentUser={users.find((u) => u.id === session?.user?.id)}
              onDeleteBooking={handleDeleteBooking}
            />
            <div className="bg-background p-4 rounded-lg">
              <H5>Confirm Your Booking</H5>
              <p className="text-muted-foreground mb-4">
                You are booking for {selectedDate}
              </p>
              {mergeContinuousSlots(
                selectedSlots,
                parseInt(room.minBookingTime, 10),
              ).map((group, index) => (
                <div
                  className="bg-primary text-primary-foreground p-4 rounded-lg mb-4"
                  key={index}
                >
                  <strong>Slot:</strong> {formatTime(group.startTime)} -{" "}
                  {formatTime(group.endTime)}
                </div>
              ))}
              <Form {...form}>
                <form
                  ref={formRef}
                  onSubmit={form.handleSubmit(handleBookingConfirm)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Reason for booking)</FormLabel>
                        <FormControl>
                          <Input
                            size={40}
                            placeholder="e.g., The Library"
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Label className="mb-1 ">Priority</Label>
                  <Tabs value={priority} onValueChange={(v) => setPriority(v)}>
                    <TabsList>
                      <TabsTrigger className="text-red-500" value="high">
                        High
                      </TabsTrigger>
                      <TabsTrigger className="text-yellow-500" value="medium">
                        Medium
                      </TabsTrigger>
                      <TabsTrigger className="text-green-500" value="low">
                        Low
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    type="submit"
                    className="w-full "
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? "Booking..."
                      : "Confirm Booking"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Alert>
            <AlertCircleIcon />
            <AlertTitle>Usase Info</AlertTitle>
            <AlertDescription>
              <ul className="list-inside list-disc text-sm mt-2">
                <li>You Can Double Click to Book Your Seat</li>
                <li>To Delete You Can Duble Click on Your (Booked seat)</li>
                <li>You can hover on seat and see the booking details</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
    </>
  );
}
