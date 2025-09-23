import { ISeat } from "@/types/seat";
import mongoose, { Schema, Model } from "mongoose";

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
