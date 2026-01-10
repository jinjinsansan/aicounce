"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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

  const debaterStyles = useMemo(() => DISCUSSION_STYLES.filter((style) => style.role !== "moderator"), []);
  const moderatorStyles = useMemo(() => DISCUSSION_STYLES.filter((style) => style.role !== "debater"), []);

  const counselorById = useCallback(
    (id: string) => selectableCounselors.find((c) => c.id === id),
    [selectableCounselors],
  );

  const disableControls = state !== "idle";

  useEffect(() => {
    if (!typingState) return;
    const interval = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [typingState]);

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

  const renderMessage = (message: DiscussionMessage) => {
    const fallback = counselorById(message.authorId);
    return (
      <div key={message.id} className="flex gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200">
          <Image
            src={message.authorIconUrl ?? fallback?.iconUrl ?? "/images/counselors/michelle.png"}
            alt={message.authorName}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{message.authorName}</span>
            <span className="text-xs text-slate-400">
              {new Date(message.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{message.content}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">議題</label>
              <textarea
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="例：生成AIはクリエイティブ職を奪うのか？"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                rows={3}
                disabled={disableControls}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">ラウンド</p>
              <div className="flex flex-wrap gap-2">
                {DISCUSSION_ROUND_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRounds(value)}
                    disabled={disableControls}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold",
                      rounds === value
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      disableControls && "opacity-60",
                    )}
                  >
                    {value}ラウンド
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
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
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStart}
            disabled={disableControls}
            className="flex-1 rounded-full bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {state === "starting" ? "議論生成中..." : "議論を開始"}
          </button>
          <button
            type="button"
            onClick={() => setTopic("")}
            disabled={disableControls}
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            リセット
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">議論ログ</h2>
          <div className="flex flex-wrap gap-2">
            {DISCUSSION_ROUND_OPTIONS.map((value) => (
              <button
                key={`extend-${value}`}
                type="button"
                onClick={() => handleExtend(value)}
                disabled={state !== "idle" || !messages.length}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                +{value}ラウンド
              </button>
            ))}
            <button
              type="button"
              onClick={handleSummary}
              disabled={state !== "idle" || !messages.length || !moderator}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              {state === "summarizing" ? "まとめ中..." : "まとめ役に依頼"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {messages.length === 0 && !typingState && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
              まだ議論は始まっていません。お題とAIを設定して「議論を開始」を押してください。
            </div>
          )}
          {messages.map(renderMessage)}
          {typingState && (
            <div className="flex gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
              <div className="flex flex-1 items-center">
                <p className="text-sm text-slate-500">
                  {typingState.speakerName}
                  {THINKING_MESSAGES[thinkingIndex]}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
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
      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {label}
        {optional && <span className="ml-1 text-[10px] font-normal text-slate-400">任意</span>}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
        disabled={disabled}
      >
        {!optional && !value && <option value="">選択してください</option>}
        {optional && <option value="">なし</option>}
        {counselors.map((counselor) => (
          <option key={counselor.id} value={counselor.id}>
            {counselor.name}（{counselor.specialty}）
          </option>
        ))}
      </select>
      <select
        value={styleValue}
        onChange={(event) => onStyleChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
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
