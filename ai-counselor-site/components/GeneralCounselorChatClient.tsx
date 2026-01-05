"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Loader2, Menu, MessageSquare, Plus, Send, Share2, Trash2, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConversationRow = {
  id: string;
  title: string | null;
  counselor_id: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  conversation_id: string;
  created_at: string;
};

type ChatConfig = {
  counselorId: string;
  storageKey: string;
  hero: {
    name: string;
    subtitle: string;
    description: string;
    iconUrl: string;
  };
  theme: {
    gradientFrom: string;
    gradientTo: string;
    accent: string;
    cardBorder: string;
    bubbleUser: string;
    bubbleAssistant: string;
    assistantText: string;
    assistantBorder: string;
    activeBackground: string;
  };
  initialPrompts: string[];
  thinkingMessages: string[];
};

type SessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

type MessageItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  pending?: boolean;
};

type GeneralChatProps = {
  config: ChatConfig;
};

export function GeneralCounselorChatClient({ config }: GeneralChatProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState({ sessions: false, messages: false, sending: false });
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThinkingIndex, setCurrentThinkingIndex] = useState(0);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredRef = useRef(false);
  const [composerHeight, setComposerHeight] = useState(0);
  const autoScrollRef = useRef(true);
  const scrollFrameRef = useRef<number | null>(null);
  const lastSendRef = useRef<number>(0);

  const hasPendingResponse = useMemo(() => messages.some((msg) => msg.pending), [messages]);

  const loadSessions = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, sessions: true }));
    try {
      const res = await fetch("/api/conversations");
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = (await res.json()) as { conversations?: ConversationRow[] };
      const filtered = (data.conversations ?? [])
        .filter((row) => row.counselor_id === config.counselorId)
        .map((row) => ({
          id: row.id,
          title: row.title ?? `${config.hero.name}との相談`,
          updatedAt: row.updated_at ?? new Date().toISOString(),
        }));
      setSessions(filtered);
    } catch (err) {
      console.error("loadSessions", err);
      setError("セッションの取得に失敗しました");
      setTimeout(() => setError(null), 2000);
    } finally {
      setIsLoading((prev) => ({ ...prev, sessions: false }));
    }
  }, [config.counselorId, config.hero.name]);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      setIsLoading((prev) => ({ ...prev, messages: true }));
      try {
        const res = await fetch(`/api/conversations/${sessionId}/messages`);
        if (res.status === 401) {
          setNeedsAuth(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load messages");
        const data = (await res.json()) as { messages?: MessageRow[] };
        setMessages(
          (data.messages ?? []).map((row) => ({
            id: row.id,
            role: row.role,
            content: row.content,
            createdAt: row.created_at,
          })),
        );
        setHasLoadedMessages(true);
      } catch (err) {
        console.error("loadMessages", err);
        setError("メッセージの取得に失敗しました");
        setTimeout(() => setError(null), 2000);
      } finally {
        setIsLoading((prev) => ({ ...prev, messages: false }));
      }
    },
    [],
  );

  const handleSend = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || isLoading.sending || hasPendingResponse) return;

    const now = Date.now();
    if (now - lastSendRef.current < 1500) {
      setError("少し待ってから送信してください");
      setTimeout(() => setError(null), 1200);
      return;
    }
    lastSendRef.current = now;

    if (!override) setInput("");
    if (isMobile && textareaRef.current) {
      textareaRef.current.blur();
    }

    const userTempId = `user-${now}`;
    const aiTempId = `assistant-${now}`;
    const timestamp = new Date().toISOString();

    setMessages((prev) => [
      ...prev,
      { id: userTempId, role: "user", content: text, createdAt: timestamp },
      { id: aiTempId, role: "assistant", content: "", createdAt: timestamp, pending: true },
    ]);
    setIsLoading((prev) => ({ ...prev, sending: true }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId: config.counselorId,
          conversationId: activeSessionId ?? undefined,
          message: text,
          useRag: true,
        }),
      });

      if (res.status === 401) {
        setNeedsAuth(true);
        throw new Error("ログインが必要です");
      }
      if (!res.ok) {
        const raw = await res.text();
        throw new Error(raw || "送信に失敗しました");
      }

      const data = (await res.json()) as { conversationId?: string; content?: string };
      const resolvedConversationId = data.conversationId ?? activeSessionId;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiTempId
            ? { ...msg, content: data.content ?? "応答を取得できませんでした", pending: false }
            : msg,
        ),
      );

      if (!activeSessionId && resolvedConversationId) {
        setActiveSessionId(resolvedConversationId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(config.storageKey, resolvedConversationId);
        }
        loadSessions();
      }
    } catch (err) {
      console.error("handleSend", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiTempId
            ? { ...msg, content: "申し訳ありません。もう一度送信してください。", pending: false }
            : msg,
        ),
      );
      setError(err instanceof Error ? err.message : "送信に失敗しました");
      setTimeout(() => setError(null), 2000);
    } finally {
      setIsLoading((prev) => ({ ...prev, sending: false }));
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setHasLoadedMessages(true);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(config.storageKey);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("このチャット履歴を削除しますか？")) return;
    try {
      const res = await fetch(`/api/conversations/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      await loadSessions();
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("delete session", err);
      setError("削除できませんでした");
      setTimeout(() => setError(null), 2000);
    }
  };

  const handleShare = async () => {
    if (!messages.length) return;
    const text = messages
      .map((m) => `${m.role === "user" ? "あなた" : config.hero.name}: ${m.content}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setError("✓ 会話をコピーしました");
    } catch (err) {
      console.error("share", err);
      setError("コピーに失敗しました");
    } finally {
      setTimeout(() => setError(null), 1500);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    if (!isMobile && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    if (isLoading.sessions) return;

    if (typeof window === "undefined") return;

    if (sessions.length === 0) {
      hasRestoredRef.current = true;
      setIsRestoringSession(false);
      return;
    }

    const storedId = window.localStorage.getItem(config.storageKey);
    if (storedId && sessions.some((s) => s.id === storedId)) {
      setActiveSessionId(storedId);
    } else {
      setActiveSessionId(sessions[0].id);
    }
    hasRestoredRef.current = true;
    setIsRestoringSession(false);
  }, [sessions, isLoading.sessions, config.storageKey]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      setHasLoadedMessages(true);
      return;
    }
    loadMessages(activeSessionId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(config.storageKey, activeSessionId);
    }
  }, [activeSessionId, config.storageKey, loadMessages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [input]);

  useEffect(() => {
    if (!composerRef.current) return;
    const update = () => {
      if (composerRef.current) {
        setComposerHeight(composerRef.current.offsetHeight);
      }
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      const interval = window.setInterval(update, 500);
      return () => window.clearInterval(interval);
    }
    const observer = new ResizeObserver(update);
    observer.observe(composerRef.current);
    return () => observer.disconnect();
  }, []);

  const scheduleScroll = useCallback(() => {
    if (!autoScrollRef.current) return;
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const distance = container.scrollHeight - (container.scrollTop + container.clientHeight);
      autoScrollRef.current = distance < 120;
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    scheduleScroll();
  }, [messages.length, scheduleScroll]);

  useEffect(() => {
    if (!hasPendingResponse) return;
    const interval = setInterval(() => {
      setCurrentThinkingIndex((prev) => (prev + 1) % config.thinkingMessages.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [hasPendingResponse, config.thinkingMessages.length]);

  if (needsAuth) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-white via-[#ecfdf5] to-[#d1fae5]">
        <div className="rounded-3xl bg-white/90 px-10 py-12 text-center shadow-2xl">
          <p className="text-lg font-semibold text-[#0f766e]">ログインが必要です</p>
          <p className="mt-4 text-sm text-[#115e59]">{config.hero.name}と話すにはサインインしてください。</p>
        </div>
      </div>
    );
  }

  const showLoader =
    isRestoringSession ||
    (!hasLoadedMessages && (isLoading.messages || (isLoading.sessions && sessions.length === 0)));

  if (showLoader) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-white via-[#ecfdf5] to-[#d1fae5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0f766e]" />
      </div>
    );
  }

  const messagePaddingBottom = messages.length === 0 ? 0 : Math.max(composerHeight + 24, 160);

  const SessionList = (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Button
          onClick={handleNewChat}
          className="w-full justify-center gap-2 rounded-2xl border border-emerald-200 bg-white text-[#065f46] hover:bg-emerald-50"
          variant="outline"
          disabled={isLoading.sending}
        >
          <Plus className="h-4 w-4" /> 新規チャット
        </Button>
        <Button
          onClick={handleShare}
          className="w-full justify-center gap-2 rounded-2xl border border-emerald-100 bg-white text-[#0f3d2e] hover:bg-emerald-50"
          variant="outline"
          disabled={!messages.length}
        >
          <Share2 className="h-4 w-4" /> 会話をコピー
        </Button>
      </div>

      <div className="space-y-3">
        {sessions.length === 0 && (
          <p className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 px-4 py-6 text-center text-sm text-emerald-800">
            まだチャット履歴がありません。
          </p>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => {
              setActiveSessionId(session.id);
              setIsSidebarOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left text-sm transition",
              session.id === activeSessionId
                ? cn("border-transparent text-white", config.theme.activeBackground)
                : cn(config.theme.cardBorder, "bg-white text-slate-900 hover:bg-slate-50"),
            )}
          >
            <div>
              <p className="font-semibold">{session.title}</p>
              <p className="text-xs opacity-80">{new Date(session.updatedAt).toLocaleString("ja-JP")}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSession(session.id);
              }}
              className={cn(
                "rounded-full p-1 transition",
                session.id === activeSessionId
                  ? "text-white/80 hover:bg-white/20"
                  : "text-emerald-500 hover:bg-emerald-50",
              )}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] w-full"
      style={{ background: `linear-gradient(135deg, ${config.theme.gradientFrom}, ${config.theme.gradientTo})` }}
    >
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="hidden w-80 flex-shrink-0 rounded-[30px] border border-white/30 bg-white/70 p-5 backdrop-blur md:flex">
          {SessionList}
        </aside>

        <main className="flex flex-1 flex-col rounded-[32px] border border-white/40 bg-white/90 shadow-2xl">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">{config.hero.subtitle}</p>
                <h1 className="text-2xl font-bold text-[#063221]">{config.hero.name}</h1>
                <p className="text-sm text-emerald-700">{config.hero.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <MessageSquare className="h-3.5 w-3.5" /> {sessions.length} 件の相談履歴
              </div>
              <Image
                src={config.hero.iconUrl}
                alt={config.hero.name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl border border-emerald-100 bg-white object-contain"
              />
            </div>
          </header>

          {messages.length === 0 && config.initialPrompts.length > 0 && (
            <section className="border-b border-emerald-50 px-6 py-4">
              <p className="text-sm font-semibold text-emerald-800">すぐに話したいことを選べます</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {config.initialPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    className="rounded-full border border-emerald-100 bg-white px-4 py-1.5 text-xs text-emerald-700 transition hover:border-emerald-300"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="relative flex flex-1 flex-col overflow-hidden">
            {error && (
              <div className="pointer-events-none absolute inset-x-6 top-4 z-10 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-2 text-center text-sm text-emerald-800 shadow">
                {error}
              </div>
            )}

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 py-6"
              style={{ paddingBottom: `${messagePaddingBottom}px` }}
            >
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center text-emerald-700">
                  <p className="text-base font-semibold">まだ会話はありません</p>
                  <p className="mt-1 text-sm">感じていることを一言で送ってみてください。</p>
                </div>
              )}

              <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
                {messages.map((message) => {
                  if (message.role === "user") {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div
                          className={cn(
                            "max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow",
                            config.theme.bubbleUser,
                          )}
                        >
                          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-current">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/40 text-current">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            あなた
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} className="flex gap-3">
                      <div className="h-10 w-10 rounded-2xl border border-emerald-100 bg-white">
                        <Image
                          src={config.hero.iconUrl}
                          alt={config.hero.name}
                          width={40}
                          height={40}
                          className="h-full w-full rounded-2xl object-contain"
                        />
                      </div>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow",
                          config.theme.bubbleAssistant,
                          config.theme.assistantBorder,
                          config.theme.assistantText,
                        )}
                      >
                        {message.pending ? (
                          <div className="flex items-center gap-2 text-emerald-700">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {config.thinkingMessages[currentThinkingIndex]}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div
              ref={composerRef}
              className="border-t border-emerald-50 bg-white px-4 py-3"
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="悩みや状況を入力してください"
                  className="min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900 placeholder-emerald-400 focus:border-emerald-300 focus:outline-none"
                  rows={1}
                  autoComplete="off"
                  autoCorrect="off"
                  enterKeyHint="send"
                  onFocus={() => {
                    if (!isMobile) return;
                    setTimeout(() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }, 300);
                  }}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading.sending}
                  className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: config.theme.accent, color: "#ffffff" }}
                >
                  {isLoading.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-white/40 bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-800">チャット履歴</p>
              <button type="button" onClick={() => setIsSidebarOpen(false)} className="rounded-full border p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            {SessionList}
          </div>
        </div>
      )}
    </div>
  );
}

