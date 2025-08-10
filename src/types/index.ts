export type RoomType = "table" | "bench" | "free_area";
export interface Booking {
  id: string;
  roomId: string;
  seatNumber: number;
  userId: string;
  userName: string;
}
