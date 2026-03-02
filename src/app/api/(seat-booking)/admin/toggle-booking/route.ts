import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SeatBooking } from "@/modals/(Seat)/SeatBooking";
import { Seat } from "@/modals/(Seat)/Seat";
import { User } from "@/modals/User";
import { UserActivity } from "@/modals/UserActivity";

const MAX_WAITING = 5;

/** Parse position from status like "WAITING(3)_USER" → 3, or null if not a waiting status */
function parseWaitingPosition(status: string): number | null {
  const match = status.match(/^WAITING\((\d+)\)_USER$/);
  return match ? parseInt(match[1], 10) : null;
}

/** Return the first unoccupied seat from the pool, or null */
function findAvailableSeat(
  seats: { _id: unknown; units: number; seatsPerUnit: number }[],
  existingBookings: { seatId: string; seatNumber: number }[],
): { seatId: string; seatNumber: number } | null {
  for (const seat of seats) {
    const totalSeats = seat.units * seat.seatsPerUnit;
    for (let i = 1; i <= totalSeats; i++) {
      const isOccupied = existingBookings.some(
        (b) => b.seatId === seat._id.toString() && b.seatNumber === i,
      );
      if (!isOccupied) {
        return { seatId: seat._id.toString(), seatNumber: i };
      }
    }
  }
  return null;
}

/**
 * Returns the latest UserActivity per userId for the given date,
 * keeping only users whose most recent status is still WAITING.
 * This is needed because we create new records instead of updating,
 * so a user may have multiple WAITING entries — only the latest counts.
 */
