import type { Room, Booking, RoomType } from "@/types";

let rooms: Room[] = [
  {
    id: "1",
    name: "The Commons",
    type: "table",
    capacity: { units: 6, seatsPerUnit: 6 },
    totalCapacity: 36,
    bookings: [],
  },
  {
    id: "2",
    name: "Focus Zone",
    type: "bench",
    capacity: { units: 4, seatsPerUnit: 4 },
    totalCapacity: 16,
    bookings: [],
  },
  {
    id: "3",
    name: "Collaboration Hub",
    type: "free_area",
    capacity: { units: 1, seatsPerUnit: 20 },
    totalCapacity: 20,
    bookings: [],
  },
];

let bookings: Booking[] = [
  {
    id: "b1",
    roomId: "1",
    seatNumber: 3,
    userId: "user1",
    userName: "Alex Doe",
  },
  {
    id: "b2",
    roomId: "1",
    seatNumber: 4,
    userId: "user2",
    userName: "Sam Smith",
  },
  {
    id: "b3",
    roomId: "2",
    seatNumber: 1,
    userId: "user3",
    userName: "Jane Roe",
  },
];

// Initialize rooms with their bookings
rooms.forEach((room) => {
  room.bookings = bookings.filter((b) => b.roomId === room.id);
});

export const getRooms = async (): Promise<Room[]> => {
  return JSON.parse(JSON.stringify(rooms));
};

export const getRoomById = async (id: string): Promise<Room | undefined> => {
  const room = rooms.find((r) => r.id === id);
  return room ? JSON.parse(JSON.stringify(room)) : undefined;
};

export const createRoom = async (data: {
  name: string;
  type: RoomType;
  units: number;
  seatsPerUnit: number;
}): Promise<Room> => {
  const newRoom: Room = {
    id: String(Date.now()),
    name: data.name,
    type: data.type,
    capacity: {
      units: data.units,
      seatsPerUnit: data.seatsPerUnit,
    },
    totalCapacity: data.units * data.seatsPerUnit,
    bookings: [],
  };
  rooms.push(newRoom);
  return JSON.parse(JSON.stringify(newRoom));
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
