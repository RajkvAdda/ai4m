import { z } from "zod";

export const ROLES = [
  { value: "admin", label: "Administrator", color: "bg-red-100 text-red-800" },
  { value: "user", label: "User", color: "bg-green-100 text-green-800" },
  // { value: "viewer", label: "Viewer", color: "bg-gray-100 text-gray-800" },
];

export type IUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  avator: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const userZodSchema = z
  .object({
    id: z.string().min(1, "ID is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    name: z.string().min(1, "Name is required"),
    avator: z.string().optional(),
    role: z.string().min(1, "Role is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
