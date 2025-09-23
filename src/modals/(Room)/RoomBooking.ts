import { IRoomBooking } from "@/types/room";
import mongoose, { Schema, Model } from "mongoose";

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
