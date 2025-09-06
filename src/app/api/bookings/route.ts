import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Booking, BookingZodSchema } from "@/modals/Booking";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const date = searchParams.get("date");

    const query: Record<string, unknown> = {};
    if (roomId) query.roomId = roomId;
    if (date) query.startDate = date;
    if (searchParams.get("userId")) query.userId = searchParams.get("userId");
    if (searchParams.get("fromDate") && searchParams.get("toDate")) {
      query.startDate = { $gte: searchParams.get("fromDate") };
      query.endDate = { $lte: searchParams.get("toDate") };
    }

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (roomId) query.roomId = roomId;

    const bookings = await Booking.deleteMany(query).exec();
    return NextResponse.json(bookings);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
