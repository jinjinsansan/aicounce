import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";

type RagDocument = {
  id: string;
  counselor_id: string;
  title: string | null;
  source_type: string | null;
  source_id: string | null;
  created_at: string | null;
};

const FALLBACK_DOCUMENTS: RagDocument[] = [
  {
    id: "doc_michele_01",
    counselor_id: "michele",
    title: "テープ式心理学入門レクチャー",
    source_type: "youtube",
    source_id: "yt:playlist:starter",
    created_at: "2025-12-28T00:00:00.000Z",
  },
  {
    id: "doc_clinical_01",
    counselor_id: "clinical",
    title: "臨床心理学ケーススタディ",
    source_type: "manual",
    source_id: "docs/case-study.pdf",
    created_at: "2025-12-27T00:00:00.000Z",
  },
];

async function ensureSession() {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { session: null } as const;
  }

  return { session } as const;
}

export async function GET() {
  const { session } = await ensureSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceRole()) {
    return NextResponse.json({ documents: FALLBACK_DOCUMENTS, note: "Service role key is not configured; returning fallback data." });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("rag_documents")
      .select("id, counselor_id, title, source_type, source_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load RAG documents", error);
      return NextResponse.json({ documents: FALLBACK_DOCUMENTS, error: "Failed to fetch from Supabase" });
    }

    return NextResponse.json({ documents: data ?? [] });
  } catch (error) {
    console.error("Unexpected RAG list error", error);
    return NextResponse.json({ documents: FALLBACK_DOCUMENTS, error: "Unexpected error" });
  }
}

export async function POST(request: NextRequest) {
  const { session } = await ensureSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Service role Supabase key is not configured" },
      { status: 503 },
    );
  }

  const body = await request.json();
  const counselorId = body?.counselorId;
  const title = body?.title;
  const sourceType = body?.sourceType ?? "manual";
  const sourceId = body?.sourceId ?? null;

  if (!counselorId) {
    return NextResponse.json(
      { error: "counselorId is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("rag_documents")
      .insert([
        {
          counselor_id: counselorId,
          title: title ?? null,
          source_type: sourceType,
          source_id: sourceId,
          content: null,
          metadata: {
            submittedBy: session.user.id,
            submittedAt: new Date().toISOString(),
          },
        },
      ])
      .select("id, counselor_id, title, source_type, source_id, created_at")
      .single();

    if (error || !data) {
      console.error("Failed to create RAG document", error);
      return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }

    return NextResponse.json({ document: data });
  } catch (error) {
    console.error("Unexpected RAG insert error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
