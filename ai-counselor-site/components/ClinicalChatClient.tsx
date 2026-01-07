"use client";

import {
  AUTH_ERROR_MESSAGE,
  GeneralCounselorChatClient,
  type ChatConfig,
  type ChatDataSource,
  type MessageItem,
} from "@/components/GeneralCounselorChatClient";

type ClinicalSessionRow = {
  id: string;
  title: string | null;
  category: string | null;
  updated_at: string;
};

type ClinicalSessionsResponse = {
  sessions?: ClinicalSessionRow[];
};

type ClinicalMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

type ClinicalMessagesResponse = {
  messages?: ClinicalMessageRow[];
};

const initialPrompts = [
  "最近気分が落ち込みがちです",
  "人間関係のストレスで疲れました",
  "不安で夜なかなか眠れません",
  "罪悪感が消えずに苦しいです",
];

const thinkingMessages = [
  "臨床知識と照らし合わせています...",
  "感情の背景を丁寧に理解しています...",
  "安全に寄り添う言葉を選んでいます...",
  "研究知見を確認しています...",
];

const CLINICAL_CONFIG: ChatConfig = {
  counselorId: "sato",
  storageKey: "clinical-psychology-active-session-id",
  hero: {
    name: "ドクター・サトウ",
    subtitle: "臨床心理学 AI カウンセラー",
    description: "認知行動療法や臨床心理査定の知見をもとに、静かなテンポで伴走します",
    iconUrl: "/images/counselors/dr_satou.png",
  },
  theme: {
    gradientFrom: "#f7fbff",
    gradientVia: "#edf5ff",
    gradientTo: "#dceeff",
    accent: "#2563eb",
    accentMuted: "#1e3a8a",
    cardBorder: "border-blue-100",
    bubbleUser: "bg-[#dbeafe] text-[#1e3a8a]",
    bubbleAssistant: "bg-white",
    assistantText: "text-[#0f2167]",
    assistantBorder: "border border-[#dbeafe]",
    activeBackground: "bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7c3aed]",
    newChatButton:
      "bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7c3aed] focus-visible:ring-blue-200 shadow-blue-300/30",
    headingText: "text-[#0f2167]",
    headerSubtitle: "text-[#2563eb]",
    headerDescription: "text-[#1e3a8a]",
    badgeBackground: "bg-[#e0f2fe]",
    badgeText: "text-[#0f2167]",
    badgeHintText: "text-[#1d4ed8]",
    statsBadgeBackground: "bg-[#e0f2fe]",
    statsBadgeText: "text-[#1d4ed8]",
    sectionBorder: "border-[#dbeafe]",
    promptBorder: "border-[#c7ddff]",
    promptText: "text-[#0f2167]",
    promptHoverBorder: "hover:border-[#93c5fd]",
    detailBorder: "border-[#dbeafe]",
    detailBackground: "bg-[#eef6ff]",
    detailText: "text-[#0f2167]",
    emptyBorder: "border-[#c7ddff]",
    emptyText: "text-[#0f2167]",
    inputBorder: "border-[#dbeafe] focus:border-[#2563eb]",
    inputBg: "bg-white/95",
    inputPlaceholder: "placeholder-[#94a3b8]",
    skeletonBorder: "border-[#dbeafe]",
    skeletonHighlight: "bg-[#f1f5f9]",
    skeletonShade: "bg-[#e2e8f0]",
    deleteButtonText: "text-[#0f2167]",
    deleteButtonHover: "hover:bg-[#e0f2fe]",
  },
  initialPrompts,
  thinkingMessages,
};

const clinicalDataSource: ChatDataSource = {
  loadSessions: async () => {
    const res = await fetch("/api/clinical/sessions");
    if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
    if (res.status === 404) throw new Error("臨床心理カウンセラーは現在ご利用いただけません");
    if (!res.ok) throw new Error("セッション情報の取得に失敗しました");
    const data = (await res.json()) as ClinicalSessionsResponse;
    return (data.sessions ?? []).map((session) => ({
      id: session.id,
      title: session.title ?? "臨床心理カウンセリング",
      updatedAt: session.updated_at ?? new Date().toISOString(),
    }));
  },
  loadMessages: async (sessionId: string) => {
    const res = await fetch(`/api/clinical/sessions/${sessionId}/messages`);
    if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
    if (res.status === 404) throw new Error("セッションが見つかりません");
    if (!res.ok) throw new Error("メッセージの取得に失敗しました");
    const data = (await res.json()) as ClinicalMessagesResponse;
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
    const res = await fetch("/api/clinical/chat", {
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
    const res = await fetch(`/api/clinical/sessions/${sessionId}`, { method: "DELETE" });
    if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
    if (!res.ok) throw new Error("削除に失敗しました");
  },
};

export function ClinicalChatClient() {
  return <GeneralCounselorChatClient config={CLINICAL_CONFIG} dataSource={clinicalDataSource} />;
}

export default ClinicalChatClient;
