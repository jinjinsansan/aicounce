"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Loader2, Menu, Plus, Send, Share2, Trash2, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChatLayout } from "@/hooks/useChatLayout";
import { useChatDevice } from "@/hooks/useChatDevice";

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

export type ChatConfig = {
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
    headingText: string;
    headerSubtitle: string;
    headerDescription: string;
    badgeBackground: string;
    badgeText: string;
    badgeHintText: string;
    statsBadgeBackground: string;
    statsBadgeText: string;
    sectionBorder: string;
    promptBorder: string;
    promptText: string;
    promptHoverBorder: string;
    detailBorder: string;
    detailBackground: string;
    detailText: string;
    emptyBorder: string;
    emptyText: string;
    inputBorder: string;
    inputBg: string;
    inputPlaceholder: string;
    skeletonBorder: string;
    skeletonHighlight: string;
    skeletonShade: string;
    deleteButtonText: string;
    deleteButtonHover: string;
  };
  initialPrompts: string[];
  thinkingMessages: string[];
};

export type SessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type MessageItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  pending?: boolean;
};

type SendMessagePayload = {
  sessionId: string | null;
  message: string;
};

type SendMessageResult = {
  sessionId: string | null;
  content: string;
};

export type ChatDataSource = {
  loadSessions: () => Promise<SessionSummary[]>;
  loadMessages: (sessionId: string) => Promise<MessageItem[]>;
  sendMessage: (payload: SendMessagePayload) => Promise<SendMessageResult>;
  deleteSession: (sessionId: string) => Promise<void>;
};

type GeneralChatProps = {
  config: ChatConfig;
  dataSource?: ChatDataSource;
};

export const AUTH_ERROR_MESSAGE = "AUTH_REQUIRED";
const isAuthError = (err: unknown) => err instanceof Error && err.message === AUTH_ERROR_MESSAGE;

