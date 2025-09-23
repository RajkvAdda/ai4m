import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/modals/User";
import { userZodSchema } from "@/types/user";

export async function GET() {
  try {
    await connectToDatabase();
    const allUsers = await User.find({}).exec();
    return NextResponse.json(allUsers);
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
    const result = userZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    await connectToDatabase();
    const newUser = new User(result.data);
    await newUser.save();

    return NextResponse.json({
      message: "User created successfully",
      id: newUser._id,
    });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
