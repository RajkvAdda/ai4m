import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoom extends Document {
  name: string;
  type: "table" | "bench" | "free_area";
  units: number;
  seatsPerUnit: number;
}

const RoomSchema: Schema = new Schema({
  name: { type: String, required: true, minlength: 3 },
  type: { type: String, enum: ["table", "bench", "free_area"], required: true },
  units: { type: Number, required: true, min: 1 },
  seatsPerUnit: { type: Number, required: true, min: 1 },
});

RoomSchema.virtual("totalCapacity").get(function (this: IRoom) {
  return this.units * this.seatsPerUnit;
});

RoomSchema.set("toJSON", { virtuals: true });
RoomSchema.set("toObject", { virtuals: true });

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);
