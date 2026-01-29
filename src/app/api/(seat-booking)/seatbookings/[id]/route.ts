import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Types } from "mongoose";
import { SeatBooking } from "@/modals/(Seat)/SeatBooking";
import { SeatBookingZodSchema } from "@/types/seat";
import { UserActivity } from "@/modals/UserActivity";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 },
      );
    }
    await connectToDatabase();
    const booking = await SeatBooking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: "SeatBooking not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(booking);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 },
      );
    }
    const body = await request.json();
    const result = SeatBookingZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await connectToDatabase();
    const updateResult = await SeatBooking.findByIdAndUpdate(id, result.data, {
      new: true,
    });
    if (!updateResult) {
      return NextResponse.json(
        { error: "SeatBooking not found" },
        { status: 404 },
      );
    }
    UserActivity.create({
      userId: result.data.userId,
      description: `Updated seat booking ${result.data.startDate}`,
      date: result.data.startDate,
      userName: result.data.userName,
      status: "USER_UPDATED_SEAT_BOOKING",
    });
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 },
      );
    }
    await connectToDatabase();
    const deleteResult = await SeatBooking.findByIdAndDelete(id);
    if (!deleteResult) {
      return NextResponse.json(
        { error: "SeatBooking not found" },
        { status: 404 },
      );
    }
    UserActivity.create({
      userId: deleteResult.userId,
      description: `Deleted seat booking ${deleteResult.startDate}`,
      date: deleteResult.startDate,
      userName: deleteResult.userName,
      status: "USER_DELETED_SEAT_BOOKING",
    });
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
