import { getAdminSupabase } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const [supabase, authError] = await getAdminSupabase();
  if (authError) return authError;

  try {
    // Get all counselors with their session counts
    const { data: stats, error: statsError } = await supabase
      .from("counselor_stats")
      .select("counselor_id, session_count")
      .order("session_count", { ascending: false });

    if (statsError) throw statsError;

    // Load counselor data from constants (as counselors are defined in code, not DB)
    let counselors;
    try {
      const { loadCounselors } = await import("@/lib/client-counselors");
      counselors = await loadCounselors();
    } catch (loadError) {
      console.error("Failed to load counselors from constants", loadError);
      throw new Error("Failed to load counselor configuration");
    }

    // Merge stats with counselor info
    const counselorMap = new Map(counselors.map((c) => [c.id, c]));
    
    const result = stats.map((stat) => {
      const counselor = counselorMap.get(stat.counselor_id);
      return {
        id: stat.counselor_id,
        name: counselor?.name ?? "Unknown",
        specialty: counselor?.specialty ?? "",
        iconUrl: counselor?.iconUrl ?? "",
        ragEnabled: counselor?.ragEnabled ?? false,
        sessionCount: stat.session_count,
      };
    });

    // Include counselors with 0 sessions
    for (const counselor of counselors) {
      if (!stats.find((s) => s.counselor_id === counselor.id)) {
        result.push({
          id: counselor.id,
          name: counselor.name,
          specialty: counselor.specialty,
          iconUrl: counselor.iconUrl ?? "",
          ragEnabled: counselor.ragEnabled ?? false,
          sessionCount: 0,
        });
      }
    }

    // Sort by session count descending
    result.sort((a, b) => b.sessionCount - a.sessionCount);

    return NextResponse.json({ stats: result });
  } catch (error) {
    console.error("Failed to fetch counselor stats", error);
    return NextResponse.json(
      { error: "Failed to fetch counselor stats" },
      { status: 500 },
    );
  }
}
