import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Types } from "mongoose";
import { Room, roomZodSchema } from "@/modals/(Room)/Room";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }
    await connectToDatabase();
    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json(room);
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
    const result = roomZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await connectToDatabase();
    const updateResult = await Room.findByIdAndUpdate(id, result.data, {
      new: true,
    });
    if (!updateResult) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const room = updateResult.toObject();
    return NextResponse.json({ message: "Room updated successfully", room });
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
    const deleteResult = await Room.findByIdAndDelete(id);
    if (!deleteResult) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const room = deleteResult.toObject();
    return NextResponse.json({ message: "Room deleted successfully", room });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
