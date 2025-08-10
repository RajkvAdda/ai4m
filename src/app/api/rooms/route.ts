import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Room } from "@/modals/Room";

export const roomSchema = z.object({
  name: z.string().min(3),
  type: z.enum(["table", "bench", "free_area"]),
  units: z.number().int().min(1),
  seatsPerUnit: z.number().int().min(1),
});

export async function GET() {
  try {
    await connectToDatabase();
    const allRooms = await Room.find({}).lean();
    return NextResponse.json(allRooms);
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
    const result = roomSchema.safeParse(body);
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
