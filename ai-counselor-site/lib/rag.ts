import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";

async function createEmbedding(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!response.ok) {
      console.error("Embedding API error", await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding ?? null;
  } catch (error) {
    console.error("Failed to generate embedding", error);
    return null;
  }
}

type RagChunkMatch = {
  id: string;
  document_id: string;
  parent_chunk_id: string | null;
  chunk_text: string;
  similarity: number;
};

export async function searchRagContext(
  counselorId: string,
  query: string,
  matchCount = 5,
) {
  if (!hasSupabaseConfig() || !process.env.OPENAI_API_KEY) {
    return { context: "", sources: [] };
  }

  const embedding = await createEmbedding(query);
  if (!embedding) {
    return { context: "", sources: [] };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("match_rag_chunks", {
      counselor_id: counselorId,
      match_count: matchCount,
      query_embedding: embedding,
    });

    if (error || !data) {
      console.error("RAG match RPC error", error);
      return { context: "", sources: [] };
    }

    const context = data
      .map(
        (chunk: RagChunkMatch, index: number) =>
          `[ソース ${index + 1}] (score: ${chunk.similarity.toFixed(2)})\n${chunk.chunk_text}`,
      )
      .join("\n\n");

    return {
      context,
      sources: data as RagChunkMatch[],
    };
  } catch (error) {
    console.error("RAG search failure", error);
    return { context: "", sources: [] };
  }
}

type InsertChunkPayload = {
  counselorId: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
};

const PARENT_SIZE = 600;
const CHILD_SIZE = 200;
const OVERLAP = 50;

function chunkText(text: string, size: number, overlap: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  for (let i = 0; i < normalized.length; i += size - overlap) {
    chunks.push(normalized.slice(i, i + size));
  }
  return chunks;
}

export async function insertRagDocument(payload: InsertChunkPayload) {
  if (!hasServiceRole()) {
    throw new Error("Service role key is required to insert RAG data");
  }

  const supabase = getServiceSupabase();

  const { data: doc, error: docError } = await supabase
    .from("rag_documents")
    .insert([
      {
        counselor_id: payload.counselorId,
        source_type: payload.sourceType,
        source_id: payload.sourceId,
        title: payload.title,
        content: payload.content,
      },
    ])
    .select()
    .single();

  if (docError || !doc) {
    throw docError ?? new Error("Failed to create RAG document");
  }

  const parentChunks = chunkText(payload.content, PARENT_SIZE, OVERLAP);

  const parentPromises = parentChunks.map(async (chunkText, index) => {
    const embedding = await createEmbedding(chunkText);
    const { data: parent, error: parentError } = await supabase
      .from("rag_chunks")
      .insert([
        {
          document_id: doc.id,
          chunk_text: chunkText,
          chunk_index: index,
          embedding,
        },
      ])
      .select()
      .single();

    if (parentError || !parent) {
      throw parentError ?? new Error("Failed to insert parent chunk");
    }

    const childChunks = chunkText(chunkText, CHILD_SIZE, OVERLAP);
    for (let childIndex = 0; childIndex < childChunks.length; childIndex++) {
      const childEmbedding = await createEmbedding(childChunks[childIndex]);
      await supabase.from("rag_chunks").insert([
        {
          document_id: doc.id,
          parent_chunk_id: parent.id,
          chunk_text: childChunks[childIndex],
          chunk_index: childIndex,
          embedding: childEmbedding,
        },
      ]);
    }
  });

  await Promise.all(parentPromises);

  return doc.id;
}
