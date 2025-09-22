import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export type TRoomBookingStatus =
  | "booked"
  | "cancelled"
  | "booked_by_admin"
  | "cancelled_by_admin"
  | "not_came";
export interface IRoomBooking extends Document {
  roomId: string;
  roomNumber: number;
  userId: string;
  userName: string;
  avator: string;
  startDate: string;
  endDate: string;
  status: TRoomBookingStatus;
}
export const RoomBookingSchema: Schema = new Schema({
  roomId: { type: String, required: true },
  roomNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  avator: { type: String },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
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
});

export const RoomBooking: Model<IRoomBooking> =
  mongoose.models.RoomBooking ||
  mongoose.model<IRoomBooking>("RoomBooking", RoomBookingSchema);

// Zod schema for validation
export const RoomBookingZodSchema = z.object({
  roomId: z.string(),
  roomNumber: z.number(),
  userId: z.string(),
  userName: z.string(),
  avator: z.any(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  status: z
    .enum([
      "booked",
      "cancelled",
      "booked_by_admin",
      "cancelled_by_admin",
      "not_came",
    ])
    .default("booked"),
});
