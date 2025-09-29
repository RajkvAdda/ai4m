import React, { useEffect, useRef } from "react";
import { useMemo } from "react";
import { cn, generateColorFromId, getNameFistKey } from "@/lib/utils";
import { formatTime, minutesToTime, timeToMinutes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ClosedCaption, TicketMinus, XIcon } from "lucide-react";
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
      return "#ffc107"; // Orange/Yellow
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
        status: status,
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
        allPossibleSlots[j].booking.userId === currentSlot.booking.userId &&
        allPossibleSlots[j].booking.priority === currentSlot.booking.priority
      ) {
        span++;
        j++;
      }
      groupedSlots.push({ ...currentSlot, span: span });
      i += span;
    }
    return groupedSlots;
  }, [room, dailyBookings, selectedDate]);
  // useEffect(() => {
  //   if (!gridRef.current) return;

  //   const tooltipTriggerList = Array.from(
  //     gridRef.current.querySelectorAll('[data-bs-toggle="tooltip"]')
  //   );

  //   const tooltipList = tooltipTriggerList.map(
  //     (tooltipTriggerEl) =>
  //       new Tooltip(tooltipTriggerEl, {
  //         trigger: "hover",
  //         container: "body",
  //       })
  //   );

  //   return () => {
  //     tooltipList.forEach((tooltip) => tooltip.dispose());
  //   };
  // }, [displaySlots]);
  const handleSlotClick = (slot) => {
    if (slot.status === "booked" || slot.status === "expired") return;

    onSlotSelect(slot.time);
  };
  console.log("displaySlots", displaySlots);
  return (
    <div className="grid gap-4">
      <H4>Available Slots</H4>
      <div className="grid grid-cols-6 gap-4" ref={gridRef}>
        {displaySlots.map((slot) => {
          let tooltip = "";
          let slotStyle = {};
          const bookingUser = slot.booking
            ? allUsers.find((u) => u.id === slot.booking.userId)
            : null;

          if (bookingUser) {
            const priorityColor = getPriorityColor(slot.booking.priority);
            slotStyle = {
              backgroundColor: generateColorFromId(bookingUser.id),
              color: "#4a3f35",
              fontWeight: "500",
              borderLeft: `5px solid ${priorityColor}`,
            };
          }

          if (slot.status === "expired") {
            tooltip = "This time slot has passed";
          } else if (slot.status === "available") {
            const endTimeString = minutesToTime(
              timeToMinutes(slot.time) + parseInt(room.minBookingTime, 10)
            );
            tooltip = `${formatTime(slot.time)} - ${formatTime(endTimeString)}`;
          } else if (slot.status === "booked" && bookingUser) {
            tooltip = slot?.booking?.remarks || "slot has been booked";
          }

          const isBookedOrExpired =
            slot.status === "booked" || slot.status === "expired";

          const content =
            slot.status === "booked" && bookingUser ? (
              <div className="w-full">
                <div>
                  <Flex>
                    <Avatar
                      color="bg-blue-200"
                      className="h-12 w-12 rounded-lg"
                    >
                      <AvatarImage
                        src={bookingUser.avator}
                        alt={bookingUser.name}
                      />
                      <AvatarFallback className="rounded-lg">
                        <H5>{getNameFistKey(bookingUser.name)}</H5>
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <strong>{bookingUser.name}</strong>
                      <br />
                      <small>
                        {formatTime(slot.booking.startTime)} -{" "}
                        {formatTime(slot.booking.endTime)}
                      </small>
                    </div>
                  </Flex>
                </div>
                {currentUser && currentUser.id === bookingUser.id && (
                  <div
                    className="absolute top-0 right-0 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-colors duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBooking(slot?.booking?._id);
                    }}
                    title="Cancel this booking"
                  >
                    <XIcon size={16} color="red" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">{formatTime(slot.time)}</div>
            );

          return isBookedOrExpired ? (
            <div
              key={slot.time}
              className={cn(
                `group h-full min-h-[70px] text-center border-2 flex items-center pl-3 rounded-lg relative`,
                loading && "cursor-not-allowed animate-caret-blink",
                slot.status === "expired" ? "justify-center" : "justify-start"
              )}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              data-bs-custom-class="custom-tooltip"
              data-bs-title={slot.booking?.remarks || "Slot Has Expired"}
              style={{ gridColumn: `span ${slot.span || 1}`, ...slotStyle }}
            >
              <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div
              key={slot.time}
              className={cn(
                `h-full min-h-[70px] text-center border-2 border-green-200 bg-green-50  cursor-pointer flex items-center justify-center rounded-lg`,
                selectedSlots.includes(slot.time)
                  ? "bg-green-200 "
                  : "hover:bg-green-100",
                loading && "cursor-not-allowed animate-caret-blink"
              )}
              onClick={() => handleSlotClick(slot)}
              // data-bs-toggle="tooltip"
              // data-bs-placement="top"
              // data-bs-custom-class="custom-tooltip"
              // data-bs-title={tooltip}
              style={{ gridColumn: `span ${slot.span || 1}`, ...slotStyle }}
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
