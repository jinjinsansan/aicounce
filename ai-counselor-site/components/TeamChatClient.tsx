"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { CheckSquare, Square, Loader2, Menu, Plus, Send, Share2, Trash2, User, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { debugLog } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { useChatLayout } from "@/hooks/useChatLayout";
import { useChatDevice } from "@/hooks/useChatDevice";

type Participant = { id: string; name: string; iconUrl: string; comingSoon?: boolean };

type SessionSummary = {
  id: string;
  title: string | null;
  participants: string[] | null;
  updated_at: string;
};

type MessageItem = {
  id: string;
  role: "user" | "assistant";
  author?: string;
  authorId?: string;
  content: string;
  iconUrl?: string;
  created_at: string;
  pending?: boolean;
};

type TeamMessageRow = {
  id: string;
  role: "user" | "assistant";
  author?: string | null;
  author_id?: string | null;
  content: string;
  icon_url?: string | null;
  created_at: string;
};

type MessagesResponse = {
  session?: Pick<SessionSummary, "id" | "title" | "participants">;
  messages?: TeamMessageRow[];
};

type SessionsResponse = {
  sessions?: SessionSummary[];
};

type CreateSessionResponse = {
  session: SessionSummary;
};

type RespondResponse = {
  responses?: {
    author?: string;
    authorId?: string | null;
    content: string;
    iconUrl?: string | null;
  }[];
};

const ACTIVE_SESSION_STORAGE_KEY = "team-counseling-active-session-id";
const NON_COMING_SOON_PARTICIPANTS = FALLBACK_COUNSELORS.filter((c) => !c.comingSoon);
const DEFAULT_PARTICIPANTS =
  NON_COMING_SOON_PARTICIPANTS.length > 0
    ? NON_COMING_SOON_PARTICIPANTS.map((c) => c.id)
    : ["michele", "sato"];
const TEAM_CHAT_LOGO_SRC = "/logo.png";

