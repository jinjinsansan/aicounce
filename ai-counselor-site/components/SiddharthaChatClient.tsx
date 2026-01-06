"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Loader2, Menu, MessageSquare, Plus, Send, Share2, Trash2, User, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { debugLog } from "@/lib/logger";
import { cn } from "@/lib/utils";

type GuidedAction = "back" | "deeper" | "next";
type GuidedPhase = "explore" | "deepen" | "release";

type SessionSummary = {
  id: string;
  title: string | null;
  category: string;
  updated_at: string;
};

type MessageItem = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  pending?: boolean;
};

type MessagesResponse = {
  session: Pick<SessionSummary, "id" | "title" | "category">;
  messages: MessageItem[];
};

type SessionsResponse = {
  sessions: SessionSummary[];
};

const ACTIVE_SESSION_STORAGE_KEY = "siddhartha-buddhism-active-session-id";

const initialPrompts = [
  "心が落ち着かない...",
  "人間関係に疲れている",
  "執着から離れたい",
  "苦しみの原因を知りたい",
];

const thinkingMessages = [
  "経典の智慧を探しています...",
  "慈悲の心で受け止めています...",
  "中道を照らしています...",
  "仏の教えに耳を傾けています...",
];

const THINKING_MESSAGE_INTERVAL_MS = 1400;

const GUIDED_ACTION_PRESETS: Record<GuidedAction, { prompt: string; success: string }> = {
  back: {
    prompt: "今の教えをもう一度、別の視点から説いてください。より深く理解したいです。",
    success: "✓ 教えを振り返ります",
  },
  deeper: {
    prompt:
      "この苦しみの根源をさらに掘り下げたいです。執着や煩悩の本質まで一緒に観察してください。",
    success: "✓ 苦の根源を探ります",
  },
  next: {
    prompt: "この教えを受け止めました。次の実践や日常で活かせる智慧を教えてください。",
    success: "✓ 実践の道へ進みます",
  },
};

const GUIDED_PHASE_LABELS: Record<GuidedPhase, string> = {
  explore: "苦の観察",
  deepen: "根源の理解",
  release: "解放と実践",
};

