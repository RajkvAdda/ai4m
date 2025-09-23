import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Types } from "mongoose";
import { Seat } from "@/modals/(Seat)/Seat";
import { seatZodSchema } from "@/types/seat";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid seat ID" }, { status: 400 });
    }
    await connectToDatabase();
    const seat = await Seat.findById(id);
    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }
    return NextResponse.json(seat);
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
    const result = seatZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await connectToDatabase();
    const updateResult = await Seat.findByIdAndUpdate(id, result.data, {
      new: true,
    });
    if (!updateResult) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }
    const seat = updateResult.toObject();
    return NextResponse.json({ message: "Seat updated successfully", seat });
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
    await connectToDatabase();
    const deleteResult = await Seat.findByIdAndDelete(id);
    if (!deleteResult) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }
    const seat = deleteResult.toObject();
    return NextResponse.json({ message: "Seat deleted successfully", seat });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
