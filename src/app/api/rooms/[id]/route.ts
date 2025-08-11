import { NextResponse } from "next/server";
import { roomSchema } from "../route";
import { connectToDatabase } from "@/lib/db";
import { Room } from "@/modals/Room";
import { Types } from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }
    await connectToDatabase();
    const roomDoc = await Room.findById(params.id);
    if (!roomDoc) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const room = roomDoc.toObject();
    return NextResponse.json(room);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const result = roomSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await connectToDatabase();
    const updateResult = await Room.findByIdAndUpdate(params.id, result.data, {
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
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const deleteResult = await Room.findByIdAndDelete(params.id);
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