export function SiddharthaChatClient() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState({ sessions: false, messages: false, sending: false });
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentThinkingIndex, setCurrentThinkingIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [hasInitializedSessions, setHasInitializedSessions] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
  const [phaseInsight, setPhaseInsight] = useState<{ phase: GuidedPhase; summary: string } | null>(null);
  const [isPhaseInsightLoading, setIsPhaseInsightLoading] = useState(false);
  const [guidedActionLoading, setGuidedActionLoading] = useState<null | GuidedAction>(null);
  const [isOffline, setIsOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const scrollFrameRef = useRef<number | undefined>(undefined);
  const [composerHeight, setComposerHeight] = useState(0);
  const hasRestoredSessionRef = useRef(false);
  const lastRequestTimeRef = useRef<number>(0);

  const activeSession = useMemo(() => sessions.find((session) => session.id === activeSessionId) ?? null, [
    sessions,
    activeSessionId,
  ]);
  const hasPendingResponse = useMemo(() => messages.some((msg) => msg.pending), [messages]);

  const loadSessions = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, sessions: true }));
    try {
      const res = await fetch("/api/siddhartha/sessions");
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = (await res.json()) as SessionsResponse;
      setSessions(data.sessions ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading((prev) => ({ ...prev, sessions: false }));
      setHasInitializedSessions(true);
    }
  }, []);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      debugLog("[loadMessages] Starting to load messages for session:", sessionId);
      setIsLoading((prev) => ({ ...prev, messages: true }));
      try {
        const res = await fetch(`/api/siddhartha/sessions/${sessionId}/messages`);
        debugLog("[loadMessages] Response status:", res.status);

        if (res.status === 401) {
          debugLog("[loadMessages] Unauthorized - setting needsAuth");
          setNeedsAuth(true);
          setHasLoadedMessages(true);
          return;
        }
        if (res.status === 404) {
          debugLog("[loadMessages] Session not found - clearing activeSessionId");
          setActiveSessionId(null);
          setHasLoadedMessages(true);
          return;
        }
        if (!res.ok) throw new Error("Failed to load messages");

        const data = (await res.json()) as MessagesResponse;
        debugLog("[loadMessages] Received data:", {
          sessionId: data.session?.id,
          messagesCount: data.messages?.length ?? 0,
          firstMessage: data.messages?.[0]?.content?.substring(0, 50),
        });

        setMessages(data.messages ?? []);
        setHasLoadedMessages(true);
        debugLog("[loadMessages] Messages state updated with", data.messages?.length ?? 0, "messages");
      } catch (err) {
        console.error("[loadMessages] Error loading messages:", err);
      } finally {
        setIsLoading((prev) => ({ ...prev, messages: false }));
        debugLog("[loadMessages] Loading complete");
      }
    },
    [],
  );

  useEffect(() => {
    debugLog("[Mount] Component mounted");
    setIsMounted(true);
    setIsMobile(window.innerWidth < 768);

    if (window.innerWidth < 768 && textareaRef.current) {
      textareaRef.current.blur();
      debugLog("[Mount] Mobile: textarea blur applied to prevent unwanted keyboard");
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  useEffect(() => {
    debugLog(
      "[Session Restore] Effect triggered - isMounted:",
      isMounted,
      "hasRestored:",
      hasRestoredSessionRef.current,
      "sessions.length:",
      sessions.length,
      "initialized:",
      hasInitializedSessions,
    );

    if (!isMounted) {
      debugLog("[Session Restore] Skipped - not mounted yet");
      return;
    }
    if (hasRestoredSessionRef.current) {
      debugLog("[Session Restore] Skipped - already restored");
      return;
    }
    if (!hasInitializedSessions) {
      debugLog("[Session Restore] Skipped - sessions not initialized yet");
      return;
    }
    if (sessions.length === 0) {
      debugLog("[Session Restore] No sessions available - finishing restore state");
      hasRestoredSessionRef.current = true;
      setIsRestoringSession(false);
      return;
    }

    try {
      const storedSessionId = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      debugLog("[Session Restore] Stored ID:", storedSessionId, "Sessions count:", sessions.length);

      if (storedSessionId) {
        const exists = sessions.some((s) => s.id === storedSessionId);
        debugLog("[Session Restore] Session exists:", exists);

        if (exists) {
          debugLog("[Session Restore] Restoring session:", storedSessionId);
          setActiveSessionId(storedSessionId);
        } else {
          debugLog("[Session Restore] Session not found in sessions array");
        }
      } else {
        debugLog("[Session Restore] No stored session ID found");
      }
    } catch (error) {
      console.error("[Session Restore] Failed to restore session:", error);
    }

    hasRestoredSessionRef.current = true;
    setIsRestoringSession(false);
    debugLog("[Session Restore] Flag set to true, restoration complete");
  }, [isMounted, sessions, hasInitializedSessions]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  useEffect(() => {
    debugLog("[Save Session] Effect triggered - isMounted:", isMounted, "activeSessionId:", activeSessionId);

    if (!isMounted) {
      debugLog("[Save Session] Skipped - not mounted yet");
      return;
    }

    if (!activeSessionId) {
      debugLog("[Save Session] Skipped - activeSessionId is null (keeping existing localStorage)");
      return;
    }

    try {
      debugLog("[Save Session] Saving to localStorage:", activeSessionId);
      window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeSessionId);
      debugLog("[Save Session] Saved successfully");
    } catch (error) {
      console.error("[Save Session] Failed to save session:", error);
    }
  }, [isMounted, activeSessionId]);

  useEffect(() => {
    if (!composerRef.current) return;

    const updateHeight = () => {
      if (composerRef.current) {
        setComposerHeight(composerRef.current.offsetHeight);
      }
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      const interval = window.setInterval(updateHeight, 500);
      return () => window.clearInterval(interval);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(composerRef.current);

    return () => observer.disconnect();
  }, []);

  const scheduleScrollToBottom = useCallback(() => {
    if (!autoScrollRef.current) return;
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
      autoScrollRef.current = distanceFromBottom < 120;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (isLoading.sending) return;

    debugLog("[Load Messages] activeSessionId:", activeSessionId);

    if (activeSessionId) {
      setHasLoadedMessages(false);
      debugLog("[Load Messages] Loading messages for:", activeSessionId);
      loadMessages(activeSessionId);
    } else {
      debugLog("[Load Messages] Clearing messages (no active session)");
      setMessages([]);
      setHasLoadedMessages(true);
    }
  }, [activeSessionId, isLoading.sending, loadMessages]);

  useLayoutEffect(() => {
    if (messages.length === 0) return;
    scheduleScrollToBottom();
  }, [messages.length, scheduleScrollToBottom]);

  useEffect(() => {
    if (!hasPendingResponse) return;
    const interval = setInterval(() => {
      setCurrentThinkingIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, THINKING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasPendingResponse]);

  const handlePhaseInsightRequest = async () => {
    if (!activeSessionId || messages.length < 4) {
      setError("会話が十分ではありません");
      setTimeout(() => setError(null), 2000);
      return;
    }

    setIsPhaseInsightLoading(true);
    try {
      const res = await fetch("/api/siddhartha/phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId }),
      });

      if (res.status === 401) {
        setError("ログインが必要です");
        setTimeout(() => setError(null), 2000);
        return;
      }

      if (!res.ok) {
        let serverMessage = "フェーズ診断に失敗しました";
        try {
          const errorBody = (await res.json()) as { error?: string };
          if (errorBody?.error) {
            serverMessage = errorBody.error;
          }
        } catch {}
        throw new Error(serverMessage);
      }

      const data = (await res.json()) as { phase?: string; summary?: string };
      const allowedPhases: GuidedPhase[] = ["explore", "deepen", "release"];
      const normalized = (data.phase ?? "explore").toLowerCase() as GuidedPhase;
      const nextPhase = allowedPhases.includes(normalized) ? normalized : "explore";

      setPhaseInsight({
        phase: nextPhase,
        summary: data.summary?.trim() || `現在は${GUIDED_PHASE_LABELS[nextPhase]}にいます。`,
      });
    } catch (phaseError) {
      const message = phaseError instanceof Error ? phaseError.message : "フェーズ診断に失敗しました";
      setError(message);
      setTimeout(() => setError(null), 2000);
    } finally {
      setIsPhaseInsightLoading(false);
    }
  };

  const handleGuidedAction = async (action: GuidedAction) => {
    if (isLoading.sending || guidedActionLoading) {
      return;
    }

    const preset = GUIDED_ACTION_PRESETS[action];
    setGuidedActionLoading(action);

    try {
      setError(preset.success);
      setTimeout(() => setError(null), 2000);

      await handleSendMessage(preset.prompt);
    } catch (actionError) {
      console.error("Guided action error", actionError);
      setError("操作に失敗しました");
      setTimeout(() => setError(null), 2000);
    } finally {
      setGuidedActionLoading(null);
    }
  };

  const handleNewChat = () => {
    debugLog("[User Action] New chat clicked - clearing session");
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setHasLoadedMessages(true);
    setPhaseInsight(null);
    hasRestoredSessionRef.current = false;

    try {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      debugLog("[User Action] localStorage cleared for new chat");
    } catch (error) {
      console.error("[User Action] Failed to clear localStorage:", error);
    }

    if (!isMobile) {
      textareaRef.current?.focus();
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText ? overrideText.trim() : input.trim();

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const MIN_REQUEST_INTERVAL = 3000;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && lastRequestTimeRef.current > 0) {
      const remainingTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
      setError(`${remainingTime}秒お待ちください...`);
      setTimeout(() => setError(null), 1000);
      return;
    }

    if (!textToSend || isLoading.sending) {
      return;
    }

    if (hasPendingResponse) {
      debugLog("[Send] Blocked - AI is still responding");
      setError("前の応答を待っています...");
      setTimeout(() => setError(null), 1000);
      return;
    }

    lastRequestTimeRef.current = now;

    if (!overrideText) {
      setInput("");
    }
    setError(null);

    if (isMobile && textareaRef.current) {
      textareaRef.current.blur();
    }

    const tempUserId = `user-${Date.now()}`;
    const tempAiId = `ai-${Date.now()}`;
    const timestamp = new Date().toISOString();

    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: textToSend, created_at: timestamp },
      { id: tempAiId, role: "assistant", content: "", created_at: timestamp, pending: true },
    ]);

    setIsLoading((prev) => ({ ...prev, sending: true }));

    let hasError = false;

    try {
      const res = await fetch("/api/siddhartha/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId ?? undefined,
          message: textToSend,
          category: !activeSessionId ? "life" : undefined,
        }),
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

      const data = (await res.json()) as { sessionId: string; message: string };
      const aiContent = data.message;

      if (data.sessionId && !activeSessionId) {
        setActiveSessionId(data.sessionId);
        loadSessions();
      }

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempAiId ? { ...msg, content: aiContent, pending: false } : msg)),
      );

      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId);
      }
    } catch (err) {
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
      } else {
        setTimeout(() => {
          setIsLoading((prev) => ({ ...prev, sending: false }));
        }, 100);
      }
    }
  };

  const handleDeleteSession = async (sessionId: string, event?: MouseEvent) => {
    event?.stopPropagation();
    if (!confirm("このチャット履歴を削除しますか？\n削除後は復元できません。")) return;

    const wasActive = activeSessionId === sessionId;

    try {
      const res = await fetch(`/api/siddhartha/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete session");

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      if (wasActive) {
        handleNewChat();
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
      .map((m) => `${m.role === "user" ? "あなた" : "ミシェル心理学"}: ${m.content}`)
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

  const cleanContent = (content: string) => {
    let cleaned = content.replace(/【\d+:\d+†.*?】/g, "");
    cleaned = cleaned.replace(/【参考[：:][^】]*】/g, "");
    return cleaned;
  };

  const handleRetryLoad = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }
    loadSessions();
    if (activeSessionId) {
      setHasLoadedMessages(false);
      loadMessages(activeSessionId);
    }
  }, [activeSessionId, loadMessages, loadSessions]);

  if (needsAuth) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-[#fff4f7] via-[#ffe9f1] to-[#ffdfe8]">
        <div className="rounded-3xl bg-white px-10 py-12 text-center shadow-2xl">
          <p className="text-lg font-semibold text-[#92400e]">ログインが必要です</p>
          <p className="mt-4 text-sm text-[#b1637d]">テープ式心理学AIをご利用いただくにはログインしてください。</p>
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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-[#fff7fa] via-[#ffeef5] to-[#ffe3ec]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#f472b6]" />
        </div>
      </div>
    );
  }

  const messagePaddingBottom = messages.length === 0 ? 0 : Math.max(composerHeight + 16, 128);
  const showSessionSkeleton = isLoading.sessions && sessions.length === 0;
  const showMessagesSkeleton = isLoading.messages && activeSessionId && messages.length === 0;
  const sessionSkeletonNodes = Array.from({ length: 4 }).map((_, idx) => (
    <div key={`session-skeleton-${idx}`} className="mb-2 h-12 animate-pulse rounded-2xl bg-[#ffeaf3]" />
  ));
  const messageSkeletonNodes = (
    <div className="mx-auto max-w-3xl space-y-4" style={{ paddingBottom: `${messagePaddingBottom}px` }}>
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={`message-skeleton-${idx}`} className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-[#ffd4e3]/60" />
          <div className="h-20 flex-1 rounded-2xl bg-white/70 shadow-inner animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="relative flex w-full flex-1 items-stretch bg-gradient-to-br from-[#fff4f7] via-[#ffe9f1] to-[#ffdfe8] text-[#7b364d]"
      style={{
        minHeight: "calc(100vh - 4rem)",
        height: "calc(100vh - 4rem)",
        maxHeight: "calc(100vh - 4rem)",
      }}
    >
      {isOffline && (
        <div className="pointer-events-auto absolute left-1/2 top-4 z-50 w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-semibold text-yellow-800 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <span>オフラインです。接続が戻り次第自動で再同期します。</span>
            <Button variant="ghost" size="sm" className="text-yellow-800" onClick={handleRetryLoad}>
              再読み込み
            </Button>
          </div>
        </div>
      )}
      <aside
        className="hidden w-[260px] min-w-[260px] flex-col border-r border-[#ffd4e3] bg-white/90 px-4 py-6 shadow-sm md:flex md:sticky md:top-16 md:self-start md:overflow-y-auto"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <Button
          variant="ghost"
          onClick={handleNewChat}
          disabled={isLoading.sending}
          className="mb-6 w-full justify-center gap-2 rounded-2xl border border-black/15 bg-white text-[#92400e] font-semibold shadow-sm transition hover:bg-[#fff5f9]"
        >
          <Plus className="h-4 w-4" /> 新しいチャット
        </Button>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#f472b6]">チャット</p>
        <div className="flex-1 overflow-y-auto">
          {showSessionSkeleton ? (
            <div>{sessionSkeletonNodes}</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  debugLog("[User Action] Desktop: Clicked on session:", session.id);
                  setActiveSessionId(session.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveSessionId(session.id);
                  }
                }}
                className={cn(
                  "group mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                  session.id === activeSessionId
                    ? "border-[#ffc0d9] bg-[#fff0f7] text-[#8b2e52]"
                    : "border-transparent bg-transparent text-[#b1637d] hover:border-[#ffd4e3] hover:bg-[#fff8fb]",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <div className="min-w-0">
                    <span className="block truncate">{session.title || "新しいチャット"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => handleDeleteSession(session.id, event)}
                  className="rounded-full p-1 text-[#e091b3] opacity-0 transition group-hover:opacity-100 hover:bg-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
          {sessions.length === 0 && !isLoading.sessions && (
            <p className="text-center text-xs text-[#d494ab]">まだチャット履歴がありません。</p>
          )}
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative ml-auto flex h-full w-[80%] max-w-[300px] flex-col border-l border-[#ffd4e3] bg-white/95 px-4 py-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#92400e]">履歴</span>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
        <Button
          variant="ghost"
          onClick={() => {
            handleNewChat();
            setIsSidebarOpen(false);
          }}
          disabled={isLoading.sending}
          className="mb-4 w-full justify-center gap-2 rounded-2xl border border-black/15 bg-white text-[#92400e] font-semibold shadow-sm transition hover:bg-[#fff5f9]"
        >
              <Plus className="h-4 w-4" /> 新しいチャット
            </Button>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#f472b6]">チャット</p>
            <div className="flex-1 overflow-y-auto">
              {showSessionSkeleton ? (
                <div>{sessionSkeletonNodes}</div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      debugLog("[User Action] Mobile: Clicked on session:", session.id);
                      setActiveSessionId(session.id);
                      setIsSidebarOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveSessionId(session.id);
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "group mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                      session.id === activeSessionId
                        ? "border-[#ffc0d9] bg-[#fff0f7] text-[#8b2e52]"
                        : "border-transparent bg-transparent text-[#b1637d] hover:border-[#ffd4e3] hover:bg-[#fff8fb]",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <div className="min-w-0">
                        <span className="block truncate">{session.title || "新しいチャット"}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => handleDeleteSession(session.id, event)}
                      className="rounded-full p-1 text-[#e091b3] transition hover:bg-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
              {sessions.length === 0 && !isLoading.sessions && (
                <p className="text-center text-xs text-[#d494ab]">まだチャット履歴がありません。</p>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white/75 touch-auto overscroll-none">
        <header className="flex items-center justify-between border-b border-[#ffd7e8] px-4 py-3 text-sm text-[#b1637d]">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-[#ffd4e3] bg-white text-[#f472b6] hover:bg-[#fff8fb] md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-[#92400e]">{activeSession?.title || "テープ式心理学AI"}</span>
            {isLoading.messages && messages.length === 0 && <Loader2 className="h-4 w-4 animate-spin text-[#e091b3]" />}
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="text-[#b1637d]" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" /> 共有
            </Button>
          )}
        </header>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-[#fff4f7] to-[#ffeef5]" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="px-4 pt-4">
            {showMessagesSkeleton ? (
              messageSkeletonNodes
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-4">
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-white shadow-lg">
                  <Image src="/images/counselors/michelle.png" alt="Michelle" fill className="object-contain" sizes="128px" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#92400e]">こんにちは、ミシェルです</h2>
                    <p className="mt-2 text-sm text-[#b1637d]">心のモヤモヤ、誰にも言えない悩み、なんでも話してください。</p>
                    <p className="mt-1 text-sm text-[#b1637d]">私はあなたの親となって、一緒に答えを探します。</p>
                  </div>
                </div>

                <div className="grid w-full max-w-xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
                  {initialPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isLoading.sending}
                      className="rounded-xl border border-[#ffd4e3] bg-white px-6 py-4 text-center text-sm text-[#7b364d] shadow-sm transition-all hover:bg-[#fff8fb] hover:shadow-md disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6" style={{ paddingBottom: `${messagePaddingBottom}px` }}>
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white shadow">
                          <Image src="/images/counselors/michelle.png" alt="Michelle" fill className="object-contain" sizes="48px" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                          message.role === "user"
                            ? "bg-[#f59e0b] text-white"
                            : "bg-white border border-[#ffd4e3] text-[#7b364d]",
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.pending ? "" : cleanContent(message.content)}
                        </p>
                        {message.pending && (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#f472b6] [animation-delay:-0.3s]" />
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#f472b6] [animation-delay:-0.15s]" />
                              <div className="h-2 w-2 animate-bounce rounded-full bg-[#f472b6]" />
                            </div>
                            <p className="text-xs text-[#c07b8f]">{thinkingMessages[currentThinkingIndex]}</p>
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#92400e] shadow">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>

                    {message.role === "assistant" && !message.pending && activeSessionId && messages.length >= 4 && (
                      <div className="ml-[52px] mt-1.5 flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] text-[#92400e] hover:bg-[#fff0f7]"
                          onClick={() => handleGuidedAction("back")}
                          disabled={guidedActionLoading !== null || isLoading.sending}
                        >
                          {guidedActionLoading === "back" ? "整理中..." : "◀ 前のテーマ"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] text-[#92400e] hover:bg-[#fff0f7]"
                          onClick={() => handleGuidedAction("deeper")}
                          disabled={guidedActionLoading !== null || isLoading.sending}
                        >
                          {guidedActionLoading === "deeper" ? "準備中..." : "◎ 深掘り"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] text-[#92400e] hover:bg-[#fff0f7]"
                          onClick={() => handleGuidedAction("next")}
                          disabled={guidedActionLoading !== null || isLoading.sending}
                        >
                          {guidedActionLoading === "next" ? "案内中..." : "次へ ▶"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] text-[#92400e] hover:bg-[#fff0f7]"
                          onClick={handlePhaseInsightRequest}
                          disabled={isPhaseInsightLoading || !activeSessionId}
                        >
                          {isPhaseInsightLoading && <Loader2 className="mr-0.5 h-2.5 w-2.5 animate-spin" />}
                          {isPhaseInsightLoading ? "判定中..." : "フェーズ判定"}
                        </Button>
                        {phaseInsight && (
                          <span className="text-[9px] text-[#b1637d]">{GUIDED_PHASE_LABELS[phaseInsight.phase]}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div
          ref={composerRef}
          className="sticky bottom-0 left-0 right-0 border-t border-[#ffd7e8] bg-white/95 px-4 pt-2 z-50"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)",
          }}
        >
          <div className="mx-auto max-w-3xl">
            {error && <p className="mb-2 text-xs font-medium text-[#92400e]">{error}</p>}
            <div className="flex items-end gap-3 rounded-3xl border border-[#ffd7e8] bg-white/90 px-4 py-3 shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={(event) => {
                  if (isMobile) {
                    setTimeout(() => {
                      event.target.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 300);
                  }
                }}
                placeholder="ミシェルに話しかける..."
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                disabled={isLoading.sending}
                className="max-h-40 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-base leading-relaxed text-[#7b364d] placeholder:text-[#c790a3] focus:outline-none disabled:opacity-60 md:text-sm"
                rows={1}
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading.sending || !input.trim() || hasPendingResponse}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#f472b6] to-[#fb7185] text-white shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading.sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-[#c07b8f]">ミシェルAIは誤った情報を生成する場合があります。</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SiddharthaChatClient;
