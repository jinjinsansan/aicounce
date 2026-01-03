import { NextResponse } from "next/server";
import { fetchCounselors } from "@/lib/counselors";

export async function GET() {
  const counselors = await fetchCounselors();
  return NextResponse.json({ counselors });
}
