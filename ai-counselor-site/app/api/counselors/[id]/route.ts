import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchCounselorById } from "@/lib/counselors";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const counselor = await fetchCounselorById(params.id);

  if (!counselor) {
    return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
  }

  return NextResponse.json({ counselor });
}
