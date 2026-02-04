import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/modals/User";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await request.json();
    await connectToDatabase();
    const userUpadete = await User.findOne({ id: id });
    if (!userUpadete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("body", body);

    // Handle password update separately
    const updateData: any = { ...body };

    // If password is being changed
    if (body.newPassword) {
      // Verify current password if provided
      if (body.currentPassword) {
        const isPasswordValid = await bcrypt.compare(
          body.currentPassword,
          userUpadete.password,
        );
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 401 },
          );
        }
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(body.newPassword, 10);
      updateData.password = hashedPassword;

      // Remove temporary fields
      delete updateData.newPassword;
      delete updateData.currentPassword;
      delete updateData.confirmPassword;
    } else {
      // Don't update password if not changing it
      delete updateData.password;
      delete updateData.confirmPassword;
    }

    const updateResult = await User.findByIdAndUpdate(
      userUpadete._id,
      updateData,
      {
        new: true,
      },
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
      { ...body }, // Prevent changing the id field
      {
        new: true,
      },
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    // First find the user by custom id field
    const userToDelete = await User.findOne({ id: id });
    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Then delete using the MongoDB _id
    const deleteResult = await User.findByIdAndDelete(userToDelete._id);
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
