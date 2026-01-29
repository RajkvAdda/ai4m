import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";

export async function POST() {
  try {
    await connectToDatabase();

    const collection = mongoose.connection.db.collection("useractivities");

    // Check existing indexes
    console.log("Checking existing indexes...");
    const indexes = await collection.indexes();
    console.log("Existing indexes:", JSON.stringify(indexes, null, 2));

    // Check if id_1 index exists
    const hasIdIndex = indexes.some((index: any) => index.name === "id_1");

    if (!hasIdIndex) {
      return NextResponse.json({
        success: true,
        message: "id_1 index does not exist. Nothing to drop.",
        indexes,
      });
    }

    // Drop the problematic id_1 index
    console.log("Dropping id_1 index...");
    await collection.dropIndex("id_1");
    console.log("Index dropped successfully!");

    // Verify indexes after drop
    const updatedIndexes = await collection.indexes();
    console.log("Indexes after drop:", JSON.stringify(updatedIndexes, null, 2));

    return NextResponse.json({
      success: true,
      message: "id_1 index dropped successfully!",
      indexesBefore: indexes,
      indexesAfter: updatedIndexes,
    });
  } catch (error) {
    console.error("Error dropping index:", error);
    let errorMsg = "Unknown error";
    if (error instanceof Error) {
      errorMsg = error.message;
    }
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 },
    );
  }
}
