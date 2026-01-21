import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room } from "@/modals/(Room)/Room";
import { roomZodSchema } from "@/types/room";

export async function GET() {
  try {
    await connectToDatabase();
    const allRooms = await Room.find({})
      .select("-__v")
      .sort({ name: 1 })
      .lean({ virtuals: true })
      .exec();

    const response = NextResponse.json(allRooms);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    return response;
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
