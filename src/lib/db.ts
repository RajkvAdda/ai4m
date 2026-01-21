import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in env variables");
}

// Type definitions for cached connection
interface MongooseCache {
  conn: typeof mongoose.connection | null;
  promise: Promise<typeof mongoose.connection> | null;
}

// Extend global to include mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

// Connection state monitoring
let isConnecting = false;

// Optimized connection options
const connectionOptions = {
  bufferCommands: false,
  maxPoolSize: process.env.NODE_ENV === "production" ? 50 : 10,
  minPoolSize: process.env.NODE_ENV === "production" ? 10 : 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
};

export async function connectToDatabase() {
  // Return existing connection if available and ready
  if (cached.conn?.readyState === 1) {
    return cached.conn;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait for ongoing connection attempt
    await cached.promise;
    return cached.conn;
  }

  // Create new connection promise if needed
  if (!cached.promise) {
    isConnecting = true;

    cached.promise = mongoose
      .connect(MONGODB_URI + "/ai4m", connectionOptions)
      .then((mongooseInstance) => {
        isConnecting = false;
        console.log("✅ MongoDB connected successfully");

        // Set up connection event handlers
        mongooseInstance.connection.on("disconnected", () => {
          console.warn("⚠️ MongoDB disconnected");
          cached.conn = null;
          cached.promise = null;
        });

        mongooseInstance.connection.on("error", (error) => {
          console.error("❌ MongoDB connection error:", error);
          cached.conn = null;
          cached.promise = null;
        });

        mongooseInstance.connection.on("reconnected", () => {
          console.log("🔄 MongoDB reconnected");
        });

        return mongooseInstance.connection;
      })
      .catch((error) => {
        isConnecting = false;
        cached.promise = null;
        console.error("❌ MongoDB connection failed:", error.message);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}

// Optional: Graceful shutdown handler
export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log("MongoDB disconnected gracefully");
  }
}
