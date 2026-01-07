"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Loader2, Menu, MessageSquare, Plus, Send, Share2, Trash2, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChatLayout } from "@/hooks/useChatLayout";
import { useChatDevice } from "@/hooks/useChatDevice";
import {
  DEFAULT_PHASE_DETAILS,
  DEFAULT_PHASE_HINTS,
  DEFAULT_PHASE_LABELS,
  inferGuidedPhase,
  type GuidedPhase,
} from "@/components/chat/guidance";

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
    gradientVia?: string;
    gradientTo: string;
    accent: string;
    accentMuted?: string;
    cardBorder: string;
    bubbleUser: string;
    bubbleAssistant: string;
    assistantText: string;
    assistantBorder: string;
    activeBackground: string;
    newChatButton: string;
  };
  initialPrompts: string[];
  thinkingMessages: string[];
  phaseLabels?: Record<GuidedPhase, string>;
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
  const [isLoading, setIsLoading] = useState({ sessions: false, messages: false, sending: false });
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThinkingIndex, setCurrentThinkingIndex] = useState(0);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<GuidedPhase>("explore");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { composerRef, scrollContainerRef, messagesEndRef, scheduleScroll, composerHeight } = useChatLayout();
  const { isMobile, scrollIntoViewOnFocus } = useChatDevice(textareaRef);
  const hasRestoredRef = useRef(false);
  const lastSendRef = useRef<number>(0);

  const hasPendingResponse = useMemo(() => messages.some((msg) => msg.pending), [messages]);
  const userMessageCount = useMemo(() => messages.filter((msg) => msg.role === "user").length, [messages]);

  useEffect(() => {
    setCurrentPhase(inferGuidedPhase(userMessageCount));
  }, [userMessageCount]);

  const loadSessions = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, sessions: true }));
    try {
      const res = await fetch(`/api/conversations?counselorId=${encodeURIComponent(config.counselorId)}`);
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
    if (!text || isLoading.sending) return;

    if (hasPendingResponse) {
      setError("前の応答を待っています...");
      setTimeout(() => setError(null), 1200);
      return;
    }

    const now = Date.now();
    const MIN_REQUEST_INTERVAL = 3000;
    const elapsed = now - lastSendRef.current;
    if (lastSendRef.current && elapsed < MIN_REQUEST_INTERVAL) {
      const remaining = Math.ceil((MIN_REQUEST_INTERVAL - elapsed) / 1000);
      setError(`${remaining}秒お待ちください...`);
      setTimeout(() => setError(null), 1200);
      return;
    }
    lastSendRef.current = now;

    if (!override) setInput("");
    if (isMobile && textareaRef.current) {
      textareaRef.current.blur();
    }
    setError(null);

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
      if (hasPendingResponse) {
        setError("前の応答を待っています...");
        setTimeout(() => setError(null), 1200);
        return;
      }
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    if (!isLoading.sending && !hasPendingResponse) {
      void handleSend(prompt);
    }
  };

  useEffect(() => {
    const updateStatus = () => {
      if (typeof navigator === "undefined") return;
      setIsOffline(!navigator.onLine);
    };
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
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
    setHasLoadedMessages(false);
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

  useLayoutEffect(() => {
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

  const gradientStops = useMemo(() => {
    const stops = [config.theme.gradientFrom];
    if (config.theme.gradientVia) {
      stops.push(config.theme.gradientVia);
    }
    stops.push(config.theme.gradientTo);
    return stops;
  }, [config.theme.gradientFrom, config.theme.gradientVia, config.theme.gradientTo]);

  const gradientStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${gradientStops.join(", ")})`,
      minHeight: "calc(100vh - 4rem)",
      height: "calc(100vh - 4rem)",
      maxHeight: "calc(100vh - 4rem)",
    }),
    [gradientStops],
  );
  const accentColor = config.theme.accent;
  const accentMuted = config.theme.accentMuted ?? config.theme.accent;

  if (needsAuth) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center" style={gradientStyle}>
        <div className="rounded-3xl bg-white/90 px-10 py-12 text-center shadow-2xl">
          <p className="text-lg font-semibold" style={{ color: accentColor }}>
            ログインが必要です
          </p>
          <p className="mt-4 text-sm" style={{ color: accentMuted }}>
            {config.hero.name}と話すにはサインインしてください。
          </p>
        </div>
      </div>
    );
  }

  const showLoader =
    isRestoringSession ||
    (!hasLoadedMessages && (isLoading.messages || (isLoading.sessions && sessions.length === 0)));

  if (showLoader) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center" style={gradientStyle}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  const phaseLabels = config.phaseLabels ?? DEFAULT_PHASE_LABELS;
  const phaseHint = DEFAULT_PHASE_HINTS[currentPhase];
  const phaseDetail = DEFAULT_PHASE_DETAILS[currentPhase];
  const messagePaddingBottom = messages.length === 0 ? 0 : Math.max(composerHeight + 24, 160);
  const newChatButtonClasses = cn(
    "w-full justify-center gap-2 rounded-3xl border border-transparent px-5 py-4 text-base font-semibold text-white shadow-lg shadow-black/10 transition-all focus:ring-transparent focus-visible:ring-2 focus-visible:ring-offset-2 hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60",
    config.theme.newChatButton,
  );

  const showSessionSkeleton = isLoading.sessions && sessions.length === 0;
  const sessionSkeletonNodes = Array.from({ length: 3 }).map((_, index) => (
    <div key={index} className="animate-pulse rounded-3xl border border-emerald-50 bg-white/60 px-4 py-4">
      <div className="h-4 w-1/2 rounded-full bg-emerald-100" />
      <div className="mt-2 h-3 w-1/3 rounded-full bg-emerald-50" />
    </div>
  ));

  const SessionList = (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleNewChat}
          className={newChatButtonClasses}
          disabled={isLoading.sending}
        >
          <Plus className="h-4 w-4" /> 新しいチャット
        </Button>
        <Button
          onClick={handleShare}
          className="w-full justify-center gap-2 rounded-2xl border border-white/70 bg-white/80 text-slate-800 shadow-sm hover:bg-white"
          variant="outline"
          disabled={!messages.length}
        >
          <Share2 className="h-4 w-4" /> 会話をコピー
        </Button>
      </div>

      <div className="space-y-3">
        {showSessionSkeleton && <div className="space-y-3">{sessionSkeletonNodes}</div>}
        {!showSessionSkeleton && sessions.length === 0 && (
          <p className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 px-4 py-6 text-center text-sm text-emerald-800">
            まだチャット履歴がありません。
          </p>
        )}
        {!showSessionSkeleton &&
          sessions.map((session) => (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveSessionId(session.id);
                setIsSidebarOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveSessionId(session.id);
                  setIsSidebarOpen(false);
                }
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
                    : "text-emerald-700 hover:bg-emerald-50",
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="relative w-full" style={gradientStyle}>
      {isOffline && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-10 w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-yellow-200 bg-yellow-50/95 px-4 py-2 text-xs font-semibold text-yellow-900 shadow-lg">
          オフラインです。接続が戻り次第自動で再同期します。
        </div>
      )}
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
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-emerald-700">
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">
                  {phaseLabels[currentPhase]}
                </span>
                <span className="text-emerald-700/80">{phaseHint}</span>
              </div>
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

              {messages.length > 0 && (
                <div className="mx-auto mb-4 w-full max-w-3xl rounded-3xl border border-emerald-100 bg-emerald-50/70 px-5 py-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>{phaseDetail.title}</span>
                    <span>{phaseLabels[currentPhase]}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-900">{phaseDetail.summary}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-800">{phaseDetail.cta}</p>
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
                  onFocus={scrollIntoViewOnFocus}
                />
                <Button
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={!input.trim() || isLoading.sending || hasPendingResponse}
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
    gradientFrom: "#f7fff9",
    gradientVia: "#effef6",
    gradientTo: "#ecfdf5",
    accent: "#0f766e",
    accentMuted: "#0a4f43",
    cardBorder: "border-emerald-100",
    bubbleUser: "bg-[#fef2f2] text-[#7c2d12]",
    bubbleAssistant: "bg-[#ecfdf5]",
    assistantText: "text-[#064e3b]",
    assistantBorder: "border border-emerald-100",
    activeBackground: "bg-gradient-to-r from-emerald-500 to-teal-500",
    newChatButton: "bg-gradient-to-r from-emerald-500 to-teal-500 focus-visible:ring-emerald-200 shadow-emerald-500/30",
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
    gradientFrom: "#faf5ff",
    gradientVia: "#fbe8ff",
    gradientTo: "#f3ddff",
    accent: "#9333ea",
    accentMuted: "#6b21a8",
    cardBorder: "border-purple-100",
    bubbleUser: "bg-[#fdf2f8] text-[#9f1239]",
    bubbleAssistant: "bg-[#f9f5ff]",
    assistantText: "text-[#6b21a8]",
    assistantBorder: "border border-purple-100",
    activeBackground: "bg-gradient-to-r from-fuchsia-500 to-purple-500",
    newChatButton: "bg-gradient-to-r from-fuchsia-500 to-purple-500 focus-visible:ring-purple-200 shadow-fuchsia-400/30",
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
    gradientVia: "#f1f3f7",
    gradientTo: "#e7e9ee",
    accent: "#312e81",
    accentMuted: "#1e1b4b",
    cardBorder: "border-slate-200",
    bubbleUser: "bg-[#f8fafc] text-[#1f2937]",
    bubbleAssistant: "bg-[#f4f4f5]",
    assistantText: "text-[#27272a]",
    assistantBorder: "border border-slate-200",
    activeBackground: "bg-gradient-to-r from-slate-800 to-slate-600",
    newChatButton: "bg-gradient-to-r from-slate-900 to-slate-700 focus-visible:ring-slate-200 shadow-slate-900/30",
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
    gradientVia: "#dafcf5",
    gradientTo: "#ccfbf1",
    accent: "#0d9488",
    accentMuted: "#0f766e",
    cardBorder: "border-teal-100",
    bubbleUser: "bg-[#fefce8] text-[#713f12]",
    bubbleAssistant: "bg-[#eefdfd]",
    assistantText: "text-[#115e59]",
    assistantBorder: "border border-teal-100",
    activeBackground: "bg-gradient-to-r from-teal-500 to-cyan-500",
    newChatButton: "bg-gradient-to-r from-teal-500 to-cyan-500 focus-visible:ring-cyan-200 shadow-cyan-400/30",
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

const NAZARE_CONFIG: ChatConfig = {
  counselorId: "nazare",
  storageKey: "nazare-bible-chat-session",
  hero: {
    name: "ナザレ",
    subtitle: "聖書カウンセリング",
    description: "キリスト教聖典に基づき、悩める方に静かな光と寄り添いを届けます",
    iconUrl: "/images/counselors/nazare.png",
  },
  theme: {
    gradientFrom: "#fffaf5",
    gradientVia: "#f8f4ff",
    gradientTo: "#f0f4ff",
    accent: "#7c3aed",
    accentMuted: "#6d28d9",
    cardBorder: "border-purple-100",
    bubbleUser: "bg-[#fef3c7] text-[#78350f]",
    bubbleAssistant: "bg-[#f5f3ff]",
    assistantText: "text-[#5b21b6]",
    assistantBorder: "border border-purple-100",
    activeBackground: "bg-gradient-to-r from-purple-600 to-violet-600",
    newChatButton: "bg-gradient-to-r from-purple-600 to-violet-600 focus-visible:ring-purple-200 shadow-purple-500/30",
  },
  initialPrompts: [
    "最近、心が重く感じます",
    "人を許せない自分がいます",
    "人生の意味について考えています",
    "希望を見失いそうです",
  ],
  thinkingMessages: [
    "聖書の言葉を探しています...",
    "御心を尋ね求めています...",
    "祈りながら考えています...",
    "導きを受け取っています...",
  ],
};

export const AdamChatClient = () => <GeneralCounselorChatClient config={ADAM_CONFIG} />;
export const GeminiChatClient = () => <GeneralCounselorChatClient config={GEMINI_CONFIG} />;
export const ClaudeChatClient = () => <GeneralCounselorChatClient config={CLAUDE_CONFIG} />;
export const DeepChatClient = () => <GeneralCounselorChatClient config={DEEP_CONFIG} />;
export const NazareChatClient = () => <GeneralCounselorChatClient config={NAZARE_CONFIG} />;
