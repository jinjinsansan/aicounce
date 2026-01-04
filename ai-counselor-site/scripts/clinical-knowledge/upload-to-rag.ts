#!/usr/bin/env ts-node
import { spawn } from "child_process";
import { promises as fs } from "fs";
import { join, relative } from "path";
import { config } from "dotenv";
import OpenAI from "openai";

config({ path: join(process.cwd(), ".env.local"), override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() ?? "";

const DATA_ROOT = join(process.cwd(), "data/clinical_psych_rag");
const PARENTS_DIR = join(DATA_ROOT, "parents");
const CHILDREN_DIR = join(DATA_ROOT, "children");

const EMBEDDING_MODEL = "text-embedding-3-small";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Supabase環境変数 (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) が不足しています");
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY が設定されていません");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

type ParentRecord = {
  chunkId: string;
  parentIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  sourcePath: string;
};

type ChildRecord = {
  parentChunkId: string;
  childId: string;
  childIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  sourcePath: string;
};

const FRONT_MATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

const listSubdirectories = async (dir: string) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
};

const listMarkdownFiles = async (dir: string) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
};

const stripFrontMatter = (raw: string) => {
  const normalized = raw.replace(/\r\n/g, "\n").trimStart();
  const match = normalized.match(FRONT_MATTER_REGEX);
  if (!match) {
    return { body: raw.trim(), frontMatter: null };
  }

  const frontMatter = match[1].trim();
  const body = normalized.slice(match[0].length).trim();
  return { body, frontMatter };
};

const extractParentChunkId = (fileName: string) => {
  const match = fileName.match(/^(\d{2}-\d{2})/);
  if (!match) {
    throw new Error(`親チャンクファイル名からchunk_idを抽出できません: ${fileName}`);
  }
  return match[1];
};

const extractChildIdentifiers = (fileName: string) => {
  const match = fileName.match(/^(\d{2}-\d{2})-c(\d{2})/);
  if (!match) {
    throw new Error(`子チャンクファイル名からparent/child IDを抽出できません: ${fileName}`);
  }
  return {
    parentChunkId: match[1],
    childId: `${match[1]}-c${match[2]}`,
    childIndex: Number(match[2]) - 1,
  };
};

const loadParentRecords = async (): Promise<ParentRecord[]> => {
  const lectures = await listSubdirectories(PARENTS_DIR);
  const records: ParentRecord[] = [];
  let runningIndex = 0;

  for (const lecture of lectures) {
    const lectureDir = join(PARENTS_DIR, lecture);
    const files = await listMarkdownFiles(lectureDir);
    for (const fileName of files) {
      const filePath = join(lectureDir, fileName);
      const raw = await fs.readFile(filePath, "utf8");
      const { body, frontMatter } = stripFrontMatter(raw);
      const chunkId = extractParentChunkId(fileName);

      records.push({
        chunkId,
        parentIndex: runningIndex,
        content: body,
        metadata: {
          lecture,
          file_name: fileName,
          chunk_id: chunkId,
          front_matter: frontMatter,
        },
        sourcePath: relative(DATA_ROOT, filePath),
      });

      runningIndex += 1;
    }
  }

  return records;
};

const loadChildRecords = async (): Promise<ChildRecord[]> => {
  const lectures = await listSubdirectories(CHILDREN_DIR);
  const records: ChildRecord[] = [];

  for (const lecture of lectures) {
    const lectureDir = join(CHILDREN_DIR, lecture);
    const files = await listMarkdownFiles(lectureDir);
    for (const fileName of files) {
      const filePath = join(lectureDir, fileName);
      const raw = await fs.readFile(filePath, "utf8");
      const { body, frontMatter } = stripFrontMatter(raw);
      const { parentChunkId, childId, childIndex } = extractChildIdentifiers(fileName);

      records.push({
        parentChunkId,
        childId,
        childIndex,
        content: body,
        metadata: {
          lecture,
          file_name: fileName,
          parent_chunk_id: parentChunkId,
          child_id: childId,
          front_matter: frontMatter,
        },
        sourcePath: relative(DATA_ROOT, filePath),
      });
    }
  }

  return records;
};

