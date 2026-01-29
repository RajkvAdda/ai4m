/**
 * Migration script to drop the problematic id_1 index from useractivities collection
 * Run this with: npx ts-node scripts/drop-id-index.ts
 * Or: node scripts/drop-id-index.js (if compiled)
 */

import mongoose from "mongoose";

async function dropIndex() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully");

    const collection = mongoose.connection.db.collection("useractivities");

    // Check existing indexes
    console.log("\nExisting indexes:");
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the problematic id_1 index
    console.log("\nDropping id_1 index...");
    await collection.dropIndex("id_1");
    console.log("Index dropped successfully!");

    // Verify indexes after drop
    console.log("\nIndexes after drop:");
    const updatedIndexes = await collection.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));

    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

dropIndex();
