import { z } from "zod";

export const roomTypeEnum = {
  open_room: "open_room",
  table_room: "table_room",
};

export const timeOptions = [
  { value: "30", label: "30 Minutes" },
  { value: "60", label: "1 Hour" },
  { value: "90", label: "1 Hour 30 Minutes" },
  { value: "120", label: "2 Hours" },
  { value: "150", label: "2 Hours 30 Minutes" },
  { value: "180", label: "3 Hours" },
];
export type RoomType = keyof typeof roomTypeEnum;

export type IRoom = {
  _id: string;
  name: string;
  description: string;
  type: RoomType;
  minBookingTime: string;
  startTime: string;
  endTime: string;
};

export const roomZodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(Object.keys(roomTypeEnum) as RoomType[]),
  minBookingTime: z.enum(timeOptions.map((item) => item.value)).default("30"),
  startTime: z
    .string()
    .refine((time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time), {
      message: "Invalid time format. Use HH:MM (24-hour format)",
    })
    .default("09:00"),
  endTime: z
    .string()
    .refine((time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time), {
      message: "Invalid time format. Use HH:MM (24-hour format)",
    })
    .default("20:00"),
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
