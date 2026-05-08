import { NextResponse } from "next/server";
import { ClaudeUses } from "@/modals/ClaudeUses";
import { connectToDatabase } from "@/lib/db";
import { claudeUsesZodSchema, claudeUsesUpdateZodSchema } from "@/types/claudeUses";

// GET /api/claudeUses
// ?username=&host=&platform=  → fetch one matching all three
// (no params)                 → fetch all
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const host = searchParams.get("host");
    const platform = searchParams.get("platform");

    if (username || host || platform) {
      const filter: Record<string, string> = {};
      if (username) filter.username = username;
      if (host) filter.host = host;
      if (platform) filter.platform = platform;

      const record = await ClaudeUses.findOne(filter);
      if (!record) {
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      }
      return NextResponse.json({ data: record }, { status: 200 });
    }

    const records = await ClaudeUses.find().sort({ updatedAt: -1 });
    return NextResponse.json({ data: records }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// POST /api/claudeUses
// Upsert based on unique combination: username + host + platform
// If a record with the same combination exists → update, otherwise → create
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = claudeUsesZodSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await connectToDatabase();

    const { username, host = "", platform = "", ...rest } = result.data;

    const record = await ClaudeUses.findOneAndUpdate(
      { username, host, platform },
      { $set: { username, host, platform, ...rest } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json(
      { message: "ClaudeUses record saved successfully", data: record },
      { status: 200 },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// PUT /api/claudeUses
// Update an existing record by _id (body must include _id)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { _id, ...rest } = body;

    if (!_id) {
      return NextResponse.json({ error: "_id is required" }, { status: 400 });
    }

    const result = claudeUsesUpdateZodSchema.safeParse(rest);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }
    await connectToDatabase();

    const record = await ClaudeUses.findByIdAndUpdate(
      _id,
      { $set: result.data },
      { new: true },
    );

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "ClaudeUses record updated successfully", data: record },
      { status: 200 },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// DELETE /api/claudeUses?id=<_id>
export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id query param is required" },
        { status: 400 },
      );
    }

    const record = await ClaudeUses.findByIdAndDelete(id);
    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "ClaudeUses record deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
