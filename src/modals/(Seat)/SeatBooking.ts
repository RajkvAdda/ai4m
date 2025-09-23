import { ISeatBooking } from "@/types/seat";
import mongoose, { Schema, Model } from "mongoose";

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
