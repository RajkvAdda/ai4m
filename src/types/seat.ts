import { z } from "zod";

export const seatTypeEnum = {
  table: "table",
  row: "row",
  free_area: "free_area",
};

export type SeatType = "table" | "row" | "free_area";

export type ISeat = {
  _id: string | any;
  name: string;
  description: string;
  type: SeatType;
  units: number;
  seatsPerUnit: number;
  totalCapacity?: number;
};

export const seatZodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["table", "row", "free_area"]),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  seatsPerUnit: z.coerce
    .number()
    .int()
    .min(1, "Must have at least 1 seat per unit"),
});

// Zod schema for validation
export const SeatBookingZodSchema = z.object({
  seatId: z.string(),
  seatNumber: z.number(),
  userId: z.string(),
  userName: z.string(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  status: z
    .enum([
      "booked",
      "cancelled",
      "booked_by_admin",
      "cancelled_by_admin",
      "not_came",
    ])
    .default("booked"),
});

export type TBookingStatus =
  | "booked"
  | "cancelled"
  | "booked_by_admin"
  | "cancelled_by_admin"
  | "not_came";

export interface ISeatBooking extends Document {
  seatId: string;
  seatNumber: number;
  userId: string;
  userName: string;
  avator: string;
  startDate: string;
  endDate: string;
  status: TBookingStatus;
}
