#!/usr/bin/env ts-node
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

import { chunkTextSinr } from "./chunk-sinr";

config({ path: join(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() || "";

const EMBEDDING_MODEL = "text-embedding-3-small";
const KNOWLEDGE_JSON = join(process.cwd(), "data/michelle-knowledge.json");

type KnowledgeChunk = {
  id: string;
  title: string;
  sourceTitle?: string;
  relativePath: string;
  content: string;
  chunkIndex?: number;
  sectionHeading?: string | null;
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Supabase環境変数が設定されていません");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY環境変数が設定されていません");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function loadKnowledgeChunks(): KnowledgeChunk[] {
  try {
    const raw = readFileSync(KNOWLEDGE_JSON, "utf-8");
    const data = JSON.parse(raw) as KnowledgeChunk[];
    return data;
  } catch (error) {
    console.error("❌ 知識インデックスの読み込みに失敗しました", error);
    process.exit(1);
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
  });
  return response.data[0]?.embedding ?? [];
}

async function insertParent(parent: { content: string; source: string; parentIndex: number; metadata: Record<string, unknown> }) {
  const { data, error } = await supabase
    .from("michelle_knowledge_parents")
    .insert({
      content: parent.content,
      source: parent.source,
      parent_index: parent.parentIndex,
      metadata: parent.metadata,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to insert parent chunk");
  }
  return data.id as string;
}

async function insertChild(parentId: string, childContent: string, childIndex: number, metadata: Record<string, unknown>) {
  const embedding = await generateEmbedding(childContent);
  const { error } = await supabase.from("michelle_knowledge_children").insert({
    parent_id: parentId,
    content: childContent,
    child_index: childIndex,
    embedding,
    metadata,
  });

  if (error) {
    throw error;
  }
}

async function main() {
  const clearExisting = process.argv.includes("--clear");
  const chunks = loadKnowledgeChunks();
  console.log(`📚 ${chunks.length} チャンクを読み込みました`);

  if (clearExisting) {
    console.log("🗑️  既存データをクリアしています...");
    await supabase.from("michelle_knowledge_children").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("michelle_knowledge_parents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("michelle_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("✅ クリア完了");
  }

  // グルーピングして元テキストを復元
  const grouped = new Map<string, KnowledgeChunk[]>();
  for (const chunk of chunks) {
    const list = grouped.get(chunk.relativePath) ?? [];
    list.push(chunk);
    grouped.set(chunk.relativePath, list);
  }

  let processedDocs = 0;
  for (const [relativePath, docChunks] of grouped.entries()) {
    processedDocs += 1;
    const sorted = docChunks.sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));
    const fullText = sorted.map((c) => c.content).join("\n\n");
    const parents = chunkTextSinr(fullText);

    console.log(`\n[${processedDocs}/${grouped.size}] ${relativePath} parents=${parents.length}`);

    const metadataBase: Record<string, unknown> = {
      source_title: sorted[0]?.sourceTitle ?? sorted[0]?.title ?? relativePath,
      source_path: relativePath,
    };

    // 同時に通常RAGテーブルにも登録（フォールバック用）
    for (const [idx, parent] of parents.entries()) {
      const parentMetadata = { ...metadataBase, parent_index: idx };
      const parentId = await insertParent({
        content: parent.content,
        source: relativePath,
        parentIndex: idx,
        metadata: parentMetadata,
      });

      // Original table
      const parentEmbedding = await generateEmbedding(parent.content);
      await supabase.from("michelle_knowledge").insert({
        content: parent.content,
        embedding: parentEmbedding,
        metadata: parentMetadata,
      });

      for (const child of parent.children) {
        const childMetadata = { ...metadataBase, parent_index: idx, child_index: child.index };
        await insertChild(parentId, child.content, child.index, childMetadata);
      }
    }
  }

  console.log("\n🎉 アップロード完了");
}

main().catch((error) => {
  console.error("❌ エラー:", error);
  process.exit(1);
});
