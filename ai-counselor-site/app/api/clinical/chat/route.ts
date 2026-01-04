import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { CLINICAL_AI_ENABLED } from "@/lib/feature-flags";
import { clinicalEnv } from "@/lib/clinical/env.server";
import { getClinicalAssistantId, getClinicalOpenAIClient } from "@/lib/clinical/openai";
import { retrieveClinicalKnowledgeMatches } from "@/lib/clinical/rag";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";

const requestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
});

type OpenAIThreads = NonNullable<NonNullable<ReturnType<typeof getClinicalOpenAIClient>["beta"]>["threads"]>;

export async function POST(request: Request) {
  if (!CLINICAL_AI_ENABLED) {
    return NextResponse.json({ error: "Clinical AI is currently disabled" }, { status: 503 });
  }

  if (!clinicalEnv.openAiApiKey || !clinicalEnv.assistantId) {
    return NextResponse.json({ error: "OpenAI環境変数が不足しています" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (hasServiceRole()) {
    try {
      await getServiceSupabase()
        .from("users")
        .upsert(
          {
            id: session.user.id,
            email: session.user.email ?? `${session.user.id}@example.com`,
            username: session.user.user_metadata?.full_name ?? session.user.email ?? "User",
          },
          { onConflict: "id" },
        );
    } catch (error) {
      console.error("[Clinical Chat] Failed to upsert user profile", error);
    }
  }

  try {
    const { sessionId, threadId } = await resolveSession(
      supabase,
      session.user.id,
      parsed.data.sessionId,
      parsed.data.message,
    );

    console.log(`[Clinical Chat] User message: "${parsed.data.message.slice(0, 50)}..."`);
    const knowledgeMatches = await retrieveClinicalKnowledgeMatches(parsed.data.message, {
      matchCount: 8,
      similarityThreshold: 0.5,
    });

    console.log(`[Clinical Chat] RAG matches: ${knowledgeMatches.length}`);
    if (knowledgeMatches.length > 0) {
      console.log(
        `[Clinical Chat] Top similarities: ${knowledgeMatches
          .slice(0, 3)
          .map((match) => match.similarity.toFixed(3))
          .join(", ")}`,
      );
    }

    const knowledgeContext = knowledgeMatches
      .map((match, index) => `[臨床知識${index + 1}]\n${match.content}`)
      .join("\n\n");

    const finalMessage = knowledgeContext
      ? `【ユーザーメッセージ】\n${parsed.data.message}\n\n---\n内部参考情報（ユーザーには見せないこと）：\n以下の臨床心理学講義ノートを参考に回答を構築してください。\n${knowledgeContext}`
      : parsed.data.message;

    await supabase.from("clinical_messages").insert({
      session_id: sessionId,
      role: "user",
      content: parsed.data.message,
    });

    const openai = getClinicalOpenAIClient();
    const betaThreads = openai.beta?.threads as OpenAIThreads | undefined;
    if (!betaThreads) {
      throw new Error("OpenAI Assistants API is unavailable in the current SDK version");
    }

    try {
      await betaThreads.messages.create(threadId, { role: "user", content: finalMessage });
    } catch (openaiError) {
      console.error("[Clinical Chat] OpenAI message creation error:", openaiError);
      if (openaiError instanceof Error && openaiError.message.includes("while a run")) {
        return NextResponse.json(
          { error: "前の応答がまだ処理中です。少しお待ちください。" },
          { status: 429 },
        );
      }
      throw openaiError;
    }

    const assistantResponse = await runBufferedCompletion(betaThreads, threadId);

    if (assistantResponse.trim()) {
      await supabase.from("clinical_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantResponse,
      });

      await supabase
        .from("clinical_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    return NextResponse.json({
      sessionId,
      message: assistantResponse,
      knowledge: knowledgeMatches.slice(0, 4),
    });
  } catch (error) {
    console.error("Clinical chat error", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const resolveSession = async (
  supabase: ReturnType<typeof createSupabaseRouteClient>,
  userId: string,
  sessionId: string | undefined,
  message: string,
) => {
  if (sessionId) {
    const { data, error } = await supabase
      .from("clinical_sessions")
      .select("id, openai_thread_id")
      .eq("id", sessionId)
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Session not found");
    }

    const threadId = await ensureThreadId(supabase, data.id, data.openai_thread_id);
    return { sessionId: data.id, threadId };
  }

  const { data, error } = await supabase
    .from("clinical_sessions")
    .insert({
      auth_user_id: userId,
      title: message.trim().slice(0, 60) || "新しい相談",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create session");
  }

  const threadId = await ensureThreadId(supabase, data.id, null);
  return { sessionId: data.id, threadId };
};

const ensureThreadId = async (
  supabase: ReturnType<typeof createSupabaseRouteClient>,
  sessionId: string,
  threadId: string | null,
) => {
  if (threadId) return threadId;

  const openai = getClinicalOpenAIClient();
  const betaThreads = openai.beta?.threads;
  if (!betaThreads) {
    throw new Error("OpenAI Assistants API is unavailable in the current SDK version");
  }

  const thread = await betaThreads.create();
  await supabase.from("clinical_sessions").update({ openai_thread_id: thread.id }).eq("id", sessionId);
  return thread.id;
};

const runBufferedCompletion = async (threads: OpenAIThreads, threadId: string) => {
  const assistantId = getClinicalAssistantId();
  let fullReply = "";

  await new Promise<void>((resolve, reject) => {
    const stream = threads.runs.stream(threadId, { assistant_id: assistantId });

    stream
      .on("textDelta", (delta: { value?: string }) => {
        if (delta.value) {
          fullReply += delta.value;
        }
      })
      .on("error", (error: unknown) => {
        console.error("[Clinical Chat] Stream error:", error);
        reject(error);
      })
      .on("end", () => resolve());
  });

  return fullReply;
};
