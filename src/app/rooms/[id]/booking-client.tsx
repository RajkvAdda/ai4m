"use client";
import { useEffect, useMemo, useState } from "react";
import { IRoom, IRoomBooking } from "@/types/room";
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
import { Label } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { se } from "date-fns/locale";

export default function Room({ room }: { room: IRoom }) {
  const { data: session } = useSession();

  const [remarks, setRemarks] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isLoading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [allBookings, setAllBookings] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const refreshBookings = () => {
    const storedBookings = JSON.parse(localStorage.getItem("bookings")) || [];
    setAllBookings(storedBookings);
  };
  const handleSlotSelect = (slotTime: string) => {
    setSelectedSlots((prevSelectedSlots) => {
      if (prevSelectedSlots.includes(slotTime)) {
        return prevSelectedSlots.filter((s) => s !== slotTime);
      } else {
        return [...prevSelectedSlots, slotTime].sort();
      }
    });
  };
  const handleDeleteBooking = (bookingIdToDelete: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      const currentBookings =
        JSON.parse(localStorage.getItem("bookings")) || [];
      const updatedBookings = currentBookings.filter(
        (booking) => booking.bookingId !== bookingIdToDelete
      );
      localStorage.setItem("bookings", JSON.stringify(updatedBookings));
      refreshBookings();
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
        timeToMinutes(currentGroup[currentGroup.length - 1]) + interval
      ),
    });

    return merged;
  };
  const handleBookingConfirm = (e) => {
    e.preventDefault();
    if (!selectedSlots) return;
    const mergedSlots = mergeContinuousSlots(
      selectedSlots,
      parseInt(room.minBookingTime, 10)
    );

    const newBookings = mergedSlots.map((slotGroup) => ({
      roomId: roomDetail.id,
      userId: user.id,
      date: selectedDate,
      startTime: slotGroup.startTime,
      endTime: slotGroup.endTime,
      remarks: remarks,
      priority: priority,
    }));

    const currentBookings = JSON.parse(localStorage.getItem("bookings")) || [];
    localStorage.setItem(
      "bookings",
      JSON.stringify([...currentBookings, ...newBookings])
    );
    toast.success("Booking successful!");
    refreshBookings();
    setSelectedSlots([]);
    setRemarks("");
    setPriority("medium");
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/roombookings?date=${selectedDate}`);
      const bookings: IRoomBooking[] = await res.json();
      const booked: IRoomBooking[] = [];
      bookings.forEach((b) => {
        if (b?.roomId == room.id) booked.push(b);
      });
      setAllBookings(booked);
    } catch {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (room.id && selectedDate) fetchBookings();
  }, [room.id, selectedDate]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedSlots([]);
  };

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
          <div className="grid grid-cols-[3fr_1fr] gap-4">
            <TimeSlotGrid
              room={room}
              dailyBookings={allBookings}
              onSlotSelect={handleSlotSelect}
              selectedSlots={selectedSlots}
              allUsers={[]}
              selectedDate={selectedDate}
              currentUser={session?.user}
              onDeleteBooking={handleDeleteBooking}
            />
            <div className="bg-background p-4 rounded-lg">
              <h5>Confirm Your Booking</h5>
              <p className="text-muted small">
                You are booking for {selectedDate}
              </p>
              {mergeContinuousSlots(
                selectedSlots,
                parseInt(room.minBookingTime, 10)
              ).map((group, index) => (
                <div className="alert alert-primary" key={index}>
                  <strong>Slot:</strong> {formatTime(group.startTime)} -{" "}
                  {formatTime(group.endTime)}
                </div>
              ))}{" "}
              {/* <Form onSubmit={handleBookingConfirm} className="mt-3">
                <InputField
                  as="textarea"
                  label="Remarks (Reason for booking)"
                  name="remarks"
                  rows="2"
                  value={remarks}
                  onChange={(e, value) => setRemarks(value)}
                  required
                />{" "}
                <div className="mt-3">
                  <Label>Priority:</Label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="priority"
                        id="priorityLow"
                        value="low"
                        checked={priority === "low"}
                        onChange={(e) => setPriority(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="priorityLow">
                        Low
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="priority"
                        id="priorityMedium"
                        value="medium"
                        checked={priority === "medium"}
                        onChange={(e) => setPriority(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="priorityMedium"
                      >
                        Medium
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="priority"
                        id="priorityHigh"
                        value="high"
                        checked={priority === "high"}
                        onChange={(e) => setPriority(e.target.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="priorityHigh"
                      >
                        High
                      </label>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="custom-btn w-100"
                    disabled={selectedSlots.length <= 0}
                  >
                    Confirm Booking for this Slot
                  </Button>
                </div>
              </Form> */}
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
