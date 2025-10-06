import React, { useMemo, useRef } from "react";
import { cn, generateColorFromId, getNameFistKey } from "@/lib/utils";
import { formatTime, minutesToTime, timeToMinutes } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { IRoom, IRoomBooking } from "@/types/room";
import { IUser } from "@/types/user";
import { H4, H5 } from "@/components/ui/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Flex } from "@/components/ui/flex";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "low":
      return "#28a745"; // Green
    case "medium":
      return "#ffc107"; // Yellow
    case "high":
      return "#dc3545"; // Red
    default:
      return "transparent";
  }
};

export const TimeSlotGrid = ({
  room,
  dailyBookings,
  onSlotSelect,
  selectedSlots,
  selectedDate,
  allUsers,
  currentUser,
  onDeleteBooking,
  loading,
}: {
  room: IRoom;
  dailyBookings: IRoomBooking[];
  onSlotSelect: (slot: { time: string; span: number }) => void;
  selectedSlots: { time: string; span: number }[];
  selectedDate: string;
  allUsers: IUser[];
  currentUser: IUser;
  loading: boolean;
  onDeleteBooking: (bookingId: string) => void;
}) => {
  const gridRef = useRef(null);

  const displaySlots = useMemo(() => {
    if (!room.startTime || !room.endTime) return [];
    const allPossibleSlots = [];
    const dayStart = timeToMinutes(room.startTime);
    const dayEnd = timeToMinutes(room.endTime);
    const interval = parseInt(room.minBookingTime, 10);
    const now = new Date();

    for (let slotStart = dayStart; slotStart < dayEnd; slotStart += interval) {
      const slotTime = minutesToTime(slotStart);
      let bookingDetails = null;
      let status = "available";

      for (const booking of dailyBookings) {
        if (
          slotStart >= timeToMinutes(booking.startTime) &&
          slotStart < timeToMinutes(booking.endTime)
        ) {
          bookingDetails = booking;
          status = "booked";
          break;
        }
      }

      if (status === "available") {
        const slotDateTime = new Date(selectedDate);
        const [hour, minute] = slotTime.split(":").map(Number);
        slotDateTime.setHours(hour, minute, 0, 0);
        if (slotDateTime < now) {
          status = "expired";
        }
      }

      allPossibleSlots.push({
        time: slotTime,
        status,
        booking: bookingDetails,
      });
    }

    const groupedSlots = [];
    let i = 0;
    while (i < allPossibleSlots.length) {
      const currentSlot = allPossibleSlots[i];
      if (
        currentSlot.status === "available" ||
        currentSlot.status === "expired"
      ) {
        groupedSlots.push({ ...currentSlot, span: 1 });
        i++;
        continue;
      }

      let span = 1;
      let j = i + 1;
      while (
        j < allPossibleSlots.length &&
        allPossibleSlots[j].status === "booked" &&
        // allPossibleSlots[j].booking.userId === currentSlot.booking.userId &&
        // allPossibleSlots[j].booking.priority === currentSlot.booking.priority &&
        allPossibleSlots[j].booking?._id === currentSlot.booking._id
      ) {
        span++;
        j++;
      }
      groupedSlots.push({ ...currentSlot, span });
      i += span;
    }

    return groupedSlots;
  }, [room, dailyBookings, selectedDate]);

  const handleSlotClick = (slot) => {
    if (slot.status === "booked" || slot.status === "expired") return;
    onSlotSelect(slot.time);
  };

  return (
    <div className="p-4">
      <div className="mb-5">
        <H4>Available Slots</H4>
      </div>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4"
        ref={gridRef}
      >
        {displaySlots.map((slot) => {
          const bookingUser = slot.booking
            ? allUsers.find((u) => u.id === slot.booking.userId)
            : null;

          let slotStyle = {};
          let tooltip = "";

          if (bookingUser) {
            slotStyle = {
              backgroundColor: generateColorFromId(bookingUser.id),
              color: "#4a3f35",
              fontWeight: "500",
              borderLeft: `5px solid ${getPriorityColor(
                slot.booking.priority
              )}`,
            };
          }

          if (slot.status === "expired") tooltip = "This time slot has passed";
          else if (slot.status === "available") {
            const endTime = minutesToTime(
              timeToMinutes(slot.time) + parseInt(room.minBookingTime, 10)
            );
            tooltip = `${formatTime(slot.time)} - ${formatTime(endTime)}`;
          } else if (slot.status === "booked" && bookingUser) {
            tooltip = slot.booking.remarks || "Slot booked";
          }

          const isBookedOrExpired =
            slot.status === "booked" || slot.status === "expired";

          const content =
            slot.status === "booked" && bookingUser ? (
              <Flex className="relative w-full items-center gap-2 flex-1 min-w-0">
                <Avatar
                  color="bg-blue-200"
                  className="h-12 w-12 rounded-lg m-1"
                >
                  <AvatarImage
                    src={bookingUser.avator}
                    alt={bookingUser.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    <H5>{getNameFistKey(bookingUser.name)}</H5>
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <strong className="truncate block">{bookingUser.name}</strong>
                  <small className="truncate block">
                    {formatTime(slot.booking.startTime)} -{" "}
                    {formatTime(slot.booking.endTime)}
                  </small>
                </div>

                {currentUser?.id === bookingUser.id && (
                  <div
                    className="absolute top-0 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBooking(slot.booking._id);
                    }}
                    title="Cancel this booking"
                  >
                    <XIcon size={16} color="red" />
                  </div>
                )}
              </Flex>
            ) : (
              <div className="text-center truncate">
                {formatTime(slot.time)}
              </div>
            );

          return (
            <div
              key={slot.time}
              className={cn(
                "flex-none basis-24 md:basis-28 flex items-center justify-center overflow-hidden h-[70px] text-center border-2 rounded-lg text-sm group",
                slot.status === "expired" &&
                  "cursor-not-allowed opacity-50 bg-gray-100",
                slot.status === "available" && "cursor-pointer bg-green-100",
                selectedSlots.includes(slot.time) && "bg-green-300",
                !selectedSlots.includes(slot.time) &&
                  slot.status === "available" &&
                  "hover:bg-green-200",
                loading && "cursor-not-allowed animate-caret-blink"
              )}
              style={{ gridColumn: `span ${slot.span || 1}`, ...slotStyle }}
              onClick={() => handleSlotClick(slot)}
            >
              <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
};
