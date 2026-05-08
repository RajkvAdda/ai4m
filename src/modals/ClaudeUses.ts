import mongoose, { Model, Schema } from "mongoose";
import { IClaudeUses } from "@/types/claudeUses";

const ClaudeUsesSchema = new Schema<IClaudeUses>(
  {
    username: { type: String, required: true, index: true },
    host: { type: String, default: "" },
    platform: { type: String, default: "" },
    sent_at: { type: String },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Compound unique key: one record per username + host + platform combination
ClaudeUsesSchema.index({ username: 1, host: 1, platform: 1 }, { unique: true });

export const ClaudeUses: Model<IClaudeUses> =
  mongoose.models.ClaudeUses ||
  mongoose.model<IClaudeUses>("ClaudeUses", ClaudeUsesSchema);
