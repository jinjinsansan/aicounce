"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Loader2, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Counselor } from "@/types";
import type { DiscussionMessage, DiscussionStyleOption } from "@/types/discussion";
import { DISCUSSION_ROUND_OPTIONS, DISCUSSION_STYLES } from "@/lib/discussion/config";

interface AiDiscussionViewProps {
  counselors: Counselor[];
}

type RunningState = "idle" | "starting" | "continuing" | "summarizing";

const THINKING_MESSAGES = [
  "が考えています...",
  "が視点を整理しています...",
  "が論点を探しています...",
  "が言葉を選んでいます...",
];

const DISCUSSION_THEME = {
  gradientFrom: "#fdf4ff",
  gradientVia: "#fae8ff",
  gradientTo: "#f3e8ff",
  accent: "#9333ea",
  cardBorder: "border-purple-100",
  promptBorder: "border-purple-100",
  promptText: "text-purple-700",
  promptHoverBorder: "border-purple-300",
};

export default function AiDiscussionView({ counselors }: AiDiscussionViewProps) {
  const selectableCounselors = useMemo(
    () => counselors.filter((c) => !c.comingSoon),
    [counselors],
  );

  const [topic, setTopic] = useState("");
  const [debaterA, setDebaterA] = useState(selectableCounselors[0]?.id ?? "");
  const [debaterB, setDebaterB] = useState(selectableCounselors[1]?.id ?? "");
  const [moderator, setModerator] = useState(selectableCounselors[2]?.id ?? "");
  const [debaterAStyle, setDebaterAStyle] = useState("balanced");
  const [debaterBStyle, setDebaterBStyle] = useState("contrarian");
  const [moderatorStyle, setModeratorStyle] = useState("moderator_calm");
  const [rounds, setRounds] = useState<(typeof DISCUSSION_ROUND_OPTIONS)[number]>(3);

  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [state, setState] = useState<RunningState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [typingState, setTypingState] = useState<{ speakerName: string } | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const debaterStyles = useMemo(() => DISCUSSION_STYLES.filter((style) => style.role !== "moderator"), []);
  const moderatorStyles = useMemo(() => DISCUSSION_STYLES.filter((style) => style.role !== "debater"), []);

  const counselorById = useCallback(
    (id: string) => selectableCounselors.find((c) => c.id === id),
    [selectableCounselors],
  );

  const disableControls = state !== "idle";

  const gradientStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${DISCUSSION_THEME.gradientFrom} 0%, ${DISCUSSION_THEME.gradientVia} 50%, ${DISCUSSION_THEME.gradientTo} 100%)`,
      minHeight: "calc(100vh - 4rem)",
      height: "calc(100vh - 4rem)",
      maxHeight: "calc(100vh - 4rem)",
    }),
    [],
  );

  useEffect(() => {
    if (!typingState) return;
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [typingState]);

  useEffect(() => {
    if (messages.length > 0 || typingState) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, typingState]);

  const processStream = useCallback(
    async (response: Response) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("ストリームの読み取りに失敗しました");
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          try {
            const event = JSON.parse(data);
            if (event.type === "typing") {
              setTypingState({ speakerName: event.speakerName });
            } else if (event.type === "message") {
              setTypingState(null);
              setMessages((prev) => [...prev, event.message]);
            } else if (event.type === "done") {
              setTypingState(null);
            } else if (event.type === "error") {
              throw new Error(event.error ?? "エラーが発生しました");
            }
          } catch (parseError) {
            console.error("Failed to parse SSE event", parseError);
          }
        }
      }
    },
    [],
  );

  const handleStart = async () => {
    if (!topic.trim()) {
      setError("議題を入力してください");
      return;
    }
    if (!debaterA || !debaterB || debaterA === debaterB) {
      setError("異なるAIを2体選択してください");
      return;
    }
    setError(null);
    setMessages([]);
    setTypingState(null);
    setState("starting");
    setIsSettingsExpanded(false);
    try {
      const response = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          topic,
          rounds,
          debaterA: { id: debaterA, style: debaterAStyle },
          debaterB: { id: debaterB, style: debaterBStyle },
          moderator: moderator ? { id: moderator, style: moderatorStyle } : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error ?? "議論の開始に失敗しました");
      }

      await processStream(response);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "議論の開始に失敗しました");
      setTypingState(null);
    } finally {
      setState("idle");
    }
  };

  const handleExtend = async (extraRounds: number) => {
    if (!messages.length) {
      setError("まず議論を開始してください");
      return;
    }
    setError(null);
    setTypingState(null);
    setState("continuing");
    try {
      const response = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "continue",
          topic,
          rounds: extraRounds,
          debaterA: { id: debaterA, style: debaterAStyle },
          debaterB: { id: debaterB, style: debaterBStyle },
          moderator: moderator ? { id: moderator, style: moderatorStyle } : null,
          history: messages,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error ?? "追加ラウンドの生成に失敗しました");
      }
      await processStream(response);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "追加ラウンドの生成に失敗しました");
      setTypingState(null);
    } finally {
      setState("idle");
    }
  };

  const handleSummary = async () => {
    if (!moderator) {
      setError("まとめ役を選択してください");
      return;
    }
    if (!messages.length) {
      setError("まず議論を開始してください");
      return;
    }
    setError(null);
    setTypingState(null);
    setState("summarizing");
    try {
      const response = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summary",
          topic,
          debaterA: { id: debaterA, style: debaterAStyle },
          debaterB: { id: debaterB, style: debaterBStyle },
          moderator: { id: moderator, style: moderatorStyle },
          history: messages,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error ?? "まとめの生成に失敗しました");
      }
      await processStream(response);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "まとめの生成に失敗しました");
      setTypingState(null);
    } finally {
      setState("idle");
    }
  };

  const handleReset = () => {
    setMessages([]);
    setTypingState(null);
    setError(null);
    setTopic("");
    setIsSettingsExpanded(true);
  };

  const renderMessage = (message: DiscussionMessage) => {
    const counselor = counselorById(message.authorId);
    const isModeratorMessage = message.role === "moderator";

    return (
      <div key={message.id} className="flex gap-3">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Image
            src={message.authorIconUrl ?? counselor?.iconUrl ?? "/images/counselors/michelle.png"}
            alt={message.authorName}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>
        <div
          className={cn(
            "max-w-[85%] rounded-3xl border px-5 py-3 shadow-sm",
            isModeratorMessage ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
          )}
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900">{message.authorName}</span>
            <span className="text-xs text-slate-400">
              {new Date(message.createdAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{message.content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full border-t border-slate-200" style={gradientStyle}>
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 overflow-hidden p-4 sm:p-6">
        {/* ヘッダー */}
        <header className="rounded-[32px] border border-white/40 bg-white/90 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-600">AI Live Debate</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">AI議論ライブ</h1>
              <p className="mt-2 text-sm text-slate-600">
                専門知識を持つAI同士がリアルタイムで議論します。
              </p>
            </div>
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg"></div>
          </div>

          {/* 設定セクション */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="flex w-full items-center justify-between rounded-2xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-left transition hover:bg-purple-50"
            >
              <span className="text-sm font-semibold text-purple-900">議論設定</span>
              {isSettingsExpanded ? (
                <ChevronUp className="h-4 w-4 text-purple-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-purple-600" />
              )}
            </button>

            {isSettingsExpanded && (
              <div className="mt-4 space-y-4">
                {/* 議題 */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    議題
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="例：生成AIはクリエイティブ職を奪うのか？"
                    className="w-full rounded-2xl border-2 border-purple-200 bg-white px-4 py-3 text-sm leading-relaxed transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:ring-offset-0"
                    rows={3}
                    disabled={disableControls}
                  />
                </div>

                {/* ラウンド選択 */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    ラウンド数
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DISCUSSION_ROUND_OPTIONS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRounds(value)}
                        disabled={disableControls}
                        className={cn(
                          "rounded-full px-4 py-2 text-sm font-semibold transition",
                          rounds === value
                            ? "border-transparent bg-purple-600 text-white shadow-lg"
                            : "border border-purple-200 bg-white text-purple-700 hover:border-purple-300 hover:bg-purple-50",
                          disableControls && "opacity-60",
                        )}
                      >
                        {value}ラウンド
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI選択 */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <ParticipantSelector
                    label="AI 1"
                    counselors={selectableCounselors}
                    value={debaterA}
                    onChange={setDebaterA}
                    styleValue={debaterAStyle}
                    onStyleChange={setDebaterAStyle}
                    styles={debaterStyles}
                    disabled={disableControls}
                  />
                  <ParticipantSelector
                    label="AI 2"
                    counselors={selectableCounselors}
                    value={debaterB}
                    onChange={setDebaterB}
                    styleValue={debaterBStyle}
                    onStyleChange={setDebaterBStyle}
                    styles={debaterStyles}
                    disabled={disableControls}
                  />
                  <ParticipantSelector
                    label="まとめ役"
                    counselors={selectableCounselors}
                    value={moderator}
                    onChange={setModerator}
                    styleValue={moderatorStyle}
                    onStyleChange={setModeratorStyle}
                    styles={moderatorStyles}
                    disabled={disableControls}
                    optional
                  />
                </div>

                {/* アクションボタン */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleStart}
                    disabled={disableControls}
                    className="flex-1 rounded-full border-transparent shadow-lg"
                    style={{ backgroundColor: DISCUSSION_THEME.accent, color: "#ffffff" }}
                  >
                    {state === "starting" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        議論生成中...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        議論を開始
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={disableControls}
                    variant="outline"
                    className="rounded-full"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    リセット
                  </Button>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* メッセージエリア */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto rounded-[32px] border border-white/40 bg-white/90 p-6 shadow-2xl backdrop-blur-sm"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.length === 0 && !typingState && (
              <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-center">
                <div className={cn("rounded-3xl border px-6 py-4 shadow-sm", DISCUSSION_THEME.promptBorder)}>
                  <p className={cn("text-sm font-medium", DISCUSSION_THEME.promptText)}>
                    議題とAIを設定して「議論を開始」を押してください
                  </p>
                </div>
                <div className={cn("rounded-3xl border px-6 py-4 shadow-sm", DISCUSSION_THEME.promptBorder)}>
                  <p className={cn("text-sm font-medium", DISCUSSION_THEME.promptText)}>
                    専門知識を持つAI同士の白熱した議論を体験できます
                  </p>
                </div>
              </div>
            )}

            {messages.map(renderMessage)}

            {typingState && (
              <div className="flex gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                </div>
                <div className="flex max-w-[85%] items-center rounded-3xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                  <p className="text-sm text-slate-600">
                    {typingState.speakerName}
                    {THINKING_MESSAGES[thinkingIndex]}
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 追加コントロール */}
        {messages.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/40 bg-white/90 px-6 py-4 shadow-lg backdrop-blur-sm">
            <div className="flex flex-wrap gap-2">
              {DISCUSSION_ROUND_OPTIONS.map((value) => (
                <Button
                  key={`extend-${value}`}
                  onClick={() => handleExtend(value)}
                  disabled={state !== "idle"}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  <Plus className="mr-1 h-3 w-3" />+{value}ラウンド
                </Button>
              ))}
            </div>
            <Button
              onClick={handleSummary}
              disabled={state !== "idle" || !moderator}
              size="sm"
              className="rounded-full bg-emerald-600 hover:bg-emerald-500"
            >
              {state === "summarizing" ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  まとめ中...
                </>
              ) : (
                "まとめ役に依頼"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ParticipantSelectorProps {
  label: string;
  counselors: Counselor[];
  value: string;
  onChange: (value: string) => void;
  styleValue: string;
  onStyleChange: (value: string) => void;
  styles: DiscussionStyleOption[];
  disabled?: boolean;
  optional?: boolean;
}

function ParticipantSelector({
  label,
  counselors,
  value,
  onChange,
  styleValue,
  onStyleChange,
  styles,
  disabled,
  optional,
}: ParticipantSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label}
        {optional && <span className="ml-1 text-[10px] font-normal text-slate-400">(任意)</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border-2 border-purple-200 bg-white px-3 py-2 text-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:ring-offset-0"
        disabled={disabled}
      >
        {optional && <option value="">なし</option>}
        {!optional && !value && <option value="">選択してください</option>}
        {counselors.map((counselor) => (
          <option key={counselor.id} value={counselor.id}>
            {counselor.name}（{counselor.specialty}）
          </option>
        ))}
      </select>
      <select
        value={styleValue}
        onChange={(e) => onStyleChange(e.target.value)}
        className="w-full rounded-2xl border-2 border-purple-200 bg-white px-3 py-2 text-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:ring-offset-0"
        disabled={disabled}
      >
        {styles.map((style) => (
          <option key={style.value} value={style.value}>
            {style.label} — {style.description}
          </option>
        ))}
      </select>
    </div>
  );
}
