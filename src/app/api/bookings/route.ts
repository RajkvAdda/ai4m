import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Booking, BookingZodSchema } from "./BookingModal";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const date = searchParams.get("date");

    let query: any = {};
    if (roomId) query.roomId = roomId;
    if (date) query.startDate = date;

    const bookings = await Booking.find(query).exec();
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
    const result = BookingZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    await connectToDatabase();
    const newBooking = new Booking(result.data);
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
