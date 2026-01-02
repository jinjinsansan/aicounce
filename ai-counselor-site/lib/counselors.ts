import type { Counselor, CounselorRow } from "@/types";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

function mapRowToCounselor(row: CounselorRow): Counselor {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    description: row.description ?? "",
    iconUrl: row.icon_url ?? undefined,
    modelName: row.model_name,
    modelType: row.model_type,
    ragEnabled: Boolean(row.rag_enabled),
    ragSourceId: row.rag_source_id,
    tags: row.specialty.split("・"),
    responseTime: "1-2 分",
    sessionCount: 0,
  };
}

export async function fetchCounselors(): Promise<Counselor[]> {
  if (!hasSupabaseConfig()) {
    console.warn("Supabase環境変数が未設定のため、スタブデータを返却します。");
    return FALLBACK_COUNSELORS;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("counselors")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch counselors", error);
      return FALLBACK_COUNSELORS;
    }

    if (!data) {
      return [];
    }

    return data.map(mapRowToCounselor);
  } catch (error) {
    console.error("Unexpected counselor fetch error", error);
    return FALLBACK_COUNSELORS;
  }
}
