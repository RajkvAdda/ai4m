import mongoose, { Model, Schema } from "mongoose";
import { IUserActivity } from "@/types/userActivity";

const UserActivitySchema = new Schema<IUserActivity>({
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  date: { type: String, required: true, index: true },
  status: { type: String, required: true, index: true },
  description: { type: String, required: true },
});
UserActivitySchema.index({ userId: 1, date: -1 });
UserActivitySchema.index({ status: 1, date: -1 });

export const UserActivity: Model<IUserActivity> =
  mongoose.models.UserActivity ||
  mongoose.model<IUserActivity>("UserActivity", UserActivitySchema);
