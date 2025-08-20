import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export interface IBooking extends Document {
  roomId: string;
  seatNumber: number;
  userId: string;
  userName: string;
  avator: string;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "cancelled";
}
const BookingSchema: Schema = new Schema({
  roomId: { type: String, required: true },
  seatNumber: { type: Number, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  avator: { type: String },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    required: true,
  },
});

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

// Zod schema for validation
export const BookingZodSchema = z.object({
  roomId: z.string(),
  seatNumber: z.number(),
  userId: z.string(),
  userName: z.string(),
  avator: z.any(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  status: z.enum(["pending", "confirmed", "cancelled"]),
});
