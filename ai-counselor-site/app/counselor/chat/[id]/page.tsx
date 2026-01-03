"use client";

import { useEffect, useMemo, useState } from "react";
import type { Counselor, Message } from "@/types";
import { fetchCounselorById } from "@/lib/counselors";
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
  const conversationId = useMemo(() => `session-${params.id}`, [params.id]);

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
    const welcomeMessage = buildMessage(
      "assistant",
      "こんにちは。ここではUIの確認ができます。Phase 3でLLM応答を接続予定です。",
      conversationId,
    );
    setMessages([welcomeMessage]);
  }, [conversationId, setMessages]);

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
            conversationId={conversationId}
          />
        </main>
      </div>
    </div>
  );
}
