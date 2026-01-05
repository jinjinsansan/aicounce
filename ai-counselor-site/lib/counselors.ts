import type { Counselor } from "@/types";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type SessionCountMap = Record<string, number>;

async function fetchSessionCounts(): Promise<SessionCountMap> {
  if (!hasSupabaseConfig()) {
    return {};
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("counselor_stats")
      .select("counselor_id, session_count");

    if (error || !data) {
      if (error) {
        console.error("Failed to fetch counselor stats", error);
      }
      return {};
    }

    return data.reduce<SessionCountMap>((acc, row) => {
      if (row.counselor_id) {
        acc[row.counselor_id] = row.session_count ?? 0;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Unexpected counselor stats fetch error", error);
    return {};
  }
}

function withSessionCounts(
  counselors: Counselor[],
  stats: SessionCountMap,
): Counselor[] {
  if (!stats || Object.keys(stats).length === 0) {
    return counselors;
  }

  return counselors.map((counselor) => ({
    ...counselor,
    sessionCount: stats[counselor.id] ?? counselor.sessionCount ?? 0,
  }));
}

export async function fetchCounselors(): Promise<Counselor[]> {
  const stats = await fetchSessionCounts();
  return withSessionCounts(FALLBACK_COUNSELORS, stats);
}

export async function fetchCounselorById(
  counselorId: string,
): Promise<Counselor | null> {
  if (!counselorId) return null;

  const counselor =
    FALLBACK_COUNSELORS.find((candidate) => candidate.id === counselorId) ??
    null;

  if (!counselor) {
    return null;
  }

  const stats = await fetchSessionCounts();
  if (!stats[counselorId]) {
    return counselor;
  }

  return {
    ...counselor,
    sessionCount: stats[counselorId] ?? counselor.sessionCount ?? 0,
  };
}

export async function searchCounselors(keyword: string) {
  const list = await fetchCounselors();
  if (!keyword) return list;
  const normalized = keyword.toLowerCase();
  return list.filter(
    (counselor) =>
      counselor.name.toLowerCase().includes(normalized) ||
      counselor.specialty.toLowerCase().includes(normalized) ||
      counselor.description.toLowerCase().includes(normalized),
  );
}
