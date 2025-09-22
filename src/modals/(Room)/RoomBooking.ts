import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export type TRoomBookingStatus =
  | "booked"
  | "cancelled"
  | "booked_by_admin"
  | "cancelled_by_admin"
  | "not_came";

export type TRoomBookingPriority = "high" | "medium" | "low";
export interface IRoomBooking extends Document {
  roomId: string;
  userId: string;
  userName: string;
  avator: string;
  date: string;
  startTime: string;
  endTime: TRoomBookingStatus;
  remarks: string;
  status: TRoomBookingStatus;
  priority: TRoomBookingPriority;
}
export const RoomBookingSchema: Schema = new Schema({
  roomId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  avator: { type: String },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  remarks: { type: String },
  status: {
    type: String,
    enum: [
      "booked",
      "cancelled",
      "booked_by_admin",
      "cancelled_by_admin",
      "not_came",
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    required: true,
  },
});

export const RoomBooking: Model<IRoomBooking> =
  mongoose.models.RoomBooking ||
  mongoose.model<IRoomBooking>("RoomBooking", RoomBookingSchema);

// Zod schema for validation
export const RoomBookingZodSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
  userName: z.string(),
  avator: z.any(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  startTime: z.string(),
  endTime: z.string(),
  remarks: z.string().optional(),
  status: z
    .enum([
      "booked",
      "cancelled",
      "booked_by_admin",
      "cancelled_by_admin",
      "not_came",
    ])
    .default("booked"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});
