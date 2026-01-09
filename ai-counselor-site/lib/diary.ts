import { searchRagContext } from "@/lib/rag";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import { callLLM } from "@/lib/llm";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";

type DiaryConfig = {
  id: string;
  name: string;
  avatarUrl: string | null;
  provider: string;
  model: string;
};

const DAILY_POST_HOUR_JST = 8;

const getReadableSupabase = () => {
  if (hasServiceRole()) return getServiceSupabase();
  if (hasSupabaseConfig()) return getSupabaseClient();
  throw new Error("Supabase credentials are not configured");
};

const COUNSELOR_DIARY_CONFIGS: DiaryConfig[] = FALLBACK_COUNSELORS.filter(
  (counselor) => !counselor.comingSoon,
).map((counselor) => ({
  id: counselor.id,
  name: counselor.name,
  avatarUrl: counselor.iconUrl ?? null,
  provider: counselor.modelType ?? "openai",
  model: counselor.modelName ?? "gpt-4o-mini",
}));

type DiaryEntryInsert = {
  author_id: string;
  author_name: string;
  author_avatar_url?: string | null;
  title: string | null;
  content: string;
  published_at?: string;
  journal_date: string;
  is_shareable?: boolean;
  metadata?: Record<string, unknown> | null;
};

type DiaryEntrySummary = {
  author_id: string;
  content: string;
};

type DiarySourceMetadata = {
  chunk_id: string;
  document_id: string | null;
  parent_chunk_id: string | null;
  similarity: number | null;
};

type DiaryBodyResult = {
  content: string;
  sources: DiarySourceMetadata[];
};

const MAX_UNIQUE_GENERATION_ATTEMPTS = 3;
const DIARY_SIMILARITY_THRESHOLD = 0.82;

const toJstContext = (now = new Date()) => {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";

  const year = part("year");
  const month = part("month");
  const day = part("day");
  const hour = Number(part("hour"));
  const minute = Number(part("minute"));

  return {
    dateString: `${year}-${month}-${day}`,
    isoNow: now.toISOString(),
    hour,
    minute,
  };
};

const sanitizeLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^[\d\-•*]+[).\s]*/u, ""));

const normalizeDiaryContent = (raw: string): string => {
  const lines = sanitizeLines(raw);
  if (lines.length < 3) {
    return lines.join("\n");
  }
  const trimmed = lines.slice(0, 5).map((line) => (line.length > 42 ? `${line.slice(0, 40).trim()}…` : line));
  return trimmed.join("\n");
};

const buildCharacterBigrams = (text: string): Set<string> => {
  const normalized = text
    .toLowerCase()
    .replace(/[\s\u3000]+/gu, "")
    .replace(/[^\p{L}\p{N}ぁ-んァ-ヶ一-龯ー。、。,.!?]/gu, "");

  const grams = new Set<string>();
  if (!normalized) return grams;
  if (normalized.length === 1) {
    grams.add(normalized);
    return grams;
  }
  for (let i = 0; i < normalized.length - 1; i += 1) {
    grams.add(normalized.slice(i, i + 2));
  }
  return grams;
};

const calculateTextSimilarity = (a: string, b: string): number => {
  if (!a.trim() || !b.trim()) return 0;
  const gramsA = buildCharacterBigrams(a);
  const gramsB = buildCharacterBigrams(b);
  if (!gramsA.size || !gramsB.size) return 0;

  let intersection = 0;
  for (const gram of gramsA) {
    if (gramsB.has(gram)) {
      intersection += 1;
    }
  }
  const union = gramsA.size + gramsB.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
};

async function fetchDiaryEntriesForDate(dateString: string): Promise<DiaryEntrySummary[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("diary_entries")
    .select("author_id, content")
    .eq("journal_date", dateString)
    .is("deleted_at", null);

  if (error) {
    console.error("Failed to fetch diary entries for similarity check", error);
    return [];
  }

  return (data ?? [])
    .map((row) => ({ author_id: row.author_id, content: row.content ?? "" }))
    .filter((row) => row.content.trim().length > 0);
}

const findMostSimilarEntry = (content: string, entries: DiaryEntrySummary[]) => {
  let bestScore = 0;
  let bestEntry: DiaryEntrySummary | null = null;
  for (const entry of entries) {
    const score = calculateTextSimilarity(content, entry.content);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }
  return { entry: bestEntry, score: bestScore };
};

async function generateDiaryBody(config: DiaryConfig): Promise<DiaryBodyResult> {
  const { context, sources } = await searchRagContext(
    config.id,
    "今日の利用者向けに短いヒントを作るための重要ポイント",
    4,
  );

  const systemPrompt = `あなたは${config.name}というAIカウンセラーです。以下の参考情報（RAG）を踏まえ、朝のショートメッセージを作成してください。必ず次を守る:
- 3〜5行
- 各行40文字以内
- 挨拶・箇条書き記号・番号・絵文字は禁止
- RAGの内容のみを要約し、実践的なヒントを示す`;

  const providerMissingKey =
    (config.provider === "gemini" && !process.env.GEMINI_API_KEY) ||
    (config.provider === "claude" && !process.env.ANTHROPIC_API_KEY) ||
    (config.provider === "deepseek" && !process.env.DEEPSEEK_API_KEY);

  const provider = providerMissingKey ? "openai" : config.provider;
  const model = providerMissingKey ? "gpt-4o-mini" : config.model;

  const result = await callLLM(
    provider,
    model,
    systemPrompt,
    "朝のショートメッセージを出力フォーマット通りに作ってください。",
    context,
  );

  const normalized = normalizeDiaryContent(result.content || "");
  const metadataSources: DiarySourceMetadata[] = (sources ?? []).slice(0, 3).map((src) => ({
    chunk_id: src.id,
    document_id: (src as any).document_id ?? null,
    parent_chunk_id: (src as any).parent_chunk_id ?? null,
    similarity: (src as any).similarity ?? null,
  }));

  return { content: normalized, sources: metadataSources };
}

