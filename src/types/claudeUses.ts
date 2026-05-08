import z from "zod";

export const claudeUsesZodSchema = z.object({
  username: z.string().min(1, "Username is required"),
  host: z.string().default(""),
  platform: z.string().default(""),
  sent_at: z.string().optional(),
  data: z.any().optional(),
});

export const claudeUsesUpdateZodSchema = claudeUsesZodSchema.partial().extend({
  username: z.string().min(1, "Username is required"),
});

export type IClaudeUses = {
  _id: string ;
  username: string;
  host: string;
  platform: string;
  sent_at?: string;
  data?:any;
  createdAt?: Date;
  updatedAt?: Date;
};
