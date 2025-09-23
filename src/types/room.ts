import { z } from "zod";

export const roomTypeEnum = {
  open_room: "open_room",
  table_room: "table_room",
};

export type RoomType = keyof typeof roomTypeEnum;

export type IRoom = {
  _id: string;
  name: string;
  description: string;
  type: RoomType;
  minBookingTime: number;
  startTime: number;
  endTime: number;
};

export const roomZodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(Object.keys(roomTypeEnum) as RoomType[]),
  minBookingTime: z.coerce
    .number()
    .int()
    .min(30, "Must be at least 30 minutes"),
  startTime: z.coerce
    .number()
    .int()
    .min(8 * 60, "Must start at least 8:00 AM"),
  endTime: z.coerce
    .number()
    .int()
    .max(20 * 60, "Must end at most 8:00 PM"),
});

export const RoomBookingZodSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
  userName: z.string(),
  avator: z.any(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  startTime: z.string(),
  endTime: z.string(),
  remarks: z.string().optional(),
  status: z
    .enum([
      "booked",
      "cancelled",
      "booked_by_admin",
      "cancelled_by_admin",
      "not_came",
    ])
    .default("booked"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

export type TRoomBookingStatus =
  | "booked"
  | "cancelled"
  | "booked_by_admin"
  | "cancelled_by_admin"
  | "not_came";

export type TRoomBookingPriority = "high" | "medium" | "low";
export type IRoomBooking = {
  roomId: string;
  userId: string;
  userName: string;
  avator: string;
  date: string;
  startTime: string;
  endTime: TRoomBookingStatus;
  remarks: string;
  status: TRoomBookingStatus;
  priority: TRoomBookingPriority;
};
