import { NextResponse } from "next/server";

import { runDailyDiaries } from "@/lib/diary";

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.DIARY_CRON_SECRET;

const authorizeCron = (request: Request) => {
  if (!CRON_SECRET) return true;

  const header = request.headers.get("x-cron-secret");
  if (header && header === CRON_SECRET) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${CRON_SECRET}`) return true;

  return false;
};

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const forceParam = url.searchParams.get("force");
  const force = forceParam === "1" || forceParam === "true";

  try {
    const result = await runDailyDiaries({ force });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Failed to run daily diary cron", error);
    return NextResponse.json({ error: "Failed to run daily diary" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
