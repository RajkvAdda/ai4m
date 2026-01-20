import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SeatBooking } from "@/modals/(Seat)/SeatBooking";
import { SeatBookingZodSchema } from "@/types/seat";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const seatId = searchParams.get("seatId");
    const date = searchParams.get("date");

    const query: Record<string, unknown> = {};
    if (seatId) query.seatId = seatId;
    if (date) query.startDate = date;
    if (searchParams.get("userId")) query.userId = searchParams.get("userId");
    if (searchParams.get("fromDate") && searchParams.get("toDate")) {
      query.startDate = { $gte: searchParams.get("fromDate") };
      query.endDate = { $lte: searchParams.get("toDate") };
    }
    if (searchParams.get("startDate")) {
      query.startDate = { $eq: searchParams.get("startDate") };
    }

    const bookings = await SeatBooking.find(query).exec();
    return NextResponse.json(bookings);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = SeatBookingZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    await connectToDatabase();
    const newBooking = new SeatBooking(result.data);
    await newBooking.save();

    return NextResponse.json({
      message: "Booking created successfully",
      id: newBooking._id,
    });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (roomId) query.roomId = roomId;

    const bookings = await SeatBooking.deleteMany(query).exec();
    return NextResponse.json(bookings);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
