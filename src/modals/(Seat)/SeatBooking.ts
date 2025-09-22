import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export type TBookingStatus =
  | "booked"
  | "cancelled"
  | "booked_by_admin"
  | "cancelled_by_admin"
  | "not_came";

export interface ISeatBooking extends Document {
  seatId: string;
  seatNumber: number;
  userId: string;
  userName: string;
  avator: string;
  startDate: string;
  endDate: string;
  status: TBookingStatus;
}

export const SeatBookingSchema: Schema = new Schema({
  seatId: { type: String, required: true },
  seatNumber: { type: Number, required: true },
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

export const SeatBooking: Model<ISeatBooking> =
  mongoose.models.SeatBooking ||
  mongoose.model<ISeatBooking>("SeatBooking", SeatBookingSchema);

// Zod schema for validation
export const SeatBookingZodSchema = z.object({
  seatId: z.string(),
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