type UniqueDiaryGenerationSuccess = {
  success: true;
  content: string;
  sources: DiarySourceMetadata[];
  attempts: number;
  similarityScore: number;
};

type UniqueDiaryGenerationFailure = {
  success: false;
  reason: "empty_content" | "duplicate_content";
};

type UniqueDiaryGenerationResult = UniqueDiaryGenerationSuccess | UniqueDiaryGenerationFailure;

async function generateUniqueDiaryContent(
  config: DiaryConfig,
  existingEntries: DiaryEntrySummary[],
): Promise<UniqueDiaryGenerationResult> {
  let sawEmptyContent = false;

  for (let attempt = 0; attempt < MAX_UNIQUE_GENERATION_ATTEMPTS; attempt += 1) {
    const { content, sources } = await generateDiaryBody(config);
    if (!content.trim()) {
      sawEmptyContent = true;
      continue;
    }

    const { score } = findMostSimilarEntry(content, existingEntries);
    if (!score || score < DIARY_SIMILARITY_THRESHOLD) {
      return {
        success: true,
        content,
        sources,
        attempts: attempt + 1,
        similarityScore: score ?? 0,
      };
    }
  }

  return {
    success: false,
    reason: sawEmptyContent ? "empty_content" : "duplicate_content",
  };
}

async function upsertDiaryEntry(payload: DiaryEntryInsert) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("diary_entries")
    .upsert({
      author_id: payload.author_id,
      author_name: payload.author_name,
      author_avatar_url: payload.author_avatar_url ?? null,
      title: payload.title,
      content: payload.content,
      published_at: payload.published_at ?? new Date().toISOString(),
      journal_date: payload.journal_date,
      is_shareable: payload.is_shareable ?? true,
      metadata: (payload.metadata ?? null) as any,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to save diary entry");
  }

  return data.id as string;
}

async function hasDiaryForDate(authorId: string, dateString: string) {
  const supabase = getServiceSupabase();
  const { data } = await supabase
    .from("diary_entries")
    .select("id")
    .eq("author_id", authorId)
    .eq("journal_date", dateString)
    .is("deleted_at", null)
    .maybeSingle();

  return Boolean(data?.id);
}

export type DailyDiaryRunResult = {
  authorId: string;
  posted: boolean;
  reason?: string;
  entryId?: string;
};

export async function runDailyDiaries(options: { force?: boolean; now?: Date } = {}): Promise<DailyDiaryRunResult[]> {
  const now = options.now ?? new Date();
  const jst = toJstContext(now);
  const results: DailyDiaryRunResult[] = [];
  const todaysEntries = await fetchDiaryEntriesForDate(jst.dateString);

  for (const config of COUNSELOR_DIARY_CONFIGS) {
    if (!options.force && jst.hour < DAILY_POST_HOUR_JST) {
      results.push({ authorId: config.id, posted: false, reason: "before_schedule" });
      continue;
    }

    const alreadyLocal = todaysEntries.some((entry) => entry.author_id === config.id);
    const alreadyRemote = alreadyLocal ? true : await hasDiaryForDate(config.id, jst.dateString);
    if (alreadyRemote) {
      results.push({ authorId: config.id, posted: false, reason: "already_posted" });
      continue;
    }

    try {
      const uniqueGeneration = await generateUniqueDiaryContent(config, todaysEntries);
      if (!uniqueGeneration.success) {
        results.push({ authorId: config.id, posted: false, reason: uniqueGeneration.reason });
        continue;
      }
      const { content, sources, attempts, similarityScore } = uniqueGeneration;

      const entryId = await upsertDiaryEntry({
        author_id: config.id,
        author_name: config.name,
        author_avatar_url: config.avatarUrl,
        title: `${config.name}の朝のひとこと` as string,
        content,
        published_at: jst.isoNow,
        journal_date: jst.dateString,
        metadata: {
          sources,
          generation_attempts: attempts,
          similarity_threshold: DIARY_SIMILARITY_THRESHOLD,
          last_similarity_score: similarityScore,
        },
      });

      todaysEntries.push({ author_id: config.id, content });
      results.push({ authorId: config.id, posted: true, entryId });
    } catch (error) {
      console.error(`Failed to post diary for ${config.id}`, error);
      results.push({ authorId: config.id, posted: false, reason: "error" });
    }
  }

  return results;
}

export async function listDiaryEntries(limit = 20, cursor?: string | null) {
  try {
    const supabase = getReadableSupabase();
    let query = supabase
      .from("diary_entries")
      .select("id, author_id, author_name, author_avatar_url, title, content, published_at, journal_date, share_count")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("published_at", cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const hasNext = (data?.length ?? 0) > limit;
    const sliced = hasNext ? (data ?? []).slice(0, limit) : data ?? [];
    const nextCursor = hasNext ? sliced[sliced.length - 1]?.published_at ?? null : null;
    return { entries: sliced, nextCursor };
  } catch (error) {
    console.error("Failed to list diary entries", error);
    return { entries: [], nextCursor: null };
  }
}

export async function getDiaryEntry(entryId: string) {
  try {
    const supabase = getReadableSupabase();
    const { data, error } = await supabase
      .from("diary_entries")
      .select("id, author_id, author_name, author_avatar_url, title, content, published_at, journal_date, share_count, is_shareable")
      .eq("id", entryId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Failed to get diary entry", error);
    return null;
  }
}

export async function incrementDiaryShare(entryId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.rpc("increment_diary_share_count", { target_entry_id: entryId });
  if (error) throw error;
  return data;
}
