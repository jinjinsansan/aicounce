import { NextResponse } from "next/server";

import { getDiaryEntry, incrementDiaryShare } from "@/lib/diary";

export async function POST(_request: Request, context: { params: { entryId: string } } | { params: Promise<{ entryId: string }> }) {
  try {
    const resolvedParams = await Promise.resolve((context as any).params);
    const entryId = (resolvedParams as { entryId: string }).entryId;
    const entry = await getDiaryEntry(entryId);
    if (!entry || entry.is_shareable === false) {
      return NextResponse.json({ error: "This entry cannot be shared" }, { status: 400 });
    }

    const count = await incrementDiaryShare(entryId);
    return NextResponse.json({ shareCount: count ?? entry.share_count + 1 });
  } catch (error) {
    console.error("Failed to record diary share", error);
    return NextResponse.json({ error: "Failed to record share" }, { status: 500 });
  }
}
