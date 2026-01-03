"use client";

import { useEffect, useState } from "react";
import type { Counselor, Message } from "@/types";
import { fetchCounselorById } from "@/lib/counselors";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import ChatInterface from "@/components/ChatInterface";
import { useChatStore } from "@/store/chatStore";
import { useResolvedParams } from "@/hooks/useResolvedParams";


export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const { messages, setMessages } = useChatStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const resolvedParams = useResolvedParams(params);
  const counselorId = resolvedParams?.id;
  const handleConversationCreated = (id: string) => {
    setConversationId(id);
    setMessages([]);
  };

  useEffect(() => {
    if (!counselorId) {
      return;
    }

    let mounted = true;
    fetchCounselorById(counselorId)
      .then((data) => mounted && setCounselor(data))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [counselorId]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!counselorId) {
        return;
      }
      try {
        const response = await fetch(
          `/api/conversations?counselorId=${counselorId}`,
        );
        if (response.status === 401) {
          return;
        }
        const data = await response.json();
        if (data?.conversation?.id) {
          setConversationId(data.conversation.id);
        }
      } catch (error) {
        console.error("Failed to resolve conversation", error);
      }
    };

    loadConversation();
  }, [counselorId]);

  useEffect(() => {
    if (!conversationId) return;

    type ApiMessage = {
      id: string;
      role: Message["role"];
      content: string;
      conversation_id: string;
      created_at: string | null;
      tokens_used: number | null;
    };

    setMessages([]);

    const loadMessages = async () => {
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages`,
        );
        const data = await response.json();
        if (Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((row: ApiMessage) => ({
              id: row.id,
              role: row.role,
              content: row.content,
              conversationId: row.conversation_id,
              createdAt: row.created_at ?? new Date().toISOString(),
              tokensUsed: row.tokens_used ?? undefined,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load messages", error);
      }
    };

    loadMessages();
  }, [conversationId, setMessages]);

  if (loading || !counselorId) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        ロード中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl gap-6">
        <Sidebar
          selectedCounselorId={counselorId ?? undefined}
          onConversationCreated={handleConversationCreated}
        />
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
            counselorId={counselorId}
            conversationId={conversationId ?? undefined}
            onConversationResolved={handleConversationCreated}
          />
        </main>
      </div>
    </div>
  );
}
