import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/modals/User";
import { userZodSchema } from "@/types/user";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get("role");

    // Build query filter
    let query = {};
    if (roleParam) {
      // Split comma-separated roles and create filter
      const roles = roleParam.split(",").map((r) => r.trim());
      query = { role: { $in: roles } };
    }

    const allUsers = await User.find(query).exec();
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