const COLOR_MAP: Record<string, { bubble: string; text: string; border: string }> = {
  michele: { bubble: "bg-[#fff3f8]", text: "text-[#7b364d]", border: "border-[#ffd4e3]" },
  sato: { bubble: "bg-[#eef4ff]", text: "text-[#1d3a8a]", border: "border-[#d7e9ff]" },
  adam: { bubble: "bg-[#f3fff7]", text: "text-[#065f46]", border: "border-[#c1f5dc]" },
  gemini: { bubble: "bg-[#f9efff]", text: "text-[#6b21a8]", border: "border-[#ead8ff]" },
  claude: { bubble: "bg-[#f8fafc]", text: "text-[#1f2937]", border: "border-[#e2e8f0]" },
  deep: { bubble: "bg-[#ecfeff]", text: "text-[#0f766e]", border: "border-[#c5f6f2]" },
  nazare: { bubble: "bg-[#ede9fe]", text: "text-[#5b21b6]", border: "border-[#d8b4fe]" },
  siddhartha: { bubble: "bg-[#f0fdf4]", text: "text-[#166534]", border: "border-[#bbf7d0]" },
  saito: { bubble: "bg-[#fffbea]", text: "text-[#92400e]", border: "border-[#fef3c7]" },
  nana: { bubble: "bg-[#fff1f5]", text: "text-[#be123c]", border: "border-[#fecdd3]" },
  dale: { bubble: "bg-[#0f172a]", text: "text-[#bfdbfe]", border: "border-[#1e3a8a]" },
  mirai: { bubble: "bg-[#e0f2fe]", text: "text-[#0f172a]", border: "border-[#bfdbfe]" },
  moderator: { bubble: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

const thinkingMessages = [
  "チームで議論しています...",
  "複数の視点から考えています...",
  "それぞれの専門性で分析しています...",
];

const THINKING_MESSAGE_INTERVAL_MS = 1400;

const PROMPT_PRESETS = [
  "最近の気持ちを整理したい",
  "複数の視点でアドバイスが欲しい",
  "意思決定に迷っています",
  "セルフケアのアイデアを教えて",
];

export function TeamChatClient() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([...DEFAULT_PARTICIPANTS]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState({ sessions: false, messages: false, sending: false });
  const [needsAuth, setNeedsAuth] = useState(false);
  const [needsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThinkingIndex, setCurrentThinkingIndex] = useState(0);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [hasInitializedSessions, setHasInitializedSessions] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { composerRef, scrollContainerRef, messagesEndRef, scheduleScroll, composerHeight } = useChatLayout();
  const { isMobile, scrollIntoViewOnFocus } = useChatDevice(textareaRef);
  const hasRestoredSessionRef = useRef(false);
  const skipNextMessagesLoadRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRequestTimeRef = useRef<number>(0);

  const availableParticipants: Participant[] = useMemo(
    () =>
      FALLBACK_COUNSELORS.map((c) => ({
        id: c.id,
        name: c.name,
        iconUrl: c.iconUrl ?? "",
        comingSoon: Boolean(c.comingSoon),
      })),
    [],
  );

  const participantLookup = useMemo(() => {
    const map = new Map<string, (typeof FALLBACK_COUNSELORS)[number]>();
    FALLBACK_COUNSELORS.forEach((counselor) => map.set(counselor.id, counselor));
    return map;
  }, []);

  const selectableParticipants = useMemo(
    () => availableParticipants.filter((participant) => !participant.comingSoon),
    [availableParticipants],
  );

  const hasPendingResponse = useMemo(() => messages.some((msg) => msg.pending), [messages]);

  const gradientStyle = useMemo(
    () => ({
      background:
        "linear-gradient(145deg, rgba(255,247,237,0.95), rgba(255,237,213,0.95), rgba(255,228,230,0.95), rgba(221,231,254,0.95), rgba(226,232,255,0.95))",
      minHeight: "calc(100vh - 4rem)",
    }),
    [],
  );

  const newChatButtonClasses =
    "w-full justify-center gap-2 rounded-3xl border border-transparent bg-gradient-to-r from-[#ec4899] via-[#a855f7] to-[#0ea5e9] px-5 py-4 text-base font-semibold text-white shadow-lg shadow-black/10 transition-all focus:ring-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-200 hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60";

  const loadSessions = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, sessions: true }));
    try {
      const res = await fetch("/api/team/sessions");
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = (await res.json()) as SessionsResponse;
      const allSessions = data.sessions ?? [];
      console.log("[Sessions] Loaded sessions:", allSessions);
      setSessions(
        allSessions.map((session) => ({
          id: session.id,
          title: session.title || "チームカウンセリング",
          participants: session.participants ?? [],
          updated_at: session.updated_at,
        })),
      );
      setHasInitializedSessions(true);
    } catch (err) {
      console.error("[Sessions] Failed to load:", err);
    } finally {
      setIsLoading((prev) => ({ ...prev, sessions: false }));
    }
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    setIsLoading((prev) => ({ ...prev, messages: true }));
    try {
      const res = await fetch(`/api/team/sessions/${sessionId}/messages`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = (await res.json()) as MessagesResponse;
      const sessionData = data.session;
      const msgs = data.messages ?? [];

      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          author: m.author ?? undefined,
          authorId: m.author_id ?? undefined,
          content: m.content,
          iconUrl: m.icon_url ?? undefined,
          created_at: m.created_at,
        })),
      );

      if (sessionData?.participants) {
        setParticipants(sessionData.participants);
      }
      
      setHasLoadedMessages(true);
    } catch (err) {
      console.error("[Messages] Failed to load:", err);
    } finally {
      setIsLoading((prev) => ({ ...prev, messages: false }));
    }
  }, []);

  const toggleParticipant = (id: string) => {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    debugLog("[Sessions] Loading sessions...");
    loadSessions();
  }, [loadSessions]);

  useLayoutEffect(() => {
    if (messages.length === 0) return;
    scheduleScroll();
  }, [messages.length, scheduleScroll]);

  useEffect(() => {
    if (!isMounted || hasRestoredSessionRef.current || !hasInitializedSessions) {
      return;
    }

    if (sessions.length === 0) {
      hasRestoredSessionRef.current = true;
      setIsRestoringSession(false);
      return;
    }

    try {
      const storedSessionId = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (storedSessionId) {
        const exists = sessions.some((s) => s.id === storedSessionId);
        if (exists) {
          setActiveSessionId(storedSessionId);
        } else {
          setActiveSessionId(sessions[0].id);
        }
      } else {
        setActiveSessionId(sessions[0].id);
      }
    } catch (error) {
      console.error("[Session Restore] Failed:", error);
    }

    hasRestoredSessionRef.current = true;
    setIsRestoringSession(false);
  }, [isMounted, hasInitializedSessions, sessions]);

  useEffect(() => {
    if (!activeSessionId) return;
    try {
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
    } catch (error) {
      console.error("[Save Session] Failed:", error);
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId || !hasRestoredSessionRef.current) {
      return;
    }
    if (skipNextMessagesLoadRef.current) {
      skipNextMessagesLoadRef.current = false;
      return;
    }
    setHasLoadedMessages(false);
    loadMessages(activeSessionId);
  }, [activeSessionId, loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasPendingResponse) {
        setCurrentThinkingIndex((prev) => (prev + 1) % thinkingMessages.length);
      }
    }, THINKING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasPendingResponse]);

  useEffect(() => {
    if (isLoading.sending) {
      loadingIntervalRef.current = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setLoadingSeconds(0);
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading.sending]);

  const showSessionSkeleton = isLoading.sessions && sessions.length === 0;
  const sessionSkeletonNodes = Array.from({ length: 3 }).map((_, index) => (
    <div key={index} className="animate-pulse rounded-2xl border border-white/60 bg-white/70 p-3">
      <div className="h-3 w-2/3 rounded-full bg-slate-200/80" />
      <div className="mt-1 h-2.5 w-1/3 rounded-full bg-slate-200/60" />
    </div>
  ));

  const handleNewChat = () => {
    debugLog("[User Action] New chat clicked");
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setHasLoadedMessages(true);
    hasRestoredSessionRef.current = false;
    setParticipants([...DEFAULT_PARTICIPANTS]);

    try {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch (error) {
      console.error("[User Action] Failed to clear localStorage:", error);
    }

    if (!isMobile) {
      textareaRef.current?.focus();
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText ? overrideText.trim() : input.trim();

    if (!textToSend) {
      return;
    }

    if (participants.length === 0) {
      setError("参加AIを1人以上選択してください");
      setTimeout(() => setError(null), 2000);
      return;
    }

    if (hasPendingResponse) {
      setError("前の応答を待っています...");
      setTimeout(() => setError(null), 1000);
      return;
    }

    if (isLoading.sending) {
      return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const MIN_REQUEST_INTERVAL = 3000;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && lastRequestTimeRef.current > 0) {
      const remainingTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
      setError(`${remainingTime}秒お待ちください...`);
      setTimeout(() => setError(null), 1000);
      return;
    }

    lastRequestTimeRef.current = now;

    let currentSessionId = activeSessionId;

    // Create session if it doesn't exist (first message)
    if (!currentSessionId) {
      try {
        // Generate title from first message (first 60 chars)
        const title = textToSend.slice(0, 60) + (textToSend.length > 60 ? "..." : "");
        
        const createRes = await fetch("/api/team/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            participants,
          }),
        });

        if (!createRes.ok) {
          throw new Error("Failed to create session");
        }

        const createData = (await createRes.json()) as CreateSessionResponse;
        console.log("[Session] Created session:", createData.session);
        currentSessionId = createData.session.id;
        skipNextMessagesLoadRef.current = true;
        setActiveSessionId(currentSessionId);
        
        if (currentSessionId) {
          try {
            window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, currentSessionId);
          } catch (e) {
            console.error("[Session] Failed to save to localStorage:", e);
          }
        }

        await loadSessions();
      } catch (err) {
        console.error("[Session] Failed to create session:", err);
        setError("セッションの作成に失敗しました");
        setTimeout(() => setError(null), 2000);
        return;
      }
    }

    if (!overrideText) {
      setInput("");
    }
    setError(null);
    const tempUserId = `temp-user-${Date.now()}`;
    const tempAiId = `temp-ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: textToSend, created_at: new Date().toISOString() },
      { id: tempAiId, role: "assistant", content: thinkingMessages[0], pending: true, created_at: new Date().toISOString(), iconUrl: TEAM_CHAT_LOGO_SRC },
    ]);

    setIsLoading((prev) => ({ ...prev, sending: true }));
    abortRef.current = new AbortController();

    let hasError = false;

    try {
      const res = await fetch("/api/team/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId || activeSessionId || undefined,
          message: textToSend,
          participants,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let serverMessage = "ネットワークエラーが発生しました";
        try {
          const errorBody = (await res.json()) as { error?: string };
          if (errorBody?.error) {
            serverMessage = errorBody.error;
          }
        } catch (parseError) {
          console.error("Failed to parse error response", parseError);
        }
        throw new Error(serverMessage);
      }

      const data = (await res.json()) as RespondResponse;

      // Remove pending message and add all AI responses
      const aiResponses: MessageItem[] = (data.responses ?? []).map((r, index) => ({
        id: `ai-${Date.now()}-${index}`,
        role: "assistant" as const,
        author: r.author,
        authorId: r.authorId ?? undefined,
        content: r.content,
        iconUrl: r.iconUrl ?? undefined,
        created_at: new Date().toISOString(),
      }));

      setMessages((prev) => {
        const withoutPending = prev.filter((msg) => msg.id !== tempAiId);
        return [...withoutPending, ...aiResponses];
      });

      // Save messages to database
      if (currentSessionId) {
        try {
          const messagesToSave = [
            { role: "user", content: textToSend, author: null, author_id: null, icon_url: null },
            ...aiResponses.map((r: MessageItem) => ({
              role: "assistant" as const,
              content: r.content,
              author: r.author,
              author_id: r.authorId,
              icon_url: r.iconUrl,
            })),
          ];

          await fetch(`/api/team/sessions/${currentSessionId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: messagesToSave }),
          });

          // Refresh sessions list to update timestamp
          await loadSessions();
        } catch (saveErr) {
          console.error("[Messages] Failed to save messages:", saveErr);
          // Don't show error to user, messages are already displayed
        }
      }

    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("[Send] Request was aborted");
        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserId && msg.id !== tempAiId));
        return;
      }
      
      hasError = true;
      const friendlyError = err instanceof Error ? err.message : "送信に失敗しました";
      setError(friendlyError);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempAiId
            ? { ...msg, content: "申し訳ありません。もう一度送ってみてください。", pending: false }
            : msg,
        ),
      );
    } finally {
      if (hasError) {
        setIsLoading((prev) => ({ ...prev, sending: false }));
        setTimeout(() => setError(null), 1000);
      } else {
        setTimeout(() => {
          setIsLoading((prev) => ({ ...prev, sending: false }));
        }, 500);
      }
    }
  };

  const handleDeleteSession = async (sessionId: string, event?: MouseEvent) => {
    event?.stopPropagation();
    if (!confirm("このチャット履歴を削除しますか？\n削除後は復元できません。")) return;

    const wasActive = activeSessionId === sessionId;

    try {
      const res = await fetch(`/api/team/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete session");

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      if (wasActive) {
        // Don't call handleNewChat() to avoid session restoration
        // Just clear the current session
        setActiveSessionId(null);
        setMessages([]);
        setError(null);
        setHasLoadedMessages(true);
        setParticipants([...DEFAULT_PARTICIPANTS]);
        
        try {
          window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        } catch (error) {
          console.error("[Delete] Failed to clear localStorage:", error);
        }
        
        if (isMobile) {
          setIsSidebarOpen(false);
        }
      }
    } catch (err) {
      console.error("[Delete] Failed to delete session:", err);
      setError("削除に失敗しました。もう一度お試しください。");
      setTimeout(() => setError(null), 1000);
    }
  };

  const handleShare = async () => {
    if (!messages.length) return;
    const text = messages
      .map((m) => {
        if (m.role === "user") {
          return `あなた: ${m.content}`;
        } else {
          return `${m.author || "AI"}: ${m.content}`;
        }
      })
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setError("✓ 会話内容をコピーしました");
      setTimeout(() => setError(null), 1000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("コピーに失敗しました");
      setTimeout(() => setError(null), 1000);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (!hasPendingResponse) {
        handleSendMessage();
      }
    }
  };

  if (needsAuth || needsPremium) {
    const message = needsAuth
      ? { title: "ログインが必要です", body: "チームカウンセリングをご利用いただくにはログインしてください。" }
      : { title: "プレミアムプラン限定", body: "チームカウンセリングはプレミアムプランでご利用いただけます。" };

    return (
      <div className="relative w-full border-t border-slate-200" style={gradientStyle}>
        <div className="flex min-h-full items-center justify-center px-6">
          <div className="rounded-3xl border border-white/50 bg-white/95 px-10 py-12 text-center shadow-2xl">
            <p className="text-lg font-semibold text-slate-900">{message.title}</p>
            <p className="mt-4 text-sm text-slate-600">{message.body}</p>
          </div>
        </div>
      </div>
    );
  }


  const showGlobalLoader =
    !isMounted ||
    isRestoringSession ||
    (messages.length === 0 &&
      !hasLoadedMessages &&
      (isLoading.messages || (isLoading.sessions && sessions.length === 0)));

  if (showGlobalLoader) {
    return (
      <div className="relative w-full border-t border-slate-200" style={gradientStyle}>
        <div className="flex min-h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      </div>
    );
  }

  const messagePaddingBottom = messages.length === 0 ? 0 : Math.max(composerHeight + 16, 140);
  const showPromptSection = !isLoading.messages && !isRestoringSession && messages.length === 0;
  const showParticipantSelector = !activeSessionId && selectableParticipants.length > 0;

  const renderSidebarContent = (closeOnAction = false) => (
    <div className="flex flex-col gap-5">
      <div className="space-y-3">
        <Button
          className={newChatButtonClasses}
          onClick={() => {
            handleNewChat();
            if (closeOnAction) setIsSidebarOpen(false);
          }}
          disabled={isLoading.sending}
        >
          <Plus className="mr-2 h-4 w-4" /> 新しいチャット
        </Button>
        <Button
          variant="outline"
          className="w-full border border-slate-200 bg-white/80 text-slate-700"
          onClick={handleShare}
          disabled={!messages.length}
        >
          <Share2 className="mr-2 h-4 w-4" /> 会話をコピー
        </Button>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">セッション</p>
        <div className="mt-3 space-y-1">
          {showSessionSkeleton
            ? sessionSkeletonNodes
            : sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
                    session.id === activeSessionId
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-transparent bg-white text-slate-700 hover:border-slate-200",
                  )}
                >
                  <button
                    type="button"
                    className="flex-1 truncate text-left font-semibold"
                    onClick={() => {
                      setActiveSessionId(session.id);
                      if (closeOnAction) setIsSidebarOpen(false);
                    }}
                  >
                    {session.title || "チームカウンセリング"}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => handleDeleteSession(session.id, event)}
                    className="rounded-full p-1 text-xs text-current opacity-70 transition hover:bg-white/20 hover:opacity-100"
                    aria-label={`${session.title || "セッション"}を削除`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
          {!showSessionSkeleton && sessions.length === 0 && (
            <p className="text-xs text-slate-500">まだチームチャット履歴がありません。</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full border-t border-slate-200 text-slate-900" style={gradientStyle}>
      {isOffline && (
        <div className="pointer-events-auto absolute left-1/2 top-4 z-50 w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-semibold text-yellow-800 shadow-lg">
          オフラインです。接続を確認してください。
        </div>
      )}

      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="hidden w-80 flex-shrink-0 rounded-[30px] border border-white/30 bg-white/80 p-5 backdrop-blur md:flex">
          {renderSidebarContent(false)}
        </aside>

        <main className="flex flex-1 flex-col rounded-[32px] border border-white/40 bg-white/90 shadow-2xl">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
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
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">集合カウンセリング</p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">Team Counseling</h1>
                <p className="mt-1 text-sm text-slate-600">複数AIの異なる専門性で、あなたのテーマを多角的に整理します。</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Image
                src={TEAM_CHAT_LOGO_SRC}
                alt="Mental AI Team"
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain"
              />
            </div>
          </header>

          {showParticipantSelector && (
            <section className="border-b border-slate-100 px-6 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">参加AIを選択</p>
                  <p className="text-xs text-slate-500">準備中以外のAIはデフォルトで選択されています</p>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {participants.length} / {selectableParticipants.length}
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {selectableParticipants.map((participant) => {
                  const isSelected = participants.includes(participant.id);
                  return (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => toggleParticipant(participant.id)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition",
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="relative h-7 w-7 overflow-hidden rounded-xl border border-slate-100 bg-white">
                          <Image
                            src={participant.iconUrl || "/images/counselors/placeholder.png"}
                            alt={participant.name}
                            fill
                            className="object-contain"
                            sizes="28px"
                          />
                        </span>
                        {participant.name}
                      </span>
                      {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-500">参加AIが多いほど応答に時間がかかります。</p>
            </section>
          )}

          {showPromptSection && (
            <section className="border-b border-slate-100 px-6 py-4">
              <p className="text-sm font-semibold text-slate-900">すぐに話したいことを選べます</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PROMPT_PRESETS.map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading.sending}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </section>
          )}

          <div className="relative flex flex-1 flex-col overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 py-6"
              style={{ paddingBottom: `${messagePaddingBottom}px` }}
            >
              <div className="mx-auto w-full max-w-3xl space-y-5">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <p className="text-base font-semibold text-slate-900">まだ会話はありません</p>
                    <p className="text-sm text-slate-500">感じていることを一言で送ってみてください。複数のAIが順番に応答します。</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    if (message.role === "user") {
                      return (
                        <div key={message.id} className="flex justify-end">
                          <div className="max-w-[80%] rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-sm text-white shadow">
                            <div className="mb-1 flex items-center gap-2 text-xs opacity-70">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              あなた
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                        </div>
                      );
                    }

                    const authorId = message.authorId ?? "moderator";
                    const participantColors = COLOR_MAP[authorId] ?? COLOR_MAP.moderator;

                    return (
                      <div key={message.id} className="flex gap-3">
                        <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white bg-white shadow">
                          <Image
                            src={message.iconUrl || participantLookup.get(authorId)?.iconUrl || "/images/counselors/placeholder.png"}
                            alt={message.author || "AI"}
                            fill
                            className="object-contain"
                            sizes="44px"
                          />
                        </div>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-3xl border px-4 py-3 text-sm leading-relaxed shadow",
                            participantColors.bubble,
                            participantColors.border,
                            participantColors.text,
                          )}
                        >
                          <div className="mb-1 text-xs font-semibold opacity-80">{message.author || "AI"}</div>
                          <p className="whitespace-pre-wrap">
                            {message.pending ? thinkingMessages[currentThinkingIndex] : message.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {isLoading.sending && (
                  <div className="flex flex-col items-center gap-2 rounded-3xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="h-4 w-4 animate-spin" /> チームで応答中...
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{loadingSeconds}秒</div>
                    <p className="text-xs text-slate-500">参加AIが多いほど応答に時間がかかります</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          <div
            ref={composerRef}
            className="border-t border-slate-100 bg-white px-4 py-3"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {error && (
              <div className="pointer-events-none absolute inset-x-6 top-4 z-10 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-center text-sm text-slate-700 shadow">
                {error}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="悩みや状況を入力してください"
                className="min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border-2 border-[#dbeafe] bg-[#f6f8ff] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 transition focus:border-[#c7d2fe] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#c7d2fe] focus:ring-offset-0"
                rows={1}
                autoComplete="off"
                autoCorrect="off"
                enterKeyHint="send"
                onFocus={scrollIntoViewOnFocus}
              />
              <Button
                onClick={() => {
                  void handleSendMessage();
                }}
                disabled={!input.trim() || isLoading.sending || hasPendingResponse}
                className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white"
                style={{ backgroundColor: "#0f172a", color: "#ffffff" }}
              >
                {isLoading.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur" onClick={() => setIsSidebarOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-white/40 bg-white p-6"
            style={{ maxHeight: "80vh" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">セッション</p>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-full border border-slate-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto" style={{ maxHeight: "65vh" }}>
              {renderSidebarContent(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamChatClient;
