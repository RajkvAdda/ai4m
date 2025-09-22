import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export const roomTypeEnum = {
  open_room: "open_room",
  table_room: "table_room",
};

export type RoomType = keyof typeof roomTypeEnum;

export interface IRoom extends Document {
  _id: string;
  name: string;
  description: string;
  type: RoomType;
  minBookingTime: number;
  startTime: number;
  endTime: number;
}

export const roomZodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(Object.keys(roomTypeEnum) as RoomType[]),
  minBookingTime: z.coerce
    .number()
    .int()
    .min(30, "Must be at least 30 minutes"),
  startTime: z.coerce
    .number()
    .int()
    .min(8 * 60, "Must start at least 8:00 AM"),
  endTime: z.coerce
    .number()
    .int()
    .max(20 * 60, "Must end at most 8:00 PM"),
});

const RoomSchema: Schema = new Schema(
  {
    name: { type: String, required: true, minlength: 3, unique: true },
    description: { type: String, required: true, minlength: 10 },
    type: {
      type: String,
      enum: Object.keys(roomTypeEnum) as RoomType[],
      required: true,
    },
    minBookingTime: { type: Number, required: true, min: 30 },
    startTime: { type: Number, required: true, min: 8 * 60 },
    endTime: { type: Number, required: true, max: 20 * 60 },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
