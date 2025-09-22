import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

export const seatTypeEnum = {
  table: "table",
  row: "row",
  free_area: "free_area",
};

export type SeatType = "table" | "row" | "free_area";

export interface ISeat extends Document {
  _id: string;
  name: string;
  description: string;
  type: SeatType;
  units: number;
  seatsPerUnit: number;
  totalCapacity?: number;
}

export const seatZodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["table", "row", "free_area"]),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  seatsPerUnit: z.coerce
    .number()
    .int()
    .min(1, "Must have at least 1 seat per unit"),
});

const SeatSchema: Schema = new Schema(
  {
    name: { type: String, required: true, minlength: 3, unique: true },
    description: { type: String, required: true, minlength: 10 },
    type: {
      type: String,
      enum: ["table", "row", "free_area"],
      required: true,
    },
    units: { type: Number, required: true, min: 1 },
    seatsPerUnit: { type: Number, required: true, min: 1 },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

SeatSchema.virtual("totalCapacity").get(function (this: ISeat) {
  return this.units * this.seatsPerUnit;
});

export const Seat: Model<ISeat> =
  mongoose.models.Seat || mongoose.model<ISeat>("Seat", SeatSchema);
