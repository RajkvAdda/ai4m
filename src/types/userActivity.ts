import z from "zod";

export const userActivityZodSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  userName: z.string().min(1, "User Name is required"),
  status: z.string().min(1, "Status is required"),
  description: z.string().default(""),
  date: z.string().min(1, "Date is required"),
});

export type IUserActivity = z.infer<typeof userActivityZodSchema>;
