import { searchRagContext } from "@/lib/rag";
import { getServiceSupabase } from "@/lib/supabase-server";
import { callOpenAI } from "@/lib/llm";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";

type DiaryConfig = {
  id: string;
  name: string;
  avatarUrl: string | null;
  model: string;
};

const DAILY_POST_HOUR_JST = 8;

const COUNSELOR_DIARY_CONFIGS: DiaryConfig[] = FALLBACK_COUNSELORS.filter(
  (counselor) => !counselor.comingSoon,
).map((counselor) => ({
  id: counselor.id,
  name: counselor.name,
  avatarUrl: counselor.iconUrl ?? null,
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

async function generateDiaryBody(config: DiaryConfig) {
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

  const result = await callOpenAI({
    systemPrompt,
    model: config.model,
    ragContext: context,
    messages: [
      {
        role: "user",
        content: "朝のショートメッセージを出力フォーマット通りに作ってください。",
      },
    ],
  });

  const normalized = normalizeDiaryContent(result.content || "");
  const metadataSources = (sources ?? []).slice(0, 3).map((src) => ({
    chunk_id: src.id,
    document_id: (src as any).document_id ?? null,
    parent_chunk_id: (src as any).parent_chunk_id ?? null,
    similarity: (src as any).similarity ?? null,
  }));

  return { content: normalized, sources: metadataSources };
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

  for (const config of COUNSELOR_DIARY_CONFIGS) {
    if (!options.force && jst.hour < DAILY_POST_HOUR_JST) {
      results.push({ authorId: config.id, posted: false, reason: "before_schedule" });
      continue;
    }

    const already = await hasDiaryForDate(config.id, jst.dateString);
    if (already) {
      results.push({ authorId: config.id, posted: false, reason: "already_posted" });
      continue;
    }

    try {
      const { content, sources } = await generateDiaryBody(config);
      if (!content.trim()) {
        results.push({ authorId: config.id, posted: false, reason: "empty_content" });
        continue;
      }

      const entryId = await upsertDiaryEntry({
        author_id: config.id,
        author_name: config.name,
        author_avatar_url: config.avatarUrl,
        title: `${config.name}の朝のひとこと` as string,
        content,
        published_at: jst.isoNow,
        journal_date: jst.dateString,
        metadata: { sources },
      });

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
    const supabase = getServiceSupabase();
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
    const supabase = getServiceSupabase();
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
