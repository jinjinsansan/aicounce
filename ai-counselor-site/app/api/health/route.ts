import { NextResponse } from "next/server";
import { hasSupabaseConfig, getSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabaseConfigured = hasSupabaseConfig();
  let supabaseHealthy = false;
  let details: Record<string, unknown> | undefined;

  if (supabaseConfigured) {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("counselors")
        .select("id")
        .limit(1);
      supabaseHealthy = !error;
      if (error) {
        details = { supabaseError: error.message };
      }
    } catch (error) {
      details = { supabaseError: (error as Error).message };
    }
  }

  return NextResponse.json({
    status: supabaseConfigured && supabaseHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      supabaseConfigured,
      supabaseHealthy,
    },
    details,
  });
}
