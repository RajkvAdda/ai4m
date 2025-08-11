import mongoose, { Schema, Document, Model } from "mongoose";

export type RoomType = "table" | "bench" | "free_area";
export interface Booking {
  seatNumber: number;
  userId: string;
  userName: string;
}

export interface IRoom extends Document {
  name: string;
  type: "table" | "bench" | "free_area";
  units: number;
  seatsPerUnit: number;
  Bookings: Booking[];
}

const RoomSchema: Schema = new Schema(
  {
    name: { type: String, required: true, minlength: 3 },
    type: {
      type: String,
      enum: ["table", "bench", "free_area"],
      required: true,
    },
    units: { type: Number, required: true, min: 1 },
    seatsPerUnit: { type: Number, required: true, min: 1 },
    Bookings: [
      {
        seatNumber: { type: Number, required: true },
        userId: { type: String, required: true },
        userName: { type: String, required: true },
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

RoomSchema.virtual("totalCapacity").get(function (this: IRoom) {
  return this.units * this.seatsPerUnit;
});

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
