import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SeatBooking } from "@/modals/(Seat)/SeatBooking";
import { User } from "@/modals/User";

interface BookingData {
  _id: string;
  seatId: string;
  seatNumber: number;
  status: string;
  userId: string;
  startDate: string;
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 },
      );
    }

    // Get all users
    const users = await User.find({}).sort({ name: 1 });

    // Get all bookings in date range
    const bookings = await SeatBooking.find({
      startDate: { $gte: startDate, $lte: endDate },
    }).lean<BookingData[]>();

    // Generate date range
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    // Create booking map: userId -> date -> booking
    const bookingMap: Record<string, Record<string, BookingData | null>> = {};

    users.forEach((user) => {
      bookingMap[user.id] = {};
      dates.forEach((date) => {
        bookingMap[user.id][date] = null;
      });
    });

    bookings.forEach((booking) => {
      if (bookingMap[booking.userId]) {
        bookingMap[booking.userId][booking.startDate] = booking;
      }
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avator: u.avator,
      })),
      dates,
      bookingMap,
    });
  } catch (error) {
    console.error("Get bookings calendar error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
