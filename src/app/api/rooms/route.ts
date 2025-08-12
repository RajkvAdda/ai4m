import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room, roomZodSchema } from "@/modals/Room";

export async function GET() {
  try {
    await connectToDatabase();
    const allRooms = await Room.find({}).exec();
    const roomsWithVirtuals = allRooms.map((room) =>
      room.toObject({ virtuals: true })
    );
    return NextResponse.json(roomsWithVirtuals);
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
    const result = roomZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    await connectToDatabase();
    const newRoom = new Room(result.data);
    await newRoom.save();

    return NextResponse.json({
      message: "Room created successfully",
      id: newRoom._id,
    });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
