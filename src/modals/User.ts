import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { z } from "zod";

export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  avator: string;
  role: string;
  _id?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const userZodSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  avator: z.string().optional(),
  role: z.string().min(1),
});

const userSchema = new Schema<IUser>(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    avator: { type: String },
    role: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
