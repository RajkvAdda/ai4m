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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (roomId) query.roomId = roomId;
    if (date) query.date = date;
    if (searchParams.get("userId")) query.userId = searchParams.get("userId");
    if (searchParams.get("fromDate") && searchParams.get("toDate")) {
      query.date = {
        $gte: searchParams.get("fromDate"),
        $lte: searchParams.get("toDate"),
      };
    }

    const [roomBookings, total] = await Promise.all([
      RoomBooking.find(query)
        .select("-__v -avator")
        .sort({ date: -1, startTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      RoomBooking.countDocuments(query).exec(),
    ]);

    const response = NextResponse.json({
      data: roomBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    // response.headers.set(
    //   "Cache-Control",
    //   "public, s-maxage=60, stale-while-revalidate=120",
    // );
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