async function getActiveWaitingList(date: string) {
  return UserActivity.aggregate([
    { $match: { date } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$userId",
        latestStatus: { $first: "$status" },
        doc: { $first: "$$ROOT" },
      },
    },
    {
      $match: {
        latestStatus: { $regex: /^WAITING\(\d+\)_USER$/ },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
  ]);
}

/** Add a USER to the waiting list (max 5); returns a NextResponse */
async function addToWaitingList(
  userId: string,
  userName: string,
  date: string,
): Promise<NextResponse> {
  // Guard: check the latest activity for this user+date — if it's still WAITING, they're already queued
  const latestActivity = await UserActivity.findOne(
    { userId, date },
    {},
    { sort: { createdAt: -1 } },
  );
  if (latestActivity && parseWaitingPosition(latestActivity.status) !== null) {
    const pos = parseWaitingPosition(latestActivity.status);
    return NextResponse.json(
      {
        message: `Already on waiting list at position ${pos}`,
        action: "waiting",
        position: pos,
      },
      { status: 200 },
    );
  }

  // Count distinct users currently in WAITING state (latest record per user)
  const waitingActivities = await getActiveWaitingList(date);

  if (waitingActivities.length >= MAX_WAITING) {
    return NextResponse.json({ error: "No seats available" }, { status: 400 });
  }

  const waitingPosition = waitingActivities.length + 1;
  await UserActivity.create({
    userId,
    userName,
    date,
    status: `WAITING(${waitingPosition})_USER`,
    description: `Created: Added to waiting list at position ${waitingPosition} for ${date}`,
  });

  return NextResponse.json({
    message: `No seats available. Added to waiting list at position ${waitingPosition}`,
    action: "waiting",
    position: waitingPosition,
  });
}

interface _SeatBookingDocument {
  _id: string;
  seatId: string;
  seatNumber: number;
  userId: string;
  userName: string;
  avator: string;
  startDate: string;
  endDate: string;
  status: string;
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { userId, date, userType } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: "User ID and date are required" },
        { status: 400 },
      );
    }

    // Check if booking exists
    const existingBooking = await SeatBooking.findOne({
      userId,
      startDate: date,
      endDate: date,
    });

    if (existingBooking) {
      // Delete the booking (unbook)
      await SeatBooking.deleteOne({ _id: existingBooking._id });
      await UserActivity.create({
        userId: existingBooking.userId,
        userName: existingBooking.userName,
        description: `Cancelled seat booking ${existingBooking.startDate}`,
        date: existingBooking.startDate,
        status: `${userType}_CANCELLED_BOOKING`,
      });

      // ── Promote first WAITING user for this date ──────────────────────────
      // Use aggregation so we only see each user's latest status — avoids
      // counting stale WAITING records from previous position shifts.
      const waitingActivities = await getActiveWaitingList(date);

      if (waitingActivities.length > 0) {
        // Sort by waiting position ascending
        const sorted = waitingActivities.sort(
          (a: { status: string }, b: { status: string }) => {
            const posA = parseWaitingPosition(a.status) ?? 999;
            const posB = parseWaitingPosition(b.status) ?? 999;
            return posA - posB;
          },
        );

        const first = sorted[0]; // position-1 user

        const seats = await Seat.find();
        const currentBookings = await SeatBooking.find({
          startDate: date,
          endDate: date,
        });
        const assignedSeat = findAvailableSeat(seats, currentBookings);

        if (assignedSeat) {
          // Create booking for first waiting user
          const newBooking = new SeatBooking({
            seatId: assignedSeat.seatId,
            seatNumber: assignedSeat.seatNumber,
            userId: first.userId,
            userName: first.userName,
            startDate: date,
            endDate: date,
            status: `AUTO_BOOKED_SEAT`,
          });
          await newBooking.save();

          // Create new activity for first waiting user → booked
          await UserActivity.create({
            userId: first.userId,
            userName: first.userName,
            date,
            status: `AUTO_BOOKED_SEAT`,
            description: `Updated: Seat booked from waiting list for ${date}`,
          });

          // Shift remaining waiting users' positions down by 1
          for (let i = 1; i < sorted.length; i++) {
            const activity = sorted[i];
            const currentPos = parseWaitingPosition(activity.status) ?? i + 1;
            const newPos = currentPos - 1;
            await UserActivity.create({
              userId: activity.userId,
              userName: activity.userName,
              date,
              status: `WAITING(${newPos})_USER`,
              description: `Updated: Waiting position updated to ${newPos} for ${date}`,
            });
          }
        }
      }

      return NextResponse.json({
        message: "Booking cancelled",
        action: "cancelled",
      });
      // insert user activity log to db here
      // Log user activity
    } else {
      // Create new booking
      const user = await User.findOne({ id: userId }).select("id name");
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get all seats and check capacity
      const seats = await Seat.find();
      const totalCapacity = seats.reduce((sum, seat) => {
        return sum + seat.units * seat.seatsPerUnit;
      }, 0);

      // Check existing bookings for this date
      const existingBookings = await SeatBooking.find({
        startDate: date,
        endDate: date,
      });

      if (existingBookings.length >= totalCapacity) {
        // if (userType === "USER") {
        return addToWaitingList(user.id, user.name, date);
        // }
        // return NextResponse.json(
        //   { error: "No seats available for this date" },
        //   { status: 400 },
        // );
      }

      // Find available seat
      const seatPool: { seatId: string; seatNumber: number }[] = [];
      for (const seat of seats) {
        const totalSeats = seat.units * seat.seatsPerUnit;
        for (let i = 1; i <= totalSeats; i++) {
          seatPool.push({
            seatId: seat._id.toString(),
            seatNumber: i,
          });
        }
      }

      let assignedSeat = null;
      for (const seat of seatPool) {
        const isOccupied = existingBookings.some(
          (b) => b.seatId === seat.seatId && b.seatNumber === seat.seatNumber,
        );

        if (!isOccupied) {
          assignedSeat = seat;
          break;
        }
      }

      if (!assignedSeat) {
        // if (userType === "USER") {
        return addToWaitingList(user.id, user.name, date);

        // return NextResponse.json(
        //   { error: "No seats available" },
        //   { status: 400 },
        // );
      }

      const newBooking = new SeatBooking({
        seatId: assignedSeat.seatId,
        seatNumber: assignedSeat.seatNumber,
        userId: user.id,
        userName: user.name,
        startDate: date,
        endDate: date,
        status: body?.status || `${userType}_BOOKED_SEAT`,
      });

      await newBooking.save();
      await UserActivity.create({
        userId: newBooking.userId,
        description: `Created seat booking ${newBooking.startDate}`,
        date: newBooking.startDate,
        userName: newBooking.userName,
        status: `${userType}_BOOKED_SEAT`,
      });

      return NextResponse.json({
        message: "Booking created",
        action: "booked",
        booking: newBooking,
      });
    }
  } catch (error) {
    console.error("Toggle booking error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
