import { IRoomBooking } from "@/types/room";
import mongoose, { Schema, Model } from "mongoose";

export const RoomBookingSchema: Schema = new Schema({
  roomId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  avator: { type: String },
  date: { type: String, required: true, index: true },
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
    index: true,
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    required: true,
  },
});

// Compound indexes for common queries
RoomBookingSchema.index({ roomId: 1, date: 1 });
RoomBookingSchema.index({ userId: 1, date: 1 });
RoomBookingSchema.index({ date: 1, status: 1 });

export const RoomBooking: Model<IRoomBooking> =
  mongoose.models.RoomBooking ||
  mongoose.model<IRoomBooking>("RoomBooking", RoomBookingSchema);
