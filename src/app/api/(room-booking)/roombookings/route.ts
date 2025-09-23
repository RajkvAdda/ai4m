import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RoomBooking } from "@/modals/(Room)/RoomBooking";
import { RoomBookingZodSchema } from "@/types/room";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const date = searchParams.get("date");

    const query: Record<string, unknown> = {};
    if (roomId) query.roomId = roomId;
    if (date) query.date = date;
    if (searchParams.get("userId")) query.userId = searchParams.get("userId");

    const roomBookings = await RoomBooking.find(query).exec();
    return NextResponse.json(roomBookings);
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
    const result = RoomBookingZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    await connectToDatabase();
    const newRoomBooking = new RoomBooking(result.data);
    await newRoomBooking.save();

    return NextResponse.json({
      message: "RoomBooking created successfully",
      id: newRoomBooking._id,
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

    const roomBookings = await RoomBooking.deleteMany(query).exec();
    return NextResponse.json(roomBookings);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
