import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export type AdminSummary = {
  counselorCount: number;
  activeSessions: number;
  ragCoverage: number; // %
  averageLatencyMs: number;
};

export type UsagePoint = {
  date: string;
  sessions: number;
  ragUsage: number;
};

export type CounselorInsight = {
  id: string;
  name: string;
  specialty: string;
  ragEnabled: boolean;
  conversations: number;
  satisfaction: number; // %
  avgResponseMs: number;
};

export type AdminMetrics = {
  summary: AdminSummary;
  usage: UsagePoint[];
  counselors: CounselorInsight[];
};

const FALLBACK_METRICS: AdminMetrics = {
  summary: {
    counselorCount: 8,
    activeSessions: 312,
    ragCoverage: 72,
    averageLatencyMs: 820,
  },
  usage: [
    { date: "2026-01-01", sessions: 120, ragUsage: 68 },
    { date: "2026-01-02", sessions: 154, ragUsage: 70 },
    { date: "2026-01-03", sessions: 180, ragUsage: 75 },
    { date: "2026-01-04", sessions: 162, ragUsage: 72 },
    { date: "2026-01-05", sessions: 210, ragUsage: 78 },
    { date: "2026-01-06", sessions: 198, ragUsage: 74 },
    { date: "2026-01-07", sessions: 224, ragUsage: 79 },
  ],
  counselors: [
    {
      id: "michele",
      name: "ミシェル",
      specialty: "テープ式心理学",
      ragEnabled: true,
      conversations: 1280,
      satisfaction: 96,
      avgResponseMs: 640,
    },
    {
      id: "clinical",
      name: "臨床心理カウンセラー",
      specialty: "臨床心理学",
      ragEnabled: true,
      conversations: 780,
      satisfaction: 92,
      avgResponseMs: 870,
    },
    {
      id: "industrial",
      name: "産業メンタルコーチ",
      specialty: "産業心理学",
      ragEnabled: true,
      conversations: 640,
      satisfaction: 88,
      avgResponseMs: 910,
    },
    {
      id: "welfare",
      name: "精神保健福祉士AI",
      specialty: "福祉・支援制度",
      ragEnabled: true,
      conversations: 502,
      satisfaction: 85,
      avgResponseMs: 980,
    },
  ],
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  if (!hasSupabaseConfig()) {
    return FALLBACK_METRICS;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("analytics_admin_view")
      .select("summary, usage, counselors")
      .single();

    if (error || !data) {
      return FALLBACK_METRICS;
    }

    return data as AdminMetrics;
  } catch (error) {
    console.error("Failed to fetch admin metrics", error);
    return FALLBACK_METRICS;
  }
}
