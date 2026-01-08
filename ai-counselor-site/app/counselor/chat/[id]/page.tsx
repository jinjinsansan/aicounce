"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Counselor, Message } from "@/types";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import ChatInterface from "@/components/ChatInterface";
import MichelleChatClient from "@/components/MichelleChatClient";
import ClinicalChatClient from "@/components/ClinicalChatClient";
import SiddharthaChatClient from "@/components/SiddharthaChatClient";
import {
  AdamChatClient,
  GeminiChatClient,
  ClaudeChatClient,
  DeepChatClient,
  NazareChatClient,
  NanaChatClient,
  SaitoChatClient,
  DaleChatClient,
  PinaChatClient,
  MuuChatClient,
  HoshiChatClient,
  YukiChatClient,
} from "@/components/GeneralCounselorChatClient";
import { useChatStore } from "@/store/chatStore";
import { useResolvedParams } from "@/hooks/useResolvedParams";
import { loadCounselorById } from "@/lib/client-counselors";

function StandardChatExperience({ counselorId }: { counselorId: string }) {
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState<{ canUseIndividual: boolean } | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const { messages, setMessages } = useChatStore();
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleConversationCreated = (id: string) => {
    setConversationId(id);
    setMessages([]);
  };

  useEffect(() => {
    let mounted = true;
    loadCounselorById(counselorId)
      .then((data) => mounted && setCounselor(data))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [counselorId]);

  useEffect(() => {
    let active = true;
    fetch("/api/access/state", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          if (!active) return null;
          setRequiresLogin(true);
          setAccessState(null);
          return null;
        }
        if (!response.ok) throw new Error("access-state-failed");
        return response.json();
      })
      .then((data) => {
        if (!active || !data) return;
        setAccessState({ canUseIndividual: Boolean(data.state?.canUseIndividual) });
      })
      .catch(() => {
        if (!active) return;
        setAccessState({ canUseIndividual: false });
      })
      .finally(() => active && setAccessLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const loadConversation = async () => {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        ロード中...
      </div>
    );
  }

  if (counselor?.teamOnly) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Team Counseling Only
          </p>
          <h1 className="text-3xl font-black text-slate-900">
            {counselor.name}はチームカウンセリングチャット専用です
          </h1>
          <p className="text-slate-600">個別カウンセリングでは利用できません。</p>
        </div>
        <LinkButton href="/team" label="チームカウンセリングを開く" />
        <LinkButton href={`/counselor/${counselor.id}`} label="カウンセラー説明ページへ" />
      </div>
    );
  }

  if (accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        ロード中...
      </div>
    );
  }

  if (requiresLogin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Please Sign In</p>
          <h1 className="text-3xl font-black text-slate-900">まずはログインしてください</h1>
          <p className="text-slate-600">マイプランの確認やカウンセリング利用にはログインが必要です。</p>
        </div>
        <LinkButton href="/login" label="ログインする" />
      </div>
    );
  }

  if (accessState && !accessState.canUseIndividual) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Access Restricted
          </p>
          <h1 className="text-3xl font-black text-slate-900">個別カウンセリングはベーシックプラン専用です</h1>
          <p className="text-slate-600">
            公式LINEの7日間無料トライアル、もしくはベーシックプランの決済で利用できます。
          </p>
        </div>
        <LinkButton href="/account" label="マイページでプランを確認" />
      </div>
    );
  }

  return (
    <div className="min-h-screen border-t border-slate-200 bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl gap-6">
        <Sidebar
          selectedCounselorId={counselorId}
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
            enableRag={Boolean(counselor?.ragEnabled)}
          />
        </main>
      </div>
    </div>
  );
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = useResolvedParams(params);
  const counselorId = resolvedParams?.id;

  if (!counselorId) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        ロード中...
      </div>
    );
  }

  if (counselorId === "mirai" || counselorId === "kenji" || counselorId === "mitsu") {
    return <StandardChatExperience counselorId={counselorId} />;
  }

  if (counselorId === "michele") {
    return <MichelleChatClient />;
  }

  if (counselorId === "sato") {
    return <ClinicalChatClient />;
  }

  if (counselorId === "adam") {
    return <AdamChatClient />;
  }

  if (counselorId === "gemini") {
    return <GeminiChatClient />;
  }

  if (counselorId === "claude") {
    return <ClaudeChatClient />;
  }

  if (counselorId === "deep") {
    return <DeepChatClient />;
  }

  if (counselorId === "nazare") {
    return <NazareChatClient />;
  }

  if (counselorId === "siddhartha") {
    return <SiddharthaChatClient />;
  }

  if (counselorId === "nana") {
    return <NanaChatClient />;
  }

  if (counselorId === "saito") {
    return <SaitoChatClient />;
  }

  if (counselorId === "dale") {
    return <DaleChatClient />;
  }



  if (counselorId === "yuki") {
    return <YukiChatClient />;
  }

  if (counselorId === "pina") {
    return <PinaChatClient />;
  }

  if (counselorId === "muu") {
    return <MuuChatClient />;
  }

  if (counselorId === "hoshi") {
    return <HoshiChatClient />;
  }

  return <StandardChatExperience counselorId={counselorId} />;
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-black"
    >
      {label}
    </Link>
  );
}
