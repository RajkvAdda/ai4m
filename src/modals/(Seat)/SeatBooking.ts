import { ISeatBooking } from "@/types/seat";
import mongoose, { Schema, Model } from "mongoose";

export const SeatBookingSchema: Schema = new Schema({
  seatId: { type: String, required: true, index: true },
  seatNumber: { type: Number, required: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  avator: { type: String },
  startDate: { type: String, required: true, index: true },
  endDate: { type: String, required: true, index: true },
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
    index: true,
  },
});

// Compound indexes for common queries
SeatBookingSchema.index({ seatId: 1, startDate: 1 });
SeatBookingSchema.index({ userId: 1, startDate: 1 });
SeatBookingSchema.index({ startDate: 1, endDate: 1 });
SeatBookingSchema.index({ startDate: 1, status: 1 });

export const SeatBooking: Model<ISeatBooking> =
  mongoose.models.SeatBooking ||
  mongoose.model<ISeatBooking>("SeatBooking", SeatBookingSchema);
