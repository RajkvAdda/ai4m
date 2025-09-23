import mongoose, { Schema, Model } from "mongoose";
import { IRoom, RoomType } from "@/types/room";
import { roomTypeEnum } from "@/types/room";

const RoomSchema: Schema = new Schema(
  {
    name: { type: String, required: true, minlength: 3, unique: true },
    description: { type: String, required: true, minlength: 10 },
    type: {
      type: String,
      enum: Object.keys(roomTypeEnum) as RoomType[],
      required: true,
    },
    minBookingTime: {
      type: String,
      enum: ["30", "60", "90", "120", "150", "180"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
