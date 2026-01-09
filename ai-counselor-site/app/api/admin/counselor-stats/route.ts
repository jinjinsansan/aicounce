import { getAdminSupabase } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const [supabase, authError] = await getAdminSupabase();
  if (authError) return authError;

  try {
    // Get individual counselor session counts
    const { data: stats, error: statsError } = await supabase
      .from("counselor_stats")
      .select("counselor_id, session_count")
      .order("session_count", { ascending: false });

    if (statsError) throw statsError;

    // Get team counseling session counts
    const { data: teamSessions, error: teamError } = await supabase
      .from("team_sessions")
      .select("id, participants");

    if (teamError) throw teamError;

    // Count team session participation per counselor
    const teamCounts = new Map<string, number>();
    if (teamSessions) {
      for (const session of teamSessions as Array<{ id: string; participants: string[] | null }>) {
        if (session.participants && Array.isArray(session.participants)) {
          for (const counselorId of session.participants) {
            teamCounts.set(counselorId, (teamCounts.get(counselorId) || 0) + 1);
          }
        }
      }
    }

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
    const statsMap = new Map(stats.map((s) => [s.counselor_id, s.session_count]));
    
    const result = counselors.map((counselor) => {
      const individualCount = statsMap.get(counselor.id) || 0;
      const teamCount = teamCounts.get(counselor.id) || 0;
      
      return {
        id: counselor.id,
        name: counselor.name,
        specialty: counselor.specialty,
        iconUrl: counselor.iconUrl ?? "",
        ragEnabled: counselor.ragEnabled ?? false,
        sessionCount: individualCount,
        teamSessionCount: teamCount,
        totalSessionCount: individualCount + teamCount,
      };
    });

    // Sort by total session count descending
    result.sort((a, b) => b.totalSessionCount - a.totalSessionCount);

    return NextResponse.json({ stats: result });
  } catch (error) {
    console.error("Failed to fetch counselor stats", error);
    return NextResponse.json(
      { error: "Failed to fetch counselor stats" },
      { status: 500 },
    );
  }
}
