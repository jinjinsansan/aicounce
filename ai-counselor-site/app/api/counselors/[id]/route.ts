import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchCounselorById } from "@/lib/counselors";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const counselor = await fetchCounselorById(id);

  if (!counselor) {
    return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
  }

  return NextResponse.json({ counselor });
}
