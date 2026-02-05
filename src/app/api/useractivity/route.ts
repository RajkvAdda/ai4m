// create a router for user activity
import { NextResponse } from "next/server";
import { UserActivity } from "@/modals/UserActivity";
import { connectToDatabase } from "@/lib/db";
import { userActivityZodSchema } from "@/types/userActivity";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    // handle userid and day filters in query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");
    const createdAt = searchParams.get("createdAt");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const filter: any = {};
    if (userId) {
      filter.userId = userId;
    }
    if (date) {
      filter.date = date;
    } else if (createdAt) {
      const start = new Date(createdAt);
      const end = new Date(createdAt);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    } else {
      if (fromDate) {
        filter.date = { $gte: fromDate };
      }
      if (toDate) {
        filter.date = { ...filter.date, $lte: toDate };
      }
    }

    const userActivities = await UserActivity.find(filter).sort({
      createdAt: -1,
    });

    return NextResponse.json({ data: userActivities }, { status: 200 });
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
    const result = userActivityZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await connectToDatabase();
    const newUserActivity = new UserActivity(result.data);
    await newUserActivity.save();
    return NextResponse.json({
      message: "User Activity created successfully",
      id: newUserActivity._id,
    });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
