import type { Counselor, CounselorRow } from "@/types";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

const DEFAULT_RESPONSE_TIME = "1-2 分";

function deriveTags(specialty: string) {
  return specialty
    .split(/[・,/]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function mapRowToCounselor(row: CounselorRow): Counselor {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    description: row.description ?? "",
    iconUrl: row.icon_url ?? undefined,
    systemPrompt: row.system_prompt ?? undefined,
    modelName: row.model_name,
    modelType: row.model_type,
    ragEnabled: Boolean(row.rag_enabled),
    ragSourceId: row.rag_source_id,
    tags: deriveTags(row.specialty),
    responseTime: DEFAULT_RESPONSE_TIME,
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

    if (!data || data.length === 0) {
      console.warn("Counselor table is empty; falling back to defaults.");
      return FALLBACK_COUNSELORS;
    }

    return data.map(mapRowToCounselor);
  } catch (error) {
    console.error("Unexpected counselor fetch error", error);
    return FALLBACK_COUNSELORS;
  }
}

export async function fetchCounselorById(
  counselorId: string,
): Promise<Counselor | null> {
  if (!counselorId) return null;

  if (!hasSupabaseConfig()) {
    return (
      FALLBACK_COUNSELORS.find((counselor) => counselor.id === counselorId) ??
      null
    );
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("counselors")
      .select("*")
      .eq("id", counselorId)
      .single();

    if (error) {
      console.error("Failed to fetch counselor", error);
      return (
        FALLBACK_COUNSELORS.find((counselor) => counselor.id === counselorId) ??
        null
      );
    }

    if (data) {
      return mapRowToCounselor(data);
    }

    return (
      FALLBACK_COUNSELORS.find((counselor) => counselor.id === counselorId) ??
      null
    );
  } catch (error) {
    console.error("Unexpected counselor fetch error", error);
    return (
      FALLBACK_COUNSELORS.find((counselor) => counselor.id === counselorId) ??
      null
    );
  }
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
