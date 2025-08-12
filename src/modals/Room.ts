import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export const roomTypeEnum = {
  table: "table",
  bench: "bench",
  free_area: "free_area",
};

export type RoomType = "table" | "bench" | "free_area";

export interface IRoom extends Document {
  name: string;
  type: "table" | "bench" | "free_area";
  units: number;
  seatsPerUnit: number;
  totalCapacity?: number;
}

export const roomZodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["table", "bench", "free_area"]),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  seatsPerUnit: z.coerce
    .number()
    .int()
    .min(1, "Must have at least 1 seat per unit"),
});

const RoomSchema: Schema = new Schema(
  {
    name: { type: String, required: true, minlength: 3, unique: true },
    type: {
      type: String,
      enum: ["table", "bench", "free_area"],
      required: true,
    },
    units: { type: Number, required: true, min: 1 },
    seatsPerUnit: { type: Number, required: true, min: 1 },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

RoomSchema.virtual("totalCapacity").get(function (this: IRoom) {
  return this.units * this.seatsPerUnit;
});

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
