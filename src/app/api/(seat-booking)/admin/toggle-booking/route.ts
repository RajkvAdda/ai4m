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
    const { userId, date } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: "User ID and date are required" },
        { status: 400 },
      );
    }

    // Check if booking exists
    const existingBooking = await SeatBooking.findOne({
      userId,
      startDate: date,
      endDate: date,
    });

    if (existingBooking) {
      // Delete the booking (unbook)
      await SeatBooking.deleteOne({ _id: existingBooking._id });
      return NextResponse.json({
        message: "Booking cancelled",
        action: "cancelled",
      });
    } else {
      // Create new booking
      const user = await User.findOne({ id: userId });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get all seats and check capacity
      const seats = await Seat.find();
      const totalCapacity = seats.reduce((sum, seat) => {
        return sum + seat.units * seat.seatsPerUnit;
      }, 0);

      // Check existing bookings for this date
      const existingBookings = await SeatBooking.find({
        startDate: date,
        endDate: date,
      }).lean<SeatBookingDocument[]>();

      if (existingBookings.length >= totalCapacity) {
        return NextResponse.json(
          { error: "No seats available for this date" },
          { status: 400 },
        );
      }

      // Find available seat
      const seatPool: { seatId: string; seatNumber: number }[] = [];
      for (const seat of seats) {
        const totalSeats = seat.units * seat.seatsPerUnit;
        for (let i = 1; i <= totalSeats; i++) {
          seatPool.push({
            seatId: seat._id.toString(),
            seatNumber: i,
          });
        }
      }

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

      if (!assignedSeat) {
        return NextResponse.json(
          { error: "No seats available" },
          { status: 400 },
        );
      }

      const newBooking = new SeatBooking({
        seatId: assignedSeat.seatId,
        seatNumber: assignedSeat.seatNumber,
        userId: user.id,
        userName: user.name,
        avator: user.avator || "",
        startDate: date,
        endDate: date,
        status: "booked_by_admin",
      });

      await newBooking.save();

      return NextResponse.json({
        message: "Booking created",
        action: "booked",
        booking: newBooking,
      });
    }
  } catch (error) {
    console.error("Toggle booking error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
