import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Seat, seatZodSchema } from "@/modals/(Seat)/Seat";

export async function GET() {
  try {
    await connectToDatabase();
    const allSeats = await Seat.find({}).exec();
    const seatsWithVirtuals = allSeats.map((seat) =>
      seat.toObject({ virtuals: true })
    );
    return NextResponse.json(seatsWithVirtuals);
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