const generateEmbedding = async (text: string) => {
  const input = text.trim();
  if (!input) return [];

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
  });

  return response.data[0]?.embedding ?? [];
};

const supabaseRequest = async <T>(path: string, init: { method?: string; headers?: Record<string, string>; body?: Record<string, unknown> | string | null } = {}): Promise<T> => {
  const bodyPayload =
    typeof init.body === "string"
      ? init.body
      : init.body
        ? JSON.stringify(init.body)
        : null;

  const payload = JSON.stringify({
    path,
    method: init.method ?? "GET",
    headers: init.headers ?? {},
    body: bodyPayload,
  });

  return await new Promise<T>((resolve, reject) => {
    const child = spawn("python3", ["scripts/utils/supabase_rest_request.py"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SUPABASE_REST_URL: `${SUPABASE_URL}/rest/v1`,
        SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_KEY,
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => reject(error));

    child.on("close", () => {
      let parsed: { ok?: boolean; status?: number; body?: string } = {};
      try {
        parsed = JSON.parse(stdout || "{}");
      } catch (error) {
        return reject(new Error(stderr || `Supabase bridge parsing failed: ${error}`));
      }

      if (!parsed.ok) {
        return reject(new Error(parsed.body || stderr || "Supabase request failed"));
      }

      if (parsed.body) {
        try {
          resolve(JSON.parse(parsed.body) as T);
          return;
        } catch {
          resolve(parsed.body as T);
          return;
        }
      }

      resolve(undefined as T);
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
};

const clearExistingData = async () => {
  console.log("🧹 既存の臨床心理学ナレッジを削除しています...");
  await supabaseRequest("clinical_knowledge_children?id=neq.00000000-0000-0000-0000-000000000000", {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  await supabaseRequest("clinical_knowledge_parents?id=neq.00000000-0000-0000-0000-000000000000", {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  console.log("✅ 削除完了");
};

const insertParents = async (parents: ParentRecord[]) => {
  const parentIdMap = new Map<string, string>();
  let processed = 0;

  for (const parent of parents) {
    const result = await supabaseRequest<Array<{ id: string }>>("clinical_knowledge_parents", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: {
        content: parent.content,
        source: parent.sourcePath,
        parent_index: parent.parentIndex,
        metadata: parent.metadata,
      },
    });

    if (!result[0]?.id) {
      throw new Error("親チャンクの挿入に失敗しました");
    }

    parentIdMap.set(parent.chunkId, result[0].id);
    processed += 1;

    if (processed % 10 === 0 || processed === parents.length) {
      console.log(`📥 親チャンク ${processed}/${parents.length}`);
    }
  }

  return parentIdMap;
};

const insertChildren = async (children: ChildRecord[], parentIdMap: Map<string, string>) => {
  let processed = 0;

  for (const child of children) {
    const parentId = parentIdMap.get(child.parentChunkId);
    if (!parentId) {
      console.warn(`⚠️ parent_id=${child.parentChunkId} が見つからないため子チャンクをスキップ: ${child.childId}`);
      continue;
    }

    const embedding = await generateEmbedding(child.content);
    await supabaseRequest("clinical_knowledge_children", {
      method: "POST",
      body: {
        parent_id: parentId,
        content: child.content,
        child_index: child.childIndex,
        embedding,
        metadata: child.metadata,
      },
    });

    processed += 1;
    if (processed % 25 === 0 || processed === children.length) {
      console.log(`🧠 子チャンク ${processed}/${children.length}`);
    }
  }
};

async function main() {
  const clear = process.argv.includes("--clear");
  console.log("🔍 臨床心理学RAGデータを読み込み中...");

  const parents = await loadParentRecords();
  const children = await loadChildRecords();

  console.log(`📚 親チャンク: ${parents.length}件 / 子チャンク: ${children.length}件`);

  if (clear) {
    await clearExistingData();
  }

  const parentIdMap = await insertParents(parents);
  await insertChildren(children, parentIdMap);

  console.log("🎉 臨床心理学ナレッジのアップロードが完了しました");
}

main().catch((error) => {
  console.error("❌ アップロード中にエラーが発生しました", error);
  process.exit(1);
});
