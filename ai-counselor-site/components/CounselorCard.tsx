"use client";

import { useTransition } from "react";
import type { Counselor } from "@/types";
import { cn, formatNumber } from "@/lib/utils";

interface CounselorCardProps {
  counselor: Counselor;
  onSelect?: (id: string) => void;
}

export default function CounselorCard({ counselor, onSelect }: CounselorCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleSelect = () => {
    if (!onSelect) return;
    startTransition(() => onSelect(counselor.id));
  };

  const getAvatarColor = (id: string) => {
    switch (id) {
      case "michele": return "from-orange-400 to-pink-500";
      case "sato": return "from-blue-600 to-sky-400";
      case "alex": return "from-slate-500 to-slate-400";
      case "nana": return "from-green-500 to-emerald-400";
      case "yuki": return "from-purple-300 to-cyan-300";
      case "iris": return "from-indigo-400 via-purple-400 to-pink-400";
      case "adam": return "from-yellow-500 to-amber-600";
      case "gemini": return "from-blue-500 to-purple-500";
      case "claude": return "from-slate-900 to-purple-900";
      case "deep": return "from-blue-900 to-slate-900";
      default: return "from-blue-500 to-indigo-500";
    }
  };

  return (
    <div className="group flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <div className="flex items-center gap-4">
        <div className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white shadow-sm",
          getAvatarColor(counselor.id)
        )}>
          {counselor.name.slice(0, 1)}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {counselor.specialty}
          </p>
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{counselor.name}</h3>
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm text-slate-600">{counselor.description}</p>

      {counselor.tags && (
        <div className="mt-4 flex flex-wrap gap-2">
          {counselor.tags.map((tag) => (
            <span
              key={`${counselor.id}-${tag}`}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
        {typeof counselor.sessionCount === "number" && (
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">相談実績</p>
            <p className="font-semibold text-slate-900">
              {formatNumber(counselor.sessionCount)}+
            </p>
          </div>
        )}
        {counselor.responseTime && (
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">平均応答</p>
            <p className="font-semibold text-slate-900">{counselor.responseTime}</p>
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">モデル</p>
          <p className="font-semibold text-slate-900">{counselor.modelType?.toUpperCase()}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            counselor.ragEnabled
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          )}
        >
          {counselor.ragEnabled ? "RAG対応" : "LLM単体"}
        </div>
        <button
          type="button"
          onClick={handleSelect}
          disabled={isPending || !onSelect}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "準備中..." : "チャットを開始"}
        </button>
      </div>
    </div>
  );
}
