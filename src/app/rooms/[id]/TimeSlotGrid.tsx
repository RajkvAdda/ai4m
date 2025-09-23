import React, { useEffect, useRef } from "react";
import { useMemo } from "react";
import { generateColorFromId } from "@/lib/utils";
import { formatTime, minutesToTime, timeToMinutes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TicketMinus } from "lucide-react";
import { IRoom, IRoomBooking } from "@/types/room";
import { IUser } from "@/types/user";
import { H4 } from "@/components/ui/typography";

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
}: {
  room: IRoom;
  dailyBookings: IRoomBooking[];
  onSlotSelect: (slot: { time: string; span: number }) => void;
  selectedSlots: { time: string; span: number }[];
  selectedDate: string;
  allUsers: IUser[];
  currentUser: IUser;
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

  return (
    <div className="grid gap-4">
      <H4>Available Slots</H4>
      <div className="grid grid-cols-6 gap-4" ref={gridRef}>
        {displaySlots.map((slot) => {
          let statusClass = `slot-${slot.status}`;
          if (selectedSlots.includes(slot.time)) {
            statusClass = "slot-selected";
          }
          if (slot.status === "expired") {
            statusClass = "slot-booked";
          }

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
          } else if (slot.status === "expired") {
            tooltip = "This time slot has passed";
          } else if (slot.status === "available") {
            const endTimeString = minutesToTime(
              timeToMinutes(slot.time) + parseInt(room.minBookingTime, 10)
            );
            tooltip = `${formatTime(slot.time)} - ${formatTime(endTimeString)}`;
          }

          const isBookedOrExpired =
            slot.status === "booked" || slot.status === "expired";

          const content =
            slot.status === "booked" && bookingUser ? (
              <div className="merged-slot">
                <div className="d-flex justify-content-between align-items-start w-100">
                  <div>
                    <strong>{bookingUser.name}</strong>
                    <br />
                    <small>
                      {formatTime(slot.booking.startTime)} -{" "}
                      {formatTime(slot.booking.endTime)}
                    </small>
                  </div>
                  {currentUser && currentUser.id === bookingUser.id && (
                    <Button
                      variant="link"
                      className="text-danger p-0 delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBooking(slot.booking.bookingId);
                      }}
                      title="Cancel this booking"
                    >
                      <TicketMinus />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              formatTime(slot.time)
            );

          return isBookedOrExpired ? (
            <div
              key={slot.time}
              className={`h-fit min-h-[70px] text-center border-2 flex items-center justify-center rounded-lg `}
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              data-bs-custom-class="custom-tooltip"
              data-bs-title={slot.booking?.remarks || "Slot Has Expired"}
              style={{ gridColumn: `span ${slot.span || 1}`, ...slotStyle }}
            >
              {content}
            </div>
          ) : (
            <div
              key={slot.time}
              className={`h-fit min-h-[70px] text-center border-2 bg-slate-100 hover:bg-slate-200 cursor-pointer flex items-center justify-center rounded-lg `}
              onClick={() => handleSlotClick(slot)}
              // data-bs-toggle="tooltip"
              // data-bs-placement="top"
              // data-bs-custom-class="custom-tooltip"
              // data-bs-title={tooltip}
              style={{ gridColumn: `span ${slot.span || 1}`, ...slotStyle }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};
