"use client";

import { useEffect, useMemo, useState } from "react";
import type { Counselor, Message } from "@/types";
import { fetchCounselorById } from "@/lib/counselors";
import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import ChatInterface from "@/components/ChatInterface";
import { useChatStore } from "@/store/chatStore";

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const buildMessage = (
  role: Message["role"],
  content: string,
  conversationId: string,
): Message => ({
  id: randomId(),
  role,
  content,
  conversationId,
  createdAt: new Date().toISOString(),
});

export default function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const { messages, setMessages } = useChatStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationKey = useMemo(() => conversationId ?? "", [conversationId]);

  useEffect(() => {
    let mounted = true;
    fetchCounselorById(params.id)
      .then((data) => mounted && setCounselor(data))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [params.id]);

  useEffect(() => {
    if (messages.length > 0 || !conversationId) {
      return;
    }

    let active = true;

    const loadHistory = async () => {
      if (hasSupabaseConfig()) {
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

          if (!active) return;

          if (!error && data && data.length) {
            setMessages(
              data.map((row) => ({
                id: row.id,
                role: row.role as Message["role"],
                content: row.content,
                conversationId: row.conversation_id,
                createdAt: row.created_at ?? new Date().toISOString(),
                tokensUsed: row.tokens_used ?? undefined,
              })),
            );
            return;
          }
        } catch (error) {
          console.error("Failed to load conversation history", error);
        }
      }

      if (!active) return;
      setMessages([
        buildMessage(
          "assistant",
          "こんにちは。ここではUIの確認ができます。Phase 3でLLM応答を接続予定です。",
          conversationId,
        ),
      ]);
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, [conversationId, messages.length, setMessages]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        ロード中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl gap-6">
        <Sidebar />
        <main className="flex-1 space-y-6 rounded-3xl bg-white/90 p-6 shadow-xl">
          <header className="rounded-2xl border border-slate-100 bg-white/80 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
              セッション
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {counselor?.name ?? "AIカウンセラー"}
            </h1>
            <p className="text-sm text-slate-500">
              {counselor?.specialty ?? "カウンセリング"}
            </p>
          </header>

          <section className="flex h-[60vh] flex-col gap-4 overflow-y-auto rounded-2xl bg-gradient-to-b from-slate-50 to-white p-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </section>

          <ChatInterface
            counselorId={params.id}
            conversationId={conversationKey}
            onConversationResolved={(id) => setConversationId(id)}
          />
        </main>
      </div>
    </div>
  );
}
