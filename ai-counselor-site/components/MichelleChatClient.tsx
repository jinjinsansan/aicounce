"use client";

import {
  AUTH_ERROR_MESSAGE,
  GeneralCounselorChatClient,
  type ChatConfig,
  type ChatDataSource,
  type MessageItem,
} from "@/components/GeneralCounselorChatClient";

type MichelleSessionRow = {
  id: string;
  title: string | null;
  category: string | null;
  updated_at: string;
};

type MichelleSessionsResponse = {
  sessions?: MichelleSessionRow[];
};

type MichelleMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

type MichelleMessagesResponse = {
  messages?: MichelleMessageRow[];
};

const initialPrompts = [
  "会社の上司に怒られた...",
  "最近なんだか寂しい",
  "1年ぐらい付き合ってない",
  "彼女がなかなか寝ない",
];

const thinkingMessages = [
  "心の声を聞いています...",
  "感情を整理しています...",
  "思考を整えています...",
  "寄り添いながら考えています...",
];

const MICHELLE_CONFIG: ChatConfig = {
  counselorId: "michelle",
  storageKey: "michelle-psychology-active-session-id",
  hero: {
    name: "ミシェル",
    subtitle: "テープ式心理学カウンセラー",
    description: "心の芯をやさしく整理し、静かな光で寄り添います",
    iconUrl: "/images/counselors/michelle.png",
  },
  theme: {
    gradientFrom: "#fffdfa",
    gradientVia: "#fff1f5",
    gradientTo: "#ffe3ed",
    accent: "#f472b6",
    accentMuted: "#a34264",
    cardBorder: "border-rose-100",
    bubbleUser: "bg-[#ff9ec5] text-white",
    bubbleAssistant: "bg-white",
    assistantText: "text-[#7b364d]",
    assistantBorder: "border border-[#ffd4e3]",
    activeBackground: "bg-gradient-to-r from-[#fb923c] via-[#f472b6] to-[#fb7185]",
    newChatButton:
      "bg-gradient-to-r from-[#fb923c] via-[#f472b6] to-[#fb7185] focus-visible:ring-rose-200 shadow-rose-300/40",
    headingText: "text-[#7b364d]",
    headerSubtitle: "text-[#f472b6]",
    headerDescription: "text-[#b25c76]",
    badgeBackground: "bg-[#fff0f6]",
    badgeText: "text-[#c2416d]",
    badgeHintText: "text-[#c9738f]",
    statsBadgeBackground: "bg-[#ffe4ed]",
    statsBadgeText: "text-[#a34264]",
    sectionBorder: "border-[#ffe4ed]",
    promptBorder: "border-[#ffd7e8]",
    promptText: "text-[#a34264]",
    promptHoverBorder: "hover:border-[#f9a8d4]",
    detailBorder: "border-[#ffd7e8]",
    detailBackground: "bg-[#fff5f8]",
    detailText: "text-[#a34264]",
    emptyBorder: "border-[#fbcfe8]",
    emptyText: "text-[#a34264]",
    inputBorder: "border-[#ffd7e8] focus:border-[#f472b6]",
    inputBg: "bg-white/95",
    inputPlaceholder: "placeholder-[#f0a6bf]",
    skeletonBorder: "border-[#ffe4ed]",
    skeletonHighlight: "bg-[#fff5f8]",
    skeletonShade: "bg-[#ffecec]",
    deleteButtonText: "text-[#a34264]",
    deleteButtonHover: "hover:bg-[#fff1f5]",
  },
  initialPrompts,
  thinkingMessages,
};

const michelleDataSource: ChatDataSource = {
  loadSessions: async () => {
    const res = await fetch("/api/michelle/sessions");
    if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
    if (!res.ok) throw new Error("セッション情報の取得に失敗しました");
    const data = (await res.json()) as MichelleSessionsResponse;
    return (data.sessions ?? []).map((session) => ({
      id: session.id,
      title: session.title ?? "ミシェルとの相談",
      updatedAt: session.updated_at ?? new Date().toISOString(),
    }));
  },
  loadMessages: async (sessionId: string) => {
    const res = await fetch(`/api/michelle/sessions/${sessionId}/messages`);
    if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
    if (res.status === 404) throw new Error("セッションが見つかりません");
    if (!res.ok) throw new Error("メッセージの取得に失敗しました");
    const data = (await res.json()) as MichelleMessagesResponse;
    return (data.messages ?? [])
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        id: msg.id,
        role: msg.role as MessageItem["role"],
        content: msg.content,
        createdAt: msg.created_at,
      }));
  },
  sendMessage: async ({ sessionId, message }) => {
    const res = await fetch("/api/michelle/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId ?? undefined,
        message,
        category: sessionId ? undefined : "life",
      }),
    });

    if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
    if (!res.ok) {
      const raw = await res.text();
      try {
        const parsed = JSON.parse(raw) as { error?: string };
        const fallback = raw || "送信に失敗しました";
        throw new Error(parsed.error ?? fallback);
      } catch {
        throw new Error(raw || "送信に失敗しました");
      }
    }

    const data = (await res.json()) as { sessionId: string; message: string };
    return { sessionId: data.sessionId ?? sessionId ?? null, content: data.message };
  },
  deleteSession: async (sessionId: string) => {
    const res = await fetch(`/api/michelle/sessions/${sessionId}`, { method: "DELETE" });
    if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
    if (!res.ok) throw new Error("削除に失敗しました");
  },
};

export function MichelleChatClient() {
  return <GeneralCounselorChatClient config={MICHELLE_CONFIG} dataSource={michelleDataSource} />;
}

export default MichelleChatClient;
