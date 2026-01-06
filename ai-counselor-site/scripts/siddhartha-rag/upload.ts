#!/usr/bin/env ts-node

import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { SIDDHARTHA_SYSTEM_PROMPT } from "../../lib/team/prompts/siddhartha.ts";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const COUNSELOR_ID = "siddhartha";
const SOURCE_DIR = path.resolve(
  process.cwd(),
  "data/buddha-rag/buddha_chunks_final/parent",
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const openaiKey = process.env.OPENAI_API_KEY?.trim();

if (!supabaseUrl || !serviceKey) {
  throw new Error("Supabase service-role credentials are not configured");
}

if (!openaiKey) {
  throw new Error("OPENAI_API_KEY is required to generate embeddings");
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
async function createEmbedding(text: string) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Embedding API error: ${detail}`);
  }

  const data = await response.json();
  return data.data?.[0]?.embedding ?? [];
}

const PARENT_SIZE = 600;
const OVERLAP = 50;

function chunkText(text: string, size: number, overlap: number) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += size - overlap) {
    chunks.push(normalized.slice(i, i + size));
  }
  return chunks;
}

async function insertRagDocument(payload: {
  counselorId: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
}) {
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

  const childDir = path.resolve(
    process.cwd(),
    "data/buddha-rag/buddha_chunks_final/child",
  );

  const childFiles = fs
    .readdirSync(childDir)
    .filter((file) =>
      file.startsWith(payload.sourceId.replace(/_parent$/, "") + "_child_") &&
      file.endsWith(".md"),
    )
    .sort((a, b) => {
      const extractIndex = (name: string) => {
        const match = name.match(/_child_(\d+)\.md$/);
        return match ? Number.parseInt(match[1], 10) : 0;
      };
      return extractIndex(a) - extractIndex(b);
    });

  const hasProvidedChildren = childFiles.length > 0;
  const parentChunks = hasProvidedChildren
    ? [payload.content]
    : chunkText(payload.content, PARENT_SIZE, OVERLAP);

  for (const [index, chunkContent] of parentChunks.entries()) {
    const embedding = await createEmbedding(chunkContent);
    const { data: parent, error: parentError } = await supabase
      .from("rag_chunks")
      .insert([
        {
          document_id: doc.id,
          chunk_text: chunkContent,
          chunk_index: index,
          embedding,
        },
      ])
      .select()
      .single();

    if (parentError || !parent) {
      throw parentError ?? new Error("Failed to insert parent chunk");
    }

    if (hasProvidedChildren) {
      for (const [childIndex, filename] of childFiles.entries()) {
        const childPath = path.join(childDir, filename);
        const childContent = fs.readFileSync(childPath, "utf8").trim();
        const childEmbedding = await createEmbedding(childContent);
        const { error: childError } = await supabase.from("rag_chunks").insert([
          {
            document_id: doc.id,
            parent_chunk_id: parent.id,
            chunk_text: childContent,
            chunk_index: childIndex,
            embedding: childEmbedding,
          },
        ]);

        if (childError) {
          throw childError;
        }
      }
      continue;
    }

    const fallbackChildChunks = chunkText(chunkContent, 200, OVERLAP);
    for (const [childIndex, childContent] of fallbackChildChunks.entries()) {
      const childEmbedding = await createEmbedding(childContent);
      const { error: childError } = await supabase.from("rag_chunks").insert([
        {
          document_id: doc.id,
          parent_chunk_id: parent.id,
          chunk_text: childContent,
          chunk_index: childIndex,
          embedding: childEmbedding,
        },
      ]);

      if (childError) {
        throw childError;
      }
    }
  }

  return doc.id;
}

type ParsedDocument = {
  sourceId: string;
  title: string;
  content: string;
};

function parseMarkdown(filePath: string): ParsedDocument {
  const raw = fs.readFileSync(filePath, "utf8");
  let metadata = "";
  let body = raw;

  if (raw.startsWith("---")) {
    const closingIndex = raw.indexOf("\n---", 3);
    if (closingIndex !== -1) {
      metadata = raw.slice(3, closingIndex).trim();
      body = raw.slice(closingIndex + 4);
    }
  }

  const normalizedBody = body.trim();
  const headingMatch = normalizedBody.match(/^#\s*(.+)$/m);
  const title = headingMatch?.[1]?.trim() ?? path.basename(filePath);

  const parts = [] as string[];
  if (metadata) {
    parts.push(`metadata:\n${metadata}`);
  }
  if (normalizedBody) {
    parts.push(normalizedBody);
  }

  return {
    sourceId: path.basename(filePath, path.extname(filePath)),
    title,
    content: parts.join("\n\n").trim(),
  };
}

async function upsertCounselor() {
  const payload = {
    id: COUNSELOR_ID,
    name: "シッダールタ",
    specialty: "仏教カウンセラー",
    description:
      "仏教経典に基づき、慈悲と智慧の教えで心の平安へと導きます。四聖諦・八正道など仏の教えを現代の言葉でお伝えします。",
    icon_url: "/images/counselors/siddhartha.png",
    system_prompt: SIDDHARTHA_SYSTEM_PROMPT,
    model_type: "openai",
    model_name: "gpt-4o-mini",
    rag_enabled: true,
    rag_source_id: "buddha_chunks_v1",
  };

  const { error } = await supabase
    .from("counselors")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    throw new Error(`Failed to upsert counselor: ${error.message}`);
  }

  console.log("✓ Counselor metadata upserted");
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source directory not found: ${SOURCE_DIR}`);
  }

  await upsertCounselor();

  console.log("Clearing existing RAG documents for counselor...");
  const { error: clearError } = await supabase
    .from("rag_documents")
    .delete()
    .eq("counselor_id", COUNSELOR_ID);
  if (clearError) {
    throw new Error(`Failed to clear existing RAG documents: ${clearError.message}`);
  }

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    throw new Error("No RAG chunk files found");
  }

  console.log(`Inserting ${files.length} RAG documents for ${COUNSELOR_ID}...`);

  for (const file of files) {
    const doc = parseMarkdown(path.join(SOURCE_DIR, file));
    const docId = await insertRagDocument({
      counselorId: COUNSELOR_ID,
      sourceType: "scripture",
      sourceId: doc.sourceId,
      title: doc.title,
      content: doc.content,
    });
    console.log(`  • ${doc.sourceId} -> ${docId}`);
  }

  console.log("🎉 Siddhartha counselor RAG import complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
