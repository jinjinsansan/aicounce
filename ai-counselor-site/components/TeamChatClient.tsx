"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { CheckSquare, Square, Loader2, Menu, MessageSquare, Plus, Send, Share2, Trash2, User, X } from "lucide-react";
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
const DEFAULT_PARTICIPANTS = ["michele", "sato"];

const COLOR_MAP: Record<string, { bubble: string; text: string; border: string }> = {
  michele: { bubble: "bg-[#fff3f8]", text: "text-[#7b364d]", border: "border-[#ffd4e3]" },
  sato: { bubble: "bg-[#eef4ff]", text: "text-[#1d3a8a]", border: "border-[#d7e9ff]" },
  adam: { bubble: "bg-[#f3fff7]", text: "text-[#065f46]", border: "border-[#c1f5dc]" },
  gemini: { bubble: "bg-[#f9efff]", text: "text-[#6b21a8]", border: "border-[#ead8ff]" },
  claude: { bubble: "bg-[#f8fafc]", text: "text-[#1f2937]", border: "border-[#e2e8f0]" },
  deep: { bubble: "bg-[#ecfeff]", text: "text-[#0f766e]", border: "border-[#c5f6f2]" },
  nazare: { bubble: "bg-[#ede9fe]", text: "text-[#5b21b6]", border: "border-[#d8b4fe]" },
  siddhartha: { bubble: "bg-[#fffbeb]", text: "text-[#92400e]", border: "border-[#fef3c7]" },
  moderator: { bubble: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};

const thinkingMessages = [
  "チームで議論しています...",
  "複数の視点から考えています...",
  "それぞれの専門性で分析しています...",
];

const THINKING_MESSAGE_INTERVAL_MS = 1400;

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

  const activeParticipantDetails = useMemo(() => {
    const details: (typeof FALLBACK_COUNSELORS)[number][] = [];
    const seen = new Set<string>();
    participants.forEach((id) => {
      if (seen.has(id)) return;
      const counselor = participantLookup.get(id);
      if (counselor) {
        details.push(counselor);
        seen.add(id);
      }
    });
    return details;
  }, [participants, participantLookup]);

  const hasPendingResponse = useMemo(() => messages.some((msg) => msg.pending), [messages]);

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
    if (activeSessionId && hasRestoredSessionRef.current) {
      setHasLoadedMessages(false);
      loadMessages(activeSessionId);
    }
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

    setInput("");
    setError(null);
    const tempUserId = `temp-user-${Date.now()}`;
    const tempAiId = `temp-ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: textToSend, created_at: new Date().toISOString() },
      { id: tempAiId, role: "assistant", content: thinkingMessages[0], pending: true, created_at: new Date().toISOString() },
    ]);

    setIsLoading((prev) => ({ ...prev, sending: true }));
    abortRef.current = new AbortController();

    let hasError = false;

    try {
      const res = await fetch("/api/team/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId || undefined,
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

  if (needsAuth) {
    return (
      <div
        className="flex min-h-[calc(100vh-4rem)] items-center justify-center border-t border-slate-200"
        style={{
          backgroundImage:
            "linear-gradient(145deg, rgba(255,247,237,0.95), rgba(255,237,213,0.95), rgba(255,228,230,0.95), rgba(221,231,254,0.95), rgba(226,232,255,0.95))",
        }}
      >
        <div className="rounded-3xl border border-slate-200 bg-white px-10 py-12 text-center shadow-lg">
          <p className="text-lg font-semibold text-slate-900">ログインが必要です</p>
          <p className="mt-4 text-sm text-slate-600">チームカウンセリングをご利用いただくにはログインしてください。</p>
        </div>
      </div>
    );
  }

  if (needsPremium) {
    return (
      <div
        className="flex min-h-[calc(100vh-4rem)] items-center justify-center border-t border-slate-200"
        style={{
          backgroundImage:
            "linear-gradient(145deg, rgba(255,247,237,0.95), rgba(255,237,213,0.95), rgba(255,228,230,0.95), rgba(221,231,254,0.95), rgba(226,232,255,0.95))",
        }}
      >
        <div className="rounded-3xl border border-slate-200 bg-white px-10 py-12 text-center shadow-lg">
          <p className="text-lg font-semibold text-slate-900">プレミアムプラン限定</p>
          <p className="mt-4 text-sm text-slate-600">チームカウンセリングはプレミアムプランでご利用いただけます。</p>
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
      <div
        className="flex min-h-[calc(100vh-4rem)] items-center justify-center border-t border-slate-200"
        style={{
          backgroundImage:
            "linear-gradient(145deg, rgba(255,247,237,0.95), rgba(255,237,213,0.95), rgba(255,228,230,0.95), rgba(221,231,254,0.95), rgba(226,232,255,0.95))",
        }}
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  const messagePaddingBottom = messages.length === 0 ? 0 : Math.max(composerHeight + 16, 128);
  const newChatButtonClasses =
    "w-full justify-center gap-2 rounded-3xl border border-transparent bg-gradient-to-r from-[#ec4899] via-[#a855f7] to-[#0ea5e9] px-5 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/30 transition-all focus:ring-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-200 hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div
      className="relative flex w-full flex-1 items-stretch border-t border-slate-200 text-slate-900"
      style={{
        minHeight: "calc(100vh - 4rem)",
        height: "calc(100vh - 4rem)",
        maxHeight: "calc(100vh - 4rem)",
        backgroundImage:
          "linear-gradient(145deg, rgba(255,247,237,0.95), rgba(255,237,213,0.95), rgba(255,228,230,0.95), rgba(221,231,254,0.95), rgba(226,232,255,0.95))",
      }}
    >
      {isOffline && (
        <div className="pointer-events-auto absolute left-1/2 top-4 z-50 w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-semibold text-yellow-800 shadow-lg">
          オフラインです。接続を確認してください。
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className="hidden w-[280px] min-w-[280px] flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-sm md:flex md:sticky md:top-16 md:self-start md:overflow-y-auto"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <Button
          variant="default"
          onClick={handleNewChat}
          disabled={isLoading.sending}
          className={cn("mb-6 border border-transparent", newChatButtonClasses)}
        >
          <Plus className="h-4 w-4" /> 新しいチャット
        </Button>

        {/* Participant Selection in Sidebar */}
        <details className="mb-4 rounded-2xl border border-slate-200 bg-slate-50" open>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 rounded-2xl transition">
            参加AI ({participants.length}名選択中)
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-2 max-h-[240px] overflow-y-auto">
            {availableParticipants.map((p) => {
              const checked = participants.includes(p.id);
              const isDisabled = Boolean(p.comingSoon);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    toggleParticipant(p.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition text-sm",
                    isDisabled
                      ? "cursor-not-allowed bg-slate-100 opacity-50 border-slate-200"
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  )}
                >
                  {checked ? (
                    <CheckSquare className="h-4 w-4 text-slate-700 flex-shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate text-slate-900">{p.name}</span>
                  {isDisabled && <span className="text-xs text-slate-500">準備中</span>}
                </button>
              );
            })}
          </div>
        </details>

        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">履歴</p>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-center text-xs text-slate-400">履歴がありません</p>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setActiveSessionId(session.id)}
                className={cn(
                  "group mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                  session.id === activeSessionId
                    ? "border-slate-300 bg-slate-50 text-slate-900"
                    : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{session.title || "チームカウンセリング"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => handleDeleteSession(session.id, event)}
                  className="rounded-full p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-slate-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative ml-auto flex h-full w-[80%] max-w-[300px] flex-col border-l border-slate-200 bg-white px-4 py-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">メニュー</span>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Button
              variant="default"
              onClick={handleNewChat}
              disabled={isLoading.sending}
              className={cn("mb-4 border border-transparent", newChatButtonClasses)}
            >
              <Plus className="h-4 w-4" /> 新しいチャット
            </Button>

            {/* Participant Selection in Mobile Sidebar */}
            <details className="mb-3 rounded-2xl border border-slate-200 bg-slate-50" open>
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 rounded-2xl transition">
                参加AI ({participants.length}名)
              </summary>
              <div className="px-3 pb-3 pt-2 space-y-2 max-h-[200px] overflow-y-auto">
                {availableParticipants.map((p) => {
                  const checked = participants.includes(p.id);
                  const isDisabled = Boolean(p.comingSoon);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        toggleParticipant(p.id);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition text-sm",
                        isDisabled
                          ? "cursor-not-allowed bg-slate-100 opacity-50 border-slate-200"
                          : "bg-white border-slate-200"
                      )}
                    >
                      {checked ? (
                        <CheckSquare className="h-4 w-4 text-slate-700 flex-shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="flex-1 truncate text-slate-900">{p.name}</span>
                      {isDisabled && <span className="text-xs text-slate-500">準備中</span>}
                    </button>
                  );
                })}
              </div>
            </details>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">履歴</p>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-center text-xs text-slate-400">履歴がありません</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "group mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                      session.id === activeSessionId
                        ? "border-slate-300 bg-slate-50 text-slate-900"
                        : "border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{session.title || "チームカウンセリング"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => handleDeleteSession(session.id, event)}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">チームカウンセリング</h1>
              <p className="text-xs text-slate-500">{participants.length}名のAIがディスカッション中</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" className="text-slate-700" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" /> 共有
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2" />
        </header>

        {activeParticipantDetails.length > 0 && (
          <section className="border-b border-slate-100 bg-slate-50/70 px-6 py-3">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {activeParticipantDetails.map((participant) => {
                const color = COLOR_MAP[participant.id] ?? COLOR_MAP.moderator;
                return (
                  <div
                    key={participant.id}
                    className={cn(
                      "flex min-w-[220px] items-center gap-3 rounded-2xl border bg-white/90 px-3 py-2 shadow-sm",
                      color.border,
                    )}
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white shadow">
                      <Image src={participant.iconUrl ?? "/images/counselors/michelle.png"} alt={participant.name} fill sizes="40px" className="object-contain" />
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 px-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                        AI
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{participant.name}</p>
                      <p className="text-xs text-slate-500">{participant.specialty ?? "AIカウンセラー"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Messages Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6"
          style={{ paddingBottom: `${messagePaddingBottom}px` }}
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-12 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                <MessageSquare className="h-12 w-12 text-slate-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">複数のAIで深く対話</h2>
                <p className="mt-2 text-slate-600">
                  異なる専門性を持つAIカウンセラーが協力してサポートします
                </p>
              </div>

              {/* Participant Selection */}
              <div className="w-full">
                <p className="mb-4 text-sm font-semibold text-slate-700">参加AIを選択 (1人以上)</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableParticipants.map((p) => {
                    const checked = participants.includes(p.id);
                    const isDisabled = Boolean(p.comingSoon);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleParticipant(p.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                          isDisabled
                            ? "cursor-not-allowed bg-slate-50 opacity-60"
                            : checked
                            ? "border-slate-400 bg-slate-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        )}
                      >
                        {checked ? (
                          <CheckSquare className="h-4 w-4 text-slate-700 flex-shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate text-slate-900">{p.name}</span>
                        {isDisabled && <span className="text-xs text-slate-500">準備中</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Prompts */}
              <div className="w-full">
                <p className="mb-4 text-sm font-semibold text-slate-700">こんな時に使えます</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "複数の視点から意見がほしい",
                    "いろんな角度で考えたい",
                    "多様なアドバイスを聞きたい",
                    "チームで議論してほしい",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isLoading.sending || participants.length === 0}
                      className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-center text-sm text-slate-900 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m) => {
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="flex justify-end gap-3">
                      <div className="max-w-[80%] rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-sm">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                      </div>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 shadow">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  );
                }

                // AI message
                const color = COLOR_MAP[m.authorId || "moderator"] || COLOR_MAP.moderator;
                return (
                  <div key={m.id} className="flex justify-start gap-3">
                    {m.iconUrl && (
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white shadow">
                        <Image
                          src={m.iconUrl}
                          alt={m.author || "AI"}
                          fill
                          sizes="48px"
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className={cn("max-w-[80%] rounded-2xl border px-5 py-3 shadow-sm", color.bubble, color.border)}>
                      {m.author && (
                        <div className="mb-2">
                          <span className={cn("text-xs font-semibold", color.text)}>{m.author}</span>
                        </div>
                      )}
                      <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", color.text)}>
                        {m.pending ? thinkingMessages[currentThinkingIndex] : m.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isLoading.sending && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" /> チームで応答中...
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {loadingSeconds}秒
                  </div>
                  <p className="text-xs text-slate-500">
                    参加AIが多いほど応答に時間がかかります
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          ref={composerRef}
          className="border-t border-slate-200 bg-white px-6 py-4"
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}
          <div className="flex items-end gap-3 rounded-3xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={scrollIntoViewOnFocus}
              placeholder="チームに相談する..."
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              disabled={isLoading.sending}
              className="max-h-40 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 md:text-sm"
              rows={1}
            />
            <button
              type="button"
              onClick={() => {
                void handleSendMessage();
              }}
              disabled={isLoading.sending || !input.trim() || hasPendingResponse}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">チームカウンセリングAIは誤った情報を生成する場合があります。</p>
        </div>
      </main>
    </div>
  );
}

export default TeamChatClient;
