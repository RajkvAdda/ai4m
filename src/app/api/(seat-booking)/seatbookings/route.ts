import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SeatBooking } from "@/modals/(Seat)/SeatBooking";
import { SeatBookingZodSchema } from "@/types/seat";
import { UserActivity } from "@/modals/UserActivity";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const seatId = searchParams.get("seatId");
    const date = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "500");
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (seatId) query.seatId = seatId;
    if (date) query.startDate = date;
    if (searchParams.get("userId")) query.userId = searchParams.get("userId");
    if (searchParams.get("fromDate") && searchParams.get("toDate")) {
      query.startDate = { $gte: searchParams.get("fromDate") };
      query.endDate = { $lte: searchParams.get("toDate") };
    }
    if (searchParams.get("startDate")) {
      query.startDate = { $eq: searchParams.get("startDate") };
    }

    const [bookings, total] = await Promise.all([
      SeatBooking.find(query)
        .select("-__v -avator")
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      SeatBooking.countDocuments(query).exec(),
    ]);

    const response = NextResponse.json({
      data: bookings,
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
    const result = SeatBookingZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    await connectToDatabase();
    const newBooking = new SeatBooking(result.data);
    await newBooking.save();

    // insert user activity log to db here
    // Log user activity
    UserActivity.create({
      userId: result.data.userId,
      description: `Created seat booking ${result.data.startDate}`,
      date: result.data.startDate,
      userName: result.data.userName,
      status: "USER_BOOKED_SEAT",
    });

    return NextResponse.json({
      message: "Booking created successfully",
      id: newBooking._id,
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

    const bookings = await SeatBooking.deleteMany(query).exec();
    return NextResponse.json(bookings);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
