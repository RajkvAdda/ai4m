import { Room } from "@/modals/Room";
import { connectToDatabase } from "@/lib/db";
import type { RoomType } from "@/types";

export const getRooms = async () => {
  await connectToDatabase();
  const rooms = await Room.find({}).lean();
  return rooms;
};

export const getRoomById = async (id: string) => {
  await connectToDatabase();
  const room = await Room.findById(id).lean();
  return room;
};

export const createRoom = async (data: {
  name: string;
  type: RoomType;
  units: number;
  seatsPerUnit: number;
}) => {
  await connectToDatabase();
  const newRoom = new Room({
    name: data.name,
    type: data.type,
    units: data.units,
    seatsPerUnit: data.seatsPerUnit,
  });
  await newRoom.save();
  return newRoom.toObject();
};

export const createBooking = async (data: {
  roomId: string;
  seatNumber: number;
  userId: string;
  userName: string;
}): Promise<Booking> => {
  const room = rooms.find((r) => r.id === data.roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  const existingBooking = room.bookings.find(
    (b) => b.seatNumber === data.seatNumber
  );
  if (existingBooking) {
    throw new Error("Seat already booked");
  }

  const newBooking: Booking = {
    id: `b${Date.now()}`,
    ...data,
  };

  room.bookings.push(newBooking);
  bookings.push(newBooking);

  return JSON.parse(JSON.stringify(newBooking));
};
