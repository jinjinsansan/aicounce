import { NextResponse } from "next/server";

import { listDiaryEntries } from "@/lib/diary";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 50);

  try {
    const data = await listDiaryEntries(limit, cursor);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load diary feed", error);
    return NextResponse.json({ error: "Failed to load diary feed" }, { status: 500 });
  }
}
