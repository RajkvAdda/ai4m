import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SeatBooking } from "@/modals/(Seat)/SeatBooking";
import { Seat } from "@/modals/(Seat)/Seat";
import { User } from "@/modals/User";

interface SeatBookingDocument {
  _id: string;
  seatId: string;
  seatNumber: number;
  userId: string;
  userName: string;
  avator: string;
  startDate: string;
  endDate: string;
  status: string;
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userIds, weekdays, startDate, endDate } = body;

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "User IDs are required" },
        { status: 400 },
      );
    }

    // Get all users
    const users = await User.find({ id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: "Some users not found" },
        { status: 404 },
      );
    }

    // Get all seats
    const seats = await Seat.find();
    if (seats.length === 0) {
      return NextResponse.json(
        { error: "No seats available" },
        { status: 404 },
      );
    }

    // Calculate total capacity
    const totalCapacity = seats.reduce((sum, seat) => {
      return sum + seat.units * seat.seatsPerUnit;
    }, 0);

    const bookings = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate dates based on configuration
    const datesToBook: Date[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDayName = dayNames[dayOfWeek];

      let shouldBook = false;

      // Check if it's a weekend (skip by default)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Calculate week number from start date (1-indexed)
      // Get ISO week number for the current year
      const yearStart = new Date(currentDate.getFullYear(), 0, 1);
      const daysSinceYearStart = Math.floor(
        (currentDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      const weekNumber = Math.ceil(
        (daysSinceYearStart + yearStart.getDay() + 1) / 7,
      );

      const isOddWeek = weekNumber % 2 === 1;
      const isEvenWeek = weekNumber % 2 === 0;

      // Case 1: Odd Wednesday booking
      if (
        weekdays &&
        weekdays.includes("Wed_odd") &&
        currentDayName === "Wed" &&
        isOddWeek
      ) {
        shouldBook = true;
      }
      // Case 2: Even Wednesday booking
      else if (
        weekdays &&
        weekdays.includes("Wed_even") &&
        currentDayName === "Wed" &&
        isEvenWeek
      ) {
        shouldBook = true;
      }
      // Case 3: Regular weekday booking (not Wed_odd or Wed_even)
      else if (
        weekdays &&
        weekdays.length > 0 &&
        weekdays.includes(currentDayName)
      ) {
        shouldBook = true;
      }

      if (shouldBook) {
        datesToBook.push(new Date(currentDate));
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // For each date, book seats for users
    const seatPool: { seatId: string; seatNumber: number }[] = [];

    // Create seat pool
    for (const seat of seats) {
      const totalSeats = seat.units * seat.seatsPerUnit;
      for (let i = 1; i <= totalSeats; i++) {
        seatPool.push({
          seatId: seat._id.toString(),
          seatNumber: i,
        });
      }
    }

    for (const date of datesToBook) {
      const dateStr = date.toISOString().split("T")[0];

      // Check existing bookings for this date
      const existingBookings = await SeatBooking.find({
        startDate: dateStr,
        endDate: dateStr,
      }).lean<SeatBookingDocument[]>();

      const bookedSeats = existingBookings.length;
      const availableCapacity = totalCapacity - bookedSeats;

      if (availableCapacity < userIds.length) {
        // Not enough capacity for this date
        continue;
      }

      // Assign seats to users for this date
      for (let i = 0; i < users.length; i++) {
        const user = users[i];

        // Check if user already has a booking for this date
        const existingUserBooking = await SeatBooking.findOne({
          userId: user.id,
          startDate: dateStr,
          endDate: dateStr,
        });

        if (existingUserBooking) {
          continue; // Skip if already booked
        }

        // Find available seat
        let assignedSeat = null;
        for (const seat of seatPool) {
          const isOccupied = existingBookings.some(
            (b) => b.seatId === seat.seatId && b.seatNumber === seat.seatNumber,
          );

          if (!isOccupied) {
            assignedSeat = seat;
            break;
          }
        }

        if (assignedSeat) {
          const booking = {
            seatId: assignedSeat.seatId,
            seatNumber: assignedSeat.seatNumber,
            userId: user.id,
            userName: user.name,
            avator: user.avator || "",
            startDate: dateStr,
            endDate: dateStr,
            status: "booked_by_admin",
          };

          bookings.push(booking);
          existingBookings.push(booking as SeatBookingDocument);
        }
      }
    }

    // Save all bookings
    if (bookings.length > 0) {
      await SeatBooking.insertMany(bookings);
    }

    return NextResponse.json({
      message: "Bulk booking completed successfully",
      bookingsCreated: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Bulk booking error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
