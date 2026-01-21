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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;

    // Build query filter
    let query = {};
    if (roleParam) {
      // Split comma-separated roles and create filter
      const roles = roleParam.split(",").map((r) => r.trim());
      query = { role: { $in: roles } };
    }

    const [allUsers, total] = await Promise.all([
      User.find(query)
        .select("-password -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      User.countDocuments(query).exec(),
    ]);

    const response = NextResponse.json({
      data: allUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

    response.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=240",
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