export function GeneralCounselorChatClient({ config, dataSource }: GeneralChatProps) {
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { composerRef, scrollContainerRef, messagesEndRef, scheduleScroll, composerHeight } = useChatLayout();
  const { isMobile, scrollIntoViewOnFocus } = useChatDevice(textareaRef);
  const hasRestoredRef = useRef(false);
  const lastSendRef = useRef<number>(0);

  const hasPendingResponse = useMemo(() => messages.some((msg) => msg.pending), [messages]);

  const loadSessions = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, sessions: true }));
    try {
      const sessionList = dataSource
        ? await dataSource.loadSessions()
        : await (async () => {
            const res = await fetch(`/api/conversations?counselorId=${encodeURIComponent(config.counselorId)}`);
            if (res.status === 401) {
              setNeedsAuth(true);
              return [] as SessionSummary[];
            }
            if (!res.ok) throw new Error("Failed to load conversations");
            const data = (await res.json()) as { conversations?: ConversationRow[] };
            return (data.conversations ?? [])
              .filter((row) => row.counselor_id === config.counselorId)
              .map((row) => ({
                id: row.id,
                title: row.title ?? `${config.hero.name}との相談`,
                updatedAt: row.updated_at ?? new Date().toISOString(),
              }));
          })();
      setSessions(sessionList);
    } catch (err) {
      if (isAuthError(err)) {
        setNeedsAuth(true);
        return;
      }
      console.error("loadSessions", err);
      setError("セッションの取得に失敗しました");
      setTimeout(() => setError(null), 2000);
    } finally {
      setIsLoading((prev) => ({ ...prev, sessions: false }));
    }
  }, [config.counselorId, config.hero.name, dataSource]);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      setIsLoading((prev) => ({ ...prev, messages: true }));
      try {
        const list = dataSource
          ? await dataSource.loadMessages(sessionId)
          : await (async () => {
              const res = await fetch(`/api/conversations/${sessionId}/messages`);
              if (res.status === 401) {
                setNeedsAuth(true);
                return [] as MessageItem[];
              }
              if (!res.ok) throw new Error("Failed to load messages");
              const data = (await res.json()) as { messages?: MessageRow[] };
              return (data.messages ?? []).map((row) => ({
                id: row.id,
                role: row.role,
                content: row.content,
                createdAt: row.created_at,
              }));
            })();
        setMessages(list);
        setHasLoadedMessages(true);
      } catch (err) {
        if (isAuthError(err)) {
          setNeedsAuth(true);
          return;
        }
        console.error("loadMessages", err);
        setError("メッセージの取得に失敗しました");
        setTimeout(() => setError(null), 2000);
      } finally {
        setIsLoading((prev) => ({ ...prev, messages: false }));
      }
    },
    [dataSource],
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

    if (!override) {
      setInput("");
    }
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
      const result = dataSource
        ? await dataSource.sendMessage({ sessionId: activeSessionId, message: text })
        : await (async (): Promise<SendMessageResult> => {
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
            return {
              sessionId: data.conversationId ?? activeSessionId ?? null,
              content: data.content ?? "応答を取得できませんでした",
            };
          })();

      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiTempId ? { ...msg, content: result.content, pending: false } : msg)),
      );

      if (!activeSessionId && result.sessionId) {
        setActiveSessionId(result.sessionId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(config.storageKey, result.sessionId);
        }
        loadSessions();
      }
    } catch (err) {
      if (isAuthError(err)) {
        setNeedsAuth(true);
      }
      console.error("handleSend", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiTempId
            ? { ...msg, content: "申し訳ありません。もう一度送信してください。", pending: false }
            : msg,
        ),
      );
      const friendlyError =
        err instanceof Error ? (isAuthError(err) ? "ログインが必要です" : err.message) : "送信に失敗しました";
      setError(friendlyError);
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
      if (dataSource) {
        await dataSource.deleteSession(sessionId);
      } else {
        const res = await fetch(`/api/conversations/${sessionId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("削除に失敗しました");
      }
      await loadSessions();
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      if (isAuthError(err)) {
        setNeedsAuth(true);
      }
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
    if (isLoading.sending || hasPendingResponse) {
      setInput(prompt);
      return;
    }
    void handleSend(prompt);
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

  const messagePaddingBottom = messages.length === 0 ? 0 : Math.max(composerHeight + 24, 160);
  const newChatButtonClasses = cn(
    "w-full justify-center gap-2 rounded-3xl border border-transparent px-5 py-4 text-base font-semibold text-white shadow-lg shadow-black/10 transition-all focus:ring-transparent focus-visible:ring-2 focus-visible:ring-offset-2 hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60",
    config.theme.newChatButton,
  );

  const showSessionSkeleton = isLoading.sessions && sessions.length === 0;
  const sessionSkeletonNodes = Array.from({ length: 3 }).map((_, index) => (
    <div key={index} className={cn("animate-pulse rounded-3xl border bg-white/60 px-4 py-4", config.theme.skeletonBorder)}>
      <div className={cn("h-4 w-1/2 rounded-full", config.theme.skeletonHighlight)} />
      <div className={cn("mt-2 h-3 w-1/3 rounded-full", config.theme.skeletonShade)} />
    </div>
  ));

  const SessionList = (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Button
          type="button"
          variant="default"
          onClick={handleNewChat}
          className={cn("border border-transparent", newChatButtonClasses)}
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
          <p
            className={cn(
              "rounded-3xl border border-dashed bg-white/70 px-4 py-6 text-center text-sm",
              config.theme.emptyBorder,
              config.theme.emptyText,
            )}
          >
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
                    : cn(config.theme.deleteButtonText, config.theme.deleteButtonHover),
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
    <div className="relative w-full border-t border-slate-200" style={gradientStyle}>
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
          <header className={cn("flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4", config.theme.sectionBorder)}>
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
              <p className={cn("text-xs font-semibold uppercase tracking-[0.3em]", config.theme.headerSubtitle)}>
                {config.hero.subtitle}
              </p>
              <h1 className={cn("text-2xl font-bold", config.theme.headingText)}>{config.hero.name}</h1>
              <p className={cn("text-sm", config.theme.headerDescription)}>{config.hero.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs" />
            </div>
            </div>
            <div className="flex items-center gap-3">
              <Image
                src={config.hero.iconUrl}
                alt={config.hero.name}
                width={56}
                height={56}
                className={cn("h-14 w-14 rounded-2xl bg-white object-contain", config.theme.detailBorder)}
              />
            </div>
          </header>

          {messages.length === 0 && config.initialPrompts.length > 0 && (
            <section className={cn("border-b px-6 py-4", config.theme.sectionBorder)}>
              <p className={cn("text-sm font-semibold", config.theme.headingText)}>すぐに話したいことを選べます</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {config.initialPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    className={cn(
                      "rounded-full border bg-white px-4 py-1.5 text-xs transition",
                      config.theme.promptBorder,
                      config.theme.promptText,
                      config.theme.promptHoverBorder,
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="relative flex flex-1 flex-col overflow-hidden">
            {error && (
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-6 top-4 z-10 rounded-2xl border bg-white/90 px-4 py-2 text-center text-sm shadow",
                  config.theme.detailBorder,
                  config.theme.detailText,
                )}
              >
                {error}
              </div>
            )}

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 py-6"
              style={{ paddingBottom: `${messagePaddingBottom}px` }}
            >
              {messages.length === 0 && (
                <div className={cn("flex h-full flex-col items-center justify-center text-center", config.theme.promptText)}>
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
                      <div className={cn("h-10 w-10 rounded-2xl border bg-white", config.theme.detailBorder)}>
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
                          <div className={cn("flex items-center gap-2", config.theme.promptText)}>
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
              className={cn("border-t bg-white px-4 py-3", config.theme.sectionBorder)}
              style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="悩みや状況を入力してください"
                  className={cn(
                    "min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border-2 px-4 py-3 text-base leading-relaxed text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-offset-0 md:text-sm",
                    config.theme.inputBorder,
                    config.theme.inputBg,
                    config.theme.inputPlaceholder,
                  )}
                  rows={1}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
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
              <p className={cn("text-sm font-semibold", config.theme.headingText)}>チャット履歴</p>
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
    headingText: "text-[#063221]",
    headerSubtitle: "text-emerald-700",
    headerDescription: "text-emerald-700/80",
    badgeBackground: "bg-emerald-50",
    badgeText: "text-emerald-800",
    badgeHintText: "text-emerald-600/80",
    statsBadgeBackground: "bg-emerald-50",
    statsBadgeText: "text-emerald-700",
    sectionBorder: "border-emerald-50",
    promptBorder: "border-emerald-100",
    promptText: "text-emerald-700",
    promptHoverBorder: "hover:border-emerald-300",
    detailBorder: "border-emerald-100",
    detailBackground: "bg-emerald-50/70",
    detailText: "text-emerald-800",
    emptyBorder: "border-emerald-200",
    emptyText: "text-emerald-700",
    inputBorder: "border-emerald-100 focus:border-emerald-300 focus:ring-emerald-100",
    inputBg: "bg-emerald-50/50",
    inputPlaceholder: "placeholder-emerald-400",
    skeletonBorder: "border-emerald-50",
    skeletonHighlight: "bg-emerald-100",
    skeletonShade: "bg-emerald-50",
    deleteButtonText: "text-emerald-700",
    deleteButtonHover: "hover:bg-emerald-50",
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
    gradientFrom: "#fff0f7",
    gradientVia: "#fde7fb",
    gradientTo: "#fae8ff",
    accent: "#db2777",
    accentMuted: "#a21caf",
    cardBorder: "border-pink-100",
    bubbleUser: "bg-[#fff1f2] text-[#be123c]",
    bubbleAssistant: "bg-[#fdf2fe]",
    assistantText: "text-[#a21caf]",
    assistantBorder: "border border-pink-100",
    activeBackground: "bg-gradient-to-r from-[#fb7185] via-[#f472b6] to-[#c026d3]",
    newChatButton:
      "bg-gradient-to-r from-[#fb7185] via-[#f472b6] to-[#c084fc] focus-visible:ring-pink-200 shadow-pink-300/40",
    headingText: "text-[#86198f]",
    headerSubtitle: "text-[#db2777]",
    headerDescription: "text-[#a21caf]",
    badgeBackground: "bg-[#fdf2f8]",
    badgeText: "text-[#a21caf]",
    badgeHintText: "text-[#a21caf]/80",
    statsBadgeBackground: "bg-[#fdf4ff]",
    statsBadgeText: "text-[#a21caf]",
    sectionBorder: "border-pink-100",
    promptBorder: "border-pink-100",
    promptText: "text-[#a21caf]",
    promptHoverBorder: "hover:border-pink-300",
    detailBorder: "border-pink-100",
    detailBackground: "bg-[#fdf4ff]",
    detailText: "text-[#86198f]",
    emptyBorder: "border-pink-200",
    emptyText: "text-[#a21caf]",
    inputBorder: "border-pink-100 focus:border-pink-300 focus:ring-pink-200",
    inputBg: "bg-pink-50/60",
    inputPlaceholder: "placeholder-pink-300",
    skeletonBorder: "border-pink-100",
    skeletonHighlight: "bg-pink-100",
    skeletonShade: "bg-pink-50",
    deleteButtonText: "text-[#be185d]",
    deleteButtonHover: "hover:bg-pink-50",
  },
  initialPrompts: [
    "感情と行動のバランスが崩れています",
    "決断で迷っていて整理したい",
    "自分を責める気持ちと頑張りたい気持ちが混ざります",
    "選択肢を比較する視点を整理したい",
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
    headingText: "text-slate-800",
    headerSubtitle: "text-slate-500",
    headerDescription: "text-slate-600",
    badgeBackground: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeHintText: "text-slate-500",
    statsBadgeBackground: "bg-slate-100",
    statsBadgeText: "text-slate-700",
    sectionBorder: "border-slate-200",
    promptBorder: "border-slate-200",
    promptText: "text-slate-700",
    promptHoverBorder: "hover:border-slate-400",
    detailBorder: "border-slate-200",
    detailBackground: "bg-slate-50",
    detailText: "text-slate-700",
    emptyBorder: "border-slate-200",
    emptyText: "text-slate-600",
    inputBorder: "border-slate-200 focus:border-slate-400 focus:ring-slate-200",
    inputBg: "bg-slate-50",
    inputPlaceholder: "placeholder-slate-400",
    skeletonBorder: "border-slate-200",
    skeletonHighlight: "bg-slate-200",
    skeletonShade: "bg-slate-100",
    deleteButtonText: "text-slate-600",
    deleteButtonHover: "hover:bg-slate-100",
  },
  initialPrompts: [
    "気持ちを落ち着けながら整理したい",
    "丁寧に振り返りをさせてください",
    "自分の価値観が揺らいでいます",
    "静かな文章で考えをまとめたい",
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
    headingText: "text-[#0f4c45]",
    headerSubtitle: "text-teal-600",
    headerDescription: "text-teal-700",
    badgeBackground: "bg-teal-50",
    badgeText: "text-teal-800",
    badgeHintText: "text-teal-600",
    statsBadgeBackground: "bg-teal-50",
    statsBadgeText: "text-teal-700",
    sectionBorder: "border-teal-50",
    promptBorder: "border-teal-100",
    promptText: "text-teal-700",
    promptHoverBorder: "hover:border-teal-300",
    detailBorder: "border-teal-100",
    detailBackground: "bg-teal-50/70",
    detailText: "text-teal-800",
    emptyBorder: "border-teal-200",
    emptyText: "text-teal-700",
    inputBorder: "border-teal-100 focus:border-teal-300 focus:ring-teal-100",
    inputBg: "bg-teal-50/50",
    inputPlaceholder: "placeholder-teal-400",
    skeletonBorder: "border-teal-100",
    skeletonHighlight: "bg-teal-100",
    skeletonShade: "bg-teal-50",
    deleteButtonText: "text-teal-700",
    deleteButtonHover: "hover:bg-teal-50",
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

const NANA_CONFIG: ChatConfig = {
  counselorId: "nana",
  storageKey: "nana-mhsw-chat-session",
  hero: {
    name: "ナナ",
    subtitle: "精神保健福祉 AI",
    description: "優しく支援的に、暮らしの安全と伴走を整えます",
    iconUrl: "/images/counselors/nana.png",
  },
  theme: {
    gradientFrom: "#fff5f7",
    gradientVia: "#ffe4e6",
    gradientTo: "#fff1f2",
    accent: "#f472b6",
    accentMuted: "#fb7185",
    cardBorder: "border-pink-100",
    bubbleUser: "bg-[#ffe4e6] text-[#be123c]",
    bubbleAssistant: "bg-[#fff7fb]",
    assistantText: "text-[#9d174d]",
    assistantBorder: "border border-pink-100",
    activeBackground: "bg-gradient-to-r from-[#f9a8d4] via-[#f472b6] to-[#fb7185]",
    newChatButton:
      "bg-gradient-to-r from-[#f9a8d4] via-[#f472b6] to-[#fb7185] focus-visible:ring-pink-200 shadow-pink-200/60",
    headingText: "text-[#9d174d]",
    headerSubtitle: "text-[#f472b6]",
    headerDescription: "text-[#9d174d]",
    badgeBackground: "bg-[#ffe4e6]",
    badgeText: "text-[#be123c]",
    badgeHintText: "text-[#be123c]",
    statsBadgeBackground: "bg-[#fff7fb]",
    statsBadgeText: "text-[#be123c]",
    sectionBorder: "border-pink-100",
    promptBorder: "border-pink-200",
    promptText: "text-[#be123c]",
    promptHoverBorder: "hover:border-pink-300",
    detailBorder: "border-pink-100",
    detailBackground: "bg-[#fff7fb]",
    detailText: "text-[#9d174d]",
    emptyBorder: "border-pink-200",
    emptyText: "text-[#be123c]",
    inputBorder: "border-pink-200 focus:border-pink-400 focus:ring-pink-100",
    inputBg: "bg-white",
    inputPlaceholder: "placeholder:text-pink-400",
    skeletonBorder: "border-pink-100",
    skeletonHighlight: "bg-pink-100/70",
    skeletonShade: "bg-pink-50",
    deleteButtonText: "text-[#be123c]",
    deleteButtonHover: "hover:bg-[#ffe4e6]",
  },
  initialPrompts: [
    "親がお酒を飲むと荒れて怖いです",
    "自分のせいだと思ってしまいます",
    "助けを求めるのが苦手で孤立しています",
    "子育てと仕事の両立で限界です",
  ],
  thinkingMessages: [
    "安心できる言葉を探しています...",
    "やさしく整理しています...",
    "背中を押す一言を考えています...",
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
    gradientFrom: "#f5f0ff",
    gradientVia: "#ede9fe",
    gradientTo: "#e0e7ff",
    accent: "#6d28d9",
    accentMuted: "#4c1d95",
    cardBorder: "border-violet-100",
    bubbleUser: "bg-[#ede9fe] text-[#5b21b6]",
    bubbleAssistant: "bg-[#f4f1ff]",
    assistantText: "text-[#4c1d95]",
    assistantBorder: "border border-violet-100",
    activeBackground: "bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#5b21b6]",
    newChatButton:
      "bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#5b21b6] focus-visible:ring-violet-200 shadow-violet-400/30",
    headingText: "text-[#3b0a63]",
    headerSubtitle: "text-[#9333ea]",
    headerDescription: "text-[#4c1d95]",
    badgeBackground: "bg-[#f4f1ff]",
    badgeText: "text-[#5b21b6]",
    badgeHintText: "text-[#6d28d9]",
    statsBadgeBackground: "bg-[#f4f1ff]",
    statsBadgeText: "text-[#5b21b6]",
    sectionBorder: "border-violet-100",
    promptBorder: "border-violet-100",
    promptText: "text-[#5b21b6]",
    promptHoverBorder: "hover:border-violet-300",
    detailBorder: "border-violet-100",
    detailBackground: "bg-[#f4f1ff]",
    detailText: "text-[#4c1d95]",
    emptyBorder: "border-violet-200",
    emptyText: "text-[#4c1d95]",
    inputBorder: "border-violet-100 focus:border-violet-300 focus:ring-violet-200",
    inputBg: "bg-violet-50/60",
    inputPlaceholder: "placeholder-violet-300",
    skeletonBorder: "border-violet-100",
    skeletonHighlight: "bg-violet-100",
    skeletonShade: "bg-violet-50",
    deleteButtonText: "text-[#6d28d9]",
    deleteButtonHover: "hover:bg-violet-50",
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

const SAITO_CONFIG: ChatConfig = {
  counselorId: "saito",
  storageKey: "saito-gratitude-chat-session",
  hero: {
    name: "サイトウ",
    subtitle: "感謝と言霊カウンセラー",
    description: "軽やかな言霊スタイルで、感謝と前向きワードを呼び水に核心を伝えます。",
    iconUrl: "/saito.png",
  },
  theme: {
    gradientFrom: "#fff8e6",
    gradientVia: "#fef3c7",
    gradientTo: "#fde68a",
    accent: "#eab308",
    accentMuted: "#f59e0b",
    cardBorder: "border-amber-200",
    bubbleUser: "bg-[#fffdf5]",
    bubbleAssistant: "bg-[#fef3c7]",
    assistantText: "text-[#854d0e]",
    assistantBorder: "border border-amber-200",
    activeBackground: "bg-gradient-to-r from-[#fde68a] via-[#fbbf24] to-[#eab308]",
    newChatButton:
      "bg-gradient-to-r from-[#fde68a] via-[#fbbf24] to-[#eab308] focus-visible:ring-amber-200 shadow-amber-200/70",
    headingText: "text-[#854d0e]",
    headerSubtitle: "text-[#eab308]",
    headerDescription: "text-[#92400e]",
    badgeBackground: "bg-amber-50",
    badgeText: "text-[#92400e]",
    badgeHintText: "text-amber-700",
    statsBadgeBackground: "bg-amber-50",
    statsBadgeText: "text-amber-700",
    sectionBorder: "border-amber-100",
    promptBorder: "border-amber-200",
    promptText: "text-amber-800",
    promptHoverBorder: "hover:border-amber-300",
    detailBorder: "border-amber-100",
    detailBackground: "bg-amber-50",
    detailText: "text-amber-800",
    emptyBorder: "border-amber-200",
    emptyText: "text-amber-700",
    inputBorder: "border-amber-200 focus:border-amber-400 focus:ring-amber-200",
    inputBg: "bg-white",
    inputPlaceholder: "placeholder:text-amber-400",
    skeletonBorder: "border-amber-100",
    skeletonHighlight: "bg-amber-100",
    skeletonShade: "bg-amber-50",
    deleteButtonText: "text-amber-700",
    deleteButtonHover: "hover:bg-amber-50",
  },
  initialPrompts: [
    "最近あった『感謝してます』と言える出来事は？",
    "ついてると思えない状況を変えたい",
    "挑戦したいけど迷っていること",
    "言霊で気分を切り替えたい",
  ],
  thinkingMessages: ["ついてるね、と考え中...", "感謝の呼び水を探しています...", "いい例え話を準備中..."],
};

const DALE_CONFIG: ChatConfig = {
  counselorId: "dale",
  storageKey: "dale-counseling-chat-session",
  hero: {
    name: "デール",
    subtitle: "自己啓発カウンセラー",
    description: "『道は開ける』の原則で、不安を具体的な行動ステップに変えます。",
    iconUrl: "/dale.png",
  },
  theme: {
    gradientFrom: "#0b1224",
    gradientVia: "#0f1e34",
    gradientTo: "#0f2744",
    accent: "#38bdf8",
    accentMuted: "#2563eb",
    cardBorder: "border-[#1e3a8a]",
    bubbleUser: "bg-[#0f172a] text-[#cbd5f5]",
    bubbleAssistant: "bg-[#0b162f]",
    assistantText: "text-white",
    assistantBorder: "border border-[#1e3a8a]",
    activeBackground: "bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#1d4ed8]",
    newChatButton:
      "bg-gradient-to-r from-[#38bdf8] via-[#2563eb] to-[#0ea5e9] focus-visible:ring-sky-200 shadow-sky-400/40",
    headingText: "text-[#e2e8f0]",
    headerSubtitle: "text-[#7dd3fc]",
    headerDescription: "text-[#bfdbfe]",
    badgeBackground: "bg-[#0f172a]",
    badgeText: "text-[#e0f2fe]",
    badgeHintText: "text-[#bfdbfe]",
    statsBadgeBackground: "bg-[#0f172a]",
    statsBadgeText: "text-[#e0f2fe]",
    sectionBorder: "border-[#1e3a8a]",
    promptBorder: "border-[#1e3a8a]",
    promptText: "text-[#c7e3ff]",
    promptHoverBorder: "hover:border-sky-400",
    detailBorder: "border-[#1e3a8a]",
    detailBackground: "bg-[#0b162f]",
    detailText: "text-white",
    emptyBorder: "border-[#1e3a8a]",
    emptyText: "text-[#bfdbfe]",
    inputBorder: "border-[#1e3a8a] focus:border-sky-400 focus:ring-sky-200/40",
    inputBg: "bg-[#0b162f]",
    inputPlaceholder: "placeholder:text-sky-100/70",
    skeletonBorder: "border-[#1e3a8a]",
    skeletonHighlight: "#1d2b4a",
    skeletonShade: "#0f172a",
    deleteButtonText: "text-[#e2e8f0]",
    deleteButtonHover: "hover:bg-[#0b1224]",
  },
  initialPrompts: [
    "最悪を想像して受け入れる方法を知りたい",
    "今日1日の区切りで考えるコツは？",
    "批判への向き合い方を教えて",
    "不安で眠れないときの行動ステップ",
  ],
  thinkingMessages: [
    "最悪ケースを整理しています...",
    "行動ステップを組み立てています...",
    "原則に沿って優先順位を決めています...",
  ],
};

const MIRAI_CONFIG: ChatConfig = {
  counselorId: "mirai",
  storageKey: "mirai-future-chat-session",
  hero: {
    name: "ミライ",
    subtitle: "未来型ロボットカウンセラー",
    description: "未来ノート（RAG）で前向きな一歩を一緒に作る、猫型ロボット風の相棒。",
    iconUrl: "/mirai.png",
  },
  theme: {
    gradientFrom: "#e0f2fe",
    gradientVia: "#dbeafe",
    gradientTo: "#e0f7fa",
    accent: "#0ea5e9",
    accentMuted: "#2563eb",
    cardBorder: "border-sky-100",
    bubbleUser: "bg-[#e0f2fe] text-[#0f172a]",
    bubbleAssistant: "bg-white",
    assistantText: "text-[#0f172a]",
    assistantBorder: "border border-sky-100",
    activeBackground: "bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#22d3ee]",
    newChatButton:
      "bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#22d3ee] focus-visible:ring-sky-200 shadow-sky-300/40",
    headingText: "text-[#0f172a]",
    headerSubtitle: "text-[#0ea5e9]",
    headerDescription: "text-[#1e293b]",
    badgeBackground: "bg-[#e0f2fe]",
    badgeText: "text-[#0f172a]",
    badgeHintText: "text-[#2563eb]",
    statsBadgeBackground: "bg-[#e0f2fe]",
    statsBadgeText: "text-[#0f172a]",
    sectionBorder: "border-sky-100",
    promptBorder: "border-sky-100",
    promptText: "text-[#0f172a]",
    promptHoverBorder: "hover:border-sky-300",
    detailBorder: "border-sky-100",
    detailBackground: "bg-[#f8fbff]",
    detailText: "text-[#0f172a]",
    emptyBorder: "border-sky-100",
    emptyText: "text-[#1e293b]",
    inputBorder: "border-sky-100 focus:border-sky-300 focus:ring-sky-200",
    inputBg: "bg-white",
    inputPlaceholder: "placeholder:text-sky-300",
    skeletonBorder: "border-sky-100",
    skeletonHighlight: "bg-sky-100",
    skeletonShade: "bg-sky-50",
    deleteButtonText: "text-[#0f172a]",
    deleteButtonHover: "hover:bg-sky-50",
  },
  initialPrompts: [
    "未来が不安で一歩出せません",
    "自信が持てないときの考え方を教えて",
    "習慣化のコツが知りたい",
    "優しい相棒として伴走してほしい",
  ],
  thinkingMessages: [
    "未来ノートをめくっています...",
    "行動のヒントを探しています...",
    "優しい言葉を整えています...",
  ],
};

export const AdamChatClient = () => <GeneralCounselorChatClient config={ADAM_CONFIG} />;
export const GeminiChatClient = () => <GeneralCounselorChatClient config={GEMINI_CONFIG} />;
export const ClaudeChatClient = () => <GeneralCounselorChatClient config={CLAUDE_CONFIG} />;
export const DeepChatClient = () => <GeneralCounselorChatClient config={DEEP_CONFIG} />;
export const NazareChatClient = () => <GeneralCounselorChatClient config={NAZARE_CONFIG} />;
export const NanaChatClient = () => <GeneralCounselorChatClient config={NANA_CONFIG} />;
export const SaitoChatClient = () => <GeneralCounselorChatClient config={SAITO_CONFIG} />;
export const DaleChatClient = () => <GeneralCounselorChatClient config={DALE_CONFIG} />;
export const MiraiChatClient = () => <GeneralCounselorChatClient config={MIRAI_CONFIG} />;
