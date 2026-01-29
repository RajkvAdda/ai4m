import mongoose, { Model, Schema } from "mongoose";
import { IUserActivity } from "@/types/userActivity";

const userActivitySchema = new Schema<IUserActivity>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, required: true },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

export const UserActivity: Model<IUserActivity> =
  mongoose.models.UserActivity ||
  mongoose.model<IUserActivity>("UserActivity", userActivitySchema);
export default UserActivity;
