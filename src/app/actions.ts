"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createRoom as dbCreateRoom,
  createBooking as dbCreateBooking,
} from "@/lib/data";

const roomSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["table", "bench", "free_area"]),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  seatsPerUnit: z.coerce
    .number()
    .int()
    .min(1, "Must have at least 1 seat per unit"),
});

export async function createRoomAction(prevState: any, formData: FormData) {
  const role = "admin";
  if (role !== "admin") {
    return { message: "Unauthorized" };
  }

  const validatedFields = roomSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed.",
    };
  }

  try {
    await dbCreateRoom(validatedFields.data);
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return {
      message: `Room "${validatedFields.data.name}" created successfully.`,
    };
  } catch (error) {
    return { message: "Failed to create room." };
  }
}

const bookingSchema = z.object({
  roomId: z.string(),
  seatNumber: z.coerce.number().int().min(1),
});

export async function bookSeatAction(prevState: any, formData: FormData) {
  const user = {};
  if (!user) {
    return { success: false, message: "You must be logged in to book a seat." };
  }

  const validatedFields = bookingSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { success: false, message: "Invalid booking data." };
  }

  try {
    await dbCreateBooking({
      ...validatedFields.data,
      userId: user.id,
      userName: user.firstName || user.emailAddresses[0].emailAddress,
    });
    revalidatePath(`/dashboard/rooms/${validatedFields.data.roomId}`);
    return {
      success: true,
      message: `Seat ${validatedFields.data.seatNumber} booked successfully!`,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "An unknown error occurred." };
  }
}
