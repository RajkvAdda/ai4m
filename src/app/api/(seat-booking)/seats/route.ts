import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Seat } from "@/modals/(Seat)/Seat";
import { seatZodSchema } from "@/types/seat";

export async function GET() {
  try {
    await connectToDatabase();
    const allSeats = await Seat.find({})
      .select("-__v")
      .sort({ name: 1 })
      .lean({ virtuals: true })
      .exec();

    const response = NextResponse.json(allSeats);
    // response.headers.set(
    //   "Cache-Control",
    //   "public, s-maxage=300, stale-while-revalidate=600",
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
    const result = seatZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    await connectToDatabase();
    const newSeat = new Seat(result.data);
    await newSeat.save();

    return NextResponse.json({
      message: "Seat created successfully",
      id: newSeat._id,
    });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
