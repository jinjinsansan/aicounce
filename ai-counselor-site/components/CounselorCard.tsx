"use client";

import Image from "next/image";
import { useTransition } from "react";
import type { Counselor } from "@/types";
import { formatNumber } from "@/lib/utils";

interface CounselorCardProps {
  counselor: Counselor;
  onSelect?: (id: string) => void;
}

export default function CounselorCard({ counselor, onSelect }: CounselorCardProps) {
  const [isPending, startTransition] = useTransition();
  const isComingSoon = Boolean(counselor.comingSoon);

  const handleSelect = () => {
    if (!onSelect || isComingSoon) return;
    startTransition(() => onSelect(counselor.id));
  };

  return (
    <div className="group flex h-full flex-col rounded-2xl border-0 bg-white p-4 shadow-none transition-all duration-300 sm:rounded-3xl sm:border sm:border-slate-100 sm:p-6 sm:shadow-sm hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 shadow-md transition-transform group-hover:scale-105 overflow-hidden">
          {counselor.iconUrl ? (
            <Image
              src={counselor.iconUrl}
              alt={`${counselor.name}のアイコン`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <span className="text-2xl font-bold text-slate-400">{counselor.name.slice(0, 1)}</span>
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {counselor.specialty}
            </p>
            {isComingSoon && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700">
                準備中
              </span>
            )}
          </div>
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
          <span className="font-bold text-slate-700">{formatNumber(counselor.sessionCount ?? 0)}+</span>
        </div>
        
        <button
          type="button"
          onClick={handleSelect}
          disabled={isPending || !onSelect || isComingSoon}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isComingSoon ? "準備中" : isPending ? "..." : "相談する"}
        </button>
      </div>
    </div>
  );
}
