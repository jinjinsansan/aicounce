import { getClinicalOpenAIClient } from "@/lib/clinical/openai";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import type { Json } from "@/types/supabase";

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_THRESHOLD = 0.65;
const FALLBACK_THRESHOLDS = [0.58, 0.5, 0.45, 0.35];

export type ClinicalKnowledgeMatch = {
  id: string;
  content: string;
  metadata: Json | null;
  source: string;
  similarity: number;
};

type RetrieveOptions = {
  matchCount?: number;
  similarityThreshold?: number;
};

type RpcRow = {
  parent_id: string;
  parent_content: string;
  parent_metadata: Json | null;
  parent_source: string;
  child_similarity: number;
};

const buildThresholds = (options: RetrieveOptions) =>
  [options.similarityThreshold ?? DEFAULT_THRESHOLD, ...FALLBACK_THRESHOLDS]
    .filter((value, index, arr) => value > 0 && arr.indexOf(value) === index)
    .sort((a, b) => b - a);

export const retrieveClinicalKnowledgeMatches = async (
  query: string,
  options: RetrieveOptions = {},
): Promise<ClinicalKnowledgeMatch[]> => {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  if (!hasServiceRole()) {
    console.error("[Clinical RAG] Service role key missing");
    return [];
  }

  const openai = getClinicalOpenAIClient();
  let embedding: number[] = [];

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: normalized,
    });
    embedding = embeddingResponse.data[0]?.embedding ?? [];
  } catch (error) {
    console.error("[Clinical RAG] Failed to create embedding", error);
    return [];
  }

  if (!embedding.length) {
    console.warn("[Clinical RAG] Empty embedding generated");
    return [];
  }

  const supabase = getServiceSupabase();
  const thresholds = buildThresholds(options);

  for (const threshold of thresholds) {
    try {
      const { data, error } = await supabase.rpc("match_clinical_knowledge_sinr", {
        query_embedding: embedding,
        match_count: options.matchCount ?? 8,
        similarity_threshold: threshold,
      } as never);

      if (error) {
        console.error(`[Clinical RAG] RPC error at threshold ${threshold}`, error);
        continue;
      }

      const matches = (data ?? []) as RpcRow[];
      if (matches.length) {
        return matches.map((row) => ({
          id: row.parent_id,
          content: row.parent_content,
          metadata: row.parent_metadata,
          source: row.parent_source,
          similarity: row.child_similarity,
        }));
      }
    } catch (rpcError) {
      console.error(`[Clinical RAG] Unexpected error at threshold ${threshold}`, rpcError);
    }
  }

  console.warn("[Clinical RAG] No matches returned for query");
  return [];
};