const baseThinking = [
  "考えを整理しています...",
  "言葉を丁寧に選んでいます...",
  "視点を整えています...",
];

const basePrompts = [
  "とりあえず誰かに気持ちを聞いてほしい",
  "仕事のミスが頭から離れません",
  "人に頼るのが苦手で疲れます",
];

const ADAM_CONFIG: ChatConfig = {
  counselorId: "adam",
  storageKey: "adam-general-chat-session",
  hero: {
    name: "アダム",
    subtitle: "万能型AIカウンセラー",
    description: "中立で実用的な視点を提供します",
    iconUrl: "/images/counselors/adam.png",
  },
  theme: {
    gradientFrom: "#f0fdfa",
    gradientTo: "#d1fae5",
    accent: "#0f766e",
    cardBorder: "border-emerald-100",
    bubbleUser: "bg-[#fef2f2] text-[#7c2d12]",
    bubbleAssistant: "bg-[#ecfdf5]",
    assistantText: "text-[#064e3b]",
    assistantBorder: "border border-emerald-100",
    activeBackground: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
  initialPrompts: basePrompts,
  thinkingMessages: baseThinking,
};

const GEMINI_CONFIG: ChatConfig = {
  counselorId: "gemini",
  storageKey: "gemini-general-chat-session",
  hero: {
    name: "ジェミニ",
    subtitle: "二つの視点で整えるAI",
    description: "多角的に物事を捉えて整理します",
    iconUrl: "/images/counselors/gemini.png",
  },
  theme: {
    gradientFrom: "#fdf4ff",
    gradientTo: "#fae8ff",
    accent: "#9333ea",
    cardBorder: "border-purple-100",
    bubbleUser: "bg-[#fdf2f8] text-[#9f1239]",
    bubbleAssistant: "bg-[#f9f5ff]",
    assistantText: "text-[#6b21a8]",
    assistantBorder: "border border-purple-100",
    activeBackground: "bg-gradient-to-r from-fuchsia-500 to-purple-500",
  },
  initialPrompts: [
    "感情と行動のバランスが崩れています",
    "決断で迷っていて整理したい",
    "自分を責める気持ちと頑張りたい気持ちが混ざります",
  ],
  thinkingMessages: [
    "視点を切り替えています...",
    "比較のポイントを探しています...",
    "選択肢を整理しています...",
  ],
};

const CLAUDE_CONFIG: ChatConfig = {
  counselorId: "claude",
  storageKey: "claude-general-chat-session",
  hero: {
    name: "クロード",
    subtitle: "思慮深く整理するAI",
    description: "落ち着いた文章で状況を整えます",
    iconUrl: "/images/counselors/claude.png",
  },
  theme: {
    gradientFrom: "#f8fafc",
    gradientTo: "#e4e4e7",
    accent: "#312e81",
    cardBorder: "border-slate-200",
    bubbleUser: "bg-[#f8fafc] text-[#1f2937]",
    bubbleAssistant: "bg-[#f4f4f5]",
    assistantText: "text-[#27272a]",
    assistantBorder: "border border-slate-200",
    activeBackground: "bg-gradient-to-r from-slate-800 to-slate-600",
  },
  initialPrompts: [
    "気持ちを落ち着けながら整理したい",
    "丁寧に振り返りをさせてください",
    "自分の価値観が揺らいでいます",
  ],
  thinkingMessages: [
    "言葉を丁寧に整えています...",
    "価値観を確認しています...",
    "流れをまとめています...",
  ],
};

const DEEP_CONFIG: ChatConfig = {
  counselorId: "deep",
  storageKey: "deep-general-chat-session",
  hero: {
    name: "ディープ",
    subtitle: "分析型AIカウンセラー",
    description: "要因を分解しながら提案します",
    iconUrl: "/images/counselors/deep.png",
  },
  theme: {
    gradientFrom: "#ecfeff",
    gradientTo: "#ccfbf1",
    accent: "#0d9488",
    cardBorder: "border-teal-100",
    bubbleUser: "bg-[#fefce8] text-[#713f12]",
    bubbleAssistant: "bg-[#eefdfd]",
    assistantText: "text-[#115e59]",
    assistantBorder: "border border-teal-100",
    activeBackground: "bg-gradient-to-r from-teal-500 to-cyan-500",
  },
  initialPrompts: [
    "原因を一緒に分析してほしい",
    "選択肢を整理したい",
    "複雑な問題を分解したい",
  ],
  thinkingMessages: [
    "要素を分解しています...",
    "仮説を立てています...",
    "提案を構築しています...",
  ],
};

export const AdamChatClient = () => <GeneralCounselorChatClient config={ADAM_CONFIG} />;
export const GeminiChatClient = () => <GeneralCounselorChatClient config={GEMINI_CONFIG} />;
export const ClaudeChatClient = () => <GeneralCounselorChatClient config={CLAUDE_CONFIG} />;
export const DeepChatClient = () => <GeneralCounselorChatClient config={DEEP_CONFIG} />;
