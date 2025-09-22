import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Types } from "mongoose";
import { RoomBooking, RoomBookingZodSchema } from "@/modals/(Room)/RoomBooking";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }
    await connectToDatabase();
    const roomBooking = await RoomBooking.findById(id);
    if (!roomBooking) {
      return NextResponse.json(
        { error: "RoomBooking not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(roomBooking);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const result = RoomBookingZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await connectToDatabase();
    const updateResult = await RoomBooking.findByIdAndUpdate(id, result.data, {
      new: true,
    });
    if (!updateResult) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const booking = updateResult.toObject();
    return NextResponse.json({
      message: "Booking updated successfully",
      booking,
    });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }
    await connectToDatabase();
    const deleteResult = await RoomBooking.findByIdAndDelete(id);
    if (!deleteResult) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const booking = deleteResult.toObject();
    return NextResponse.json({
      message: "Booking deleted successfully",
      booking,
    });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
