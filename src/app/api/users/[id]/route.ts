import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User, { userZodSchema } from "@/modals/User";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectToDatabase();
    const user = await User.findOne({ id: id });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const userUpadete = await User.findOne({ id: id });
    if (!userUpadete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("body", body);
    await connectToDatabase();
    const updateResult = await User.findByIdAndUpdate(
      userUpadete._id,
      { ...userUpadete, ...body }, // Prevent changing the id field
      {
        new: true,
      }
    );
    if (!updateResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = updateResult.toObject();
    return NextResponse.json({ message: "User updated successfully", user });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const deleteResult = await User.findByIdAndDelete(id);
    if (!deleteResult) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = deleteResult.toObject();
    return NextResponse.json({ message: "User deleted successfully", user });
  } catch (error) {
    let errorMsg = "Unknown error";
    if (error instanceof Error) errorMsg = error.message;
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
