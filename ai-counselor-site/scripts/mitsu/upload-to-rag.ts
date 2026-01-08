import { promises as fs } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";

import { insertRagDocument } from "../../lib/rag.ts";
import { hasServiceRole } from "../../lib/supabase-server.ts";

const ROOT_DIR = process.cwd();
loadEnv({ path: path.join(ROOT_DIR, ".env.local"), override: true });

const PARENT_DIR = path.join(ROOT_DIR, "data/mitsu-rag/chunks/parent");
const CHILD_DIR = path.join(ROOT_DIR, "data/mitsu-rag/chunks/child");
const COUNSELOR_ID = "mitsu";
const SOURCE_TYPE = "mitsu_words";

if (!hasServiceRole()) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY が設定されていません");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY が設定されていません");
  process.exit(1);
}

type Chunk = {
  id: string;
  title: string;
  content: string;
  sourceType: string;
};

const parseChunk = async (filePath: string): Promise<Chunk> => {
  const raw = await fs.readFile(filePath, "utf-8");
  const match = raw.match(/^---\s*([\s\S]+?)\s*---\s*([\s\S]*)$/);
  const hasFrontMatter = Boolean(match);
  const frontMatter = hasFrontMatter ? match?.[1] ?? "" : "";
  const body = (hasFrontMatter ? match?.[2] : raw)?.trim() ?? "";

  if (!body) {
    throw new Error(`本文が空です: ${filePath}`);
  }

  const metadataLines = frontMatter.split(/\r?\n/).filter(Boolean);
  const metadata: Record<string, string | string[]> = {};
  for (const line of metadataLines) {
    const [rawKey, ...rawValueParts] = line.split(":");
    if (!rawKey || rawValueParts.length === 0) continue;
    const key = rawKey.trim();
    const rawValue = rawValueParts.join(":").trim();
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      metadata[key] = rawValue
        .slice(1, -1)
        .split(",")
        .map((value) => value.replace(/"/g, "").trim())
        .filter(Boolean);
    } else {
      metadata[key] = rawValue.replace(/"/g, "").trim();
    }
  }

  const id = typeof metadata.id === "string" ? metadata.id : path.basename(filePath, ".md");
  const headingLine = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? id;
  const title = headingLine.replace(/^#+\s*/, "").trim() || id;
  const sourceType = typeof metadata.source === "string" ? metadata.source : SOURCE_TYPE;

  return { id, title, content: body, sourceType };
};

async function loadChunks(dir: string): Promise<Chunk[]> {
  const entries = await fs.readdir(dir);
  const markdownFiles = entries.filter((file) => file.endsWith(".md"));
  const chunks: Chunk[] = [];

  for (const file of markdownFiles) {
    const filePath = path.join(dir, file);
    chunks.push(await parseChunk(filePath));
  }

  return chunks;
}

async function main() {
  const parents = await loadChunks(PARENT_DIR);
  const children = await loadChunks(CHILD_DIR);
  const allChunks = [...parents, ...children];

  if (allChunks.length === 0) {
    console.error("❌ アップロード対象のチャンクが見つかりません");
    process.exit(1);
  }

  console.log(`📚 チャンクを読み込みました: 親 ${parents.length} / 子 ${children.length}`);

  for (const [index, chunk] of allChunks.entries()) {
    console.log(`➡️  [${index + 1}/${allChunks.length}] ${chunk.id} - ${chunk.title}`);
    await insertRagDocument({
      counselorId: COUNSELOR_ID,
      sourceType: chunk.sourceType,
      sourceId: chunk.id,
      title: chunk.title,
      content: chunk.content,
    });
  }

  console.log("✅ MITSU のRAGデータをSupabaseに登録しました");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
