export type RoomType = "table" | "bench" | "free_area";
export interface Booking {
  id: string;
  roomId: string;
  seatNumber: number;
  userId: string;
  userName: string;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: {
    units: number;
    seatsPerUnit: number;
  };
  totalCapacity: number;
  bookings: Booking[];
}
