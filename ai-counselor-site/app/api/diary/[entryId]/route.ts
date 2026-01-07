import { NextResponse } from "next/server";

import { getDiaryEntry } from "@/lib/diary";

export async function GET(_request: Request, context: { params: { entryId: string } } | { params: Promise<{ entryId: string }> }) {
  try {
    const resolvedParams = await Promise.resolve((context as any).params);
    const entryId = (resolvedParams as { entryId: string }).entryId;
    const entry = await getDiaryEntry(entryId);
    if (!entry || entry.is_shareable === false) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to load diary entry", error);
    return NextResponse.json({ error: "Failed to load diary entry" }, { status: 500 });
  }
}
