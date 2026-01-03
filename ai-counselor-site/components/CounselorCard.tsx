"use client";

import Image from "next/image";
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
    <div className="group flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <div className="flex items-center gap-4">
        <div className={cn(
          "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform group-hover:scale-105 overflow-hidden",
          getAvatarColor(counselor.id)
        )}>
          {counselor.iconUrl ? (
            <Image
              src={counselor.iconUrl}
              alt={counselor.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <span className="text-2xl font-bold text-white">{counselor.name.slice(0, 1)}</span>
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            {counselor.specialty}
          </p>
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{counselor.name}</h3>
        </div>
      </div>

      <p className="mt-5 flex-1 text-sm leading-relaxed text-slate-600">
        {counselor.description}
      </p>

      {counselor.tags && (
        <div className="mt-5 flex flex-wrap gap-2">
          {counselor.tags.map((tag) => (
            <span
              key={`${counselor.id}-${tag}`}
              className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">実績</span>
          <span className="font-bold text-slate-700">{formatNumber(counselor.sessionCount)}+</span>
        </div>
        
        <button
          type="button"
          onClick={handleSelect}
          disabled={isPending || !onSelect}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "..." : "相談する"}
        </button>
      </div>
    </div>
  );
}
