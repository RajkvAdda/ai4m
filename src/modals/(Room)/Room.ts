import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export const roomTypeEnum = {
  table: "table",
  row: "row",
  free_area: "free_area",
};

export type RoomType = "table" | "row" | "free_area";

export interface IRoom extends Document {
  _id: string;
  name: string;
  description: string;
  type: RoomType;
  units: number;
  roomsPerUnit: number;
  totalCapacity?: number;
}

export const roomZodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["table", "row", "free_area"]),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  roomsPerUnit: z.coerce
    .number()
    .int()
    .min(1, "Must have at least 1 room per unit"),
});

const RoomSchema: Schema = new Schema(
  {
    name: { type: String, required: true, minlength: 3, unique: true },
    description: { type: String, required: true, minlength: 10 },
    type: {
      type: String,
      enum: ["table", "row", "free_area"],
      required: true,
    },
    units: { type: Number, required: true, min: 1 },
    roomsPerUnit: { type: Number, required: true, min: 1 },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

RoomSchema.virtual("totalCapacity").get(function (this: IRoom) {
  return this.units * this.roomsPerUnit;
});

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
